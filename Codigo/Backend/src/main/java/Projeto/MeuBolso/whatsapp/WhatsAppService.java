package Projeto.MeuBolso.whatsapp;

import Projeto.MeuBolso.model.Usuario;
import Projeto.MeuBolso.repository.UsuarioRepository;
import Projeto.MeuBolso.util.Telefone;
import Projeto.MeuBolso.whatsapp.ConversaWhatsApp.Etapa;

import java.text.Normalizer;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * Orquestra o atendimento de uma mensagem do WhatsApp:
 * identifica o usuário pelo telefone, carrega o estado da conversa, aplica o
 * timeout, roda o {@link FluxoChatbot}, salva o estado e envia a resposta.
 */
@Service
public class WhatsAppService {

    private static final Logger log = LoggerFactory.getLogger(WhatsAppService.class);

    /** Sem resposta por este tempo, a operação em andamento é descartada. */
    static final Duration TIMEOUT = Duration.ofMinutes(10);

    static final String NAO_CADASTRADO = """
        Olá! Eu sou o bot do Meu Bolso. 💰

        Não encontrei uma conta do Meu Bolso com este número de telefone.
        Confira se o telefone no seu perfil do site é o mesmo deste WhatsApp (com DDD) e tente de novo.""";

    private final ConversaWhatsAppRepository conversaRepository;
    private final UsuarioRepository usuarioRepository;
    private final WahaClient waha;
    private final FluxoChatbot fluxo;
    private final Clock clock;

    // Proteções para quando o bot roda num número pessoal (ver application.properties):
    // - palavraAtivacao: sem conversa em andamento, o bot só responde se a mensagem
    //   contiver esta palavra (vazio = qualquer mensagem chama o bot);
    // - responderNaoCadastrados: se false, números sem conta no Meu Bolso não recebem resposta.
    private final String palavraAtivacao;
    private final boolean responderNaoCadastrados;

    public WhatsAppService(ConversaWhatsAppRepository conversaRepository,
                           UsuarioRepository usuarioRepository,
                           WahaClient waha,
                           OperacoesChatbot operacoes,
                           Clock clock,
                           @Value("${app.whatsapp.palavra-ativacao:meu bolso}") String palavraAtivacao,
                           @Value("${app.whatsapp.responder-nao-cadastrados:false}") boolean responderNaoCadastrados) {
        this.conversaRepository = conversaRepository;
        this.usuarioRepository = usuarioRepository;
        this.waha = waha;
        this.fluxo = new FluxoChatbot(operacoes, palavraAtivacao);
        this.clock = clock;
        this.palavraAtivacao = palavraAtivacao == null ? "" : palavraAtivacao;
        this.responderNaoCadastrados = responderNaoCadastrados;
    }

    /**
     * true se o texto contém a palavra de ativação, ignorando maiúsculas,
     * acentos e espaços ("Meu Bolso", "meubolso", "MEU  BOLSO!"). Palavra vazia = sempre true.
     */
    static boolean contemPalavraAtivacao(String texto, String palavra) {
        String alvo = simplificar(palavra);
        if (alvo.isEmpty()) return true;
        return simplificar(texto).contains(alvo);
    }

    private static String simplificar(String s) {
        if (s == null) return "";
        String semAcento = Normalizer.normalize(s, Normalizer.Form.NFD).replaceAll("\\p{M}", "");
        return semAcento.toLowerCase(Locale.ROOT).replaceAll("\\s+", "");
    }

    /**
     * Atende uma mensagem fora da thread do webhook (o WAHA recebe 200 na hora).
     * Sincronizado: com poucos usuários, serializar evita que duas mensagens
     * seguidas do mesmo chat disputem o mesmo estado.
     */
    @Async
    public synchronized void atender(MensagemRecebida msg) {
        try {
            String resposta = processar(msg);
            if (resposta != null) waha.enviarTexto(msg.chatId(), resposta);
        } catch (RuntimeException e) {
            log.error("Erro ao atender mensagem do WhatsApp de {}", msg.chatId(), e);
            waha.enviarTexto(msg.chatId(), "Ops, tive um problema ao processar sua mensagem. Envie 0 para voltar ao menu.");
        }
    }

    /** Processa a mensagem e devolve a resposta (null = não responder). */
    String processar(MensagemRecebida msg) {
        ConversaWhatsApp conversa = conversaRepository.findById(msg.chatId())
            .orElseGet(() -> new ConversaWhatsApp(msg.chatId()));

        // O WAHA pode reenviar o mesmo evento: processa cada mensagem uma vez só.
        if (!msg.id().isEmpty() && msg.id().equals(conversa.getUltimaMensagemId())) {
            return null;
        }

        Instant agora = clock.instant();
        boolean expirou = false;
        if (conversa.getAtualizadoEm() != null
                && conversa.getEtapa() != Etapa.OCIOSO
                && conversa.getAtualizadoEm().plus(TIMEOUT).isBefore(agora)) {
            // Havia algo em andamento além do menu? Avisa que expirou.
            expirou = conversa.getEtapa() != Etapa.MENU;
            conversa.limparOperacao(Etapa.OCIOSO);
            conversa.setUsuarioId(null); // reidentifica (o telefone pode ter mudado)
        }

        // Palavra de ativação: sem conversa em andamento, só inicia se a mensagem
        // tiver a palavra. Mensagens comuns nem consultam o usuário nem gravam nada.
        boolean ocioso = conversa.getEtapa() == null || conversa.getEtapa() == Etapa.OCIOSO;
        if (ocioso && !contemPalavraAtivacao(msg.texto(), palavraAtivacao)) {
            return null;
        }

        Usuario usuario = conversa.getUsuarioId() == null
            ? null
            : usuarioRepository.findById(conversa.getUsuarioId()).orElse(null);
        if (usuario == null) {
            usuario = identificar(msg.chatId()).orElse(null);
            if (usuario == null) {
                log.info("WhatsApp: número sem cadastro ({})", msg.chatId());
                return responderNaoCadastrados ? NAO_CADASTRADO : null;
            }
            conversa.limparOperacao(Etapa.OCIOSO);
            conversa.setUsuarioId(usuario.getId());
        }

        String resposta = fluxo.processar(conversa, msg.texto(), usuario.getNome());
        if (expirou) {
            resposta = "Sua operação anterior foi cancelada por inatividade.\n\n" + resposta;
        }

        conversa.setUltimaMensagemId(msg.id());
        conversa.setAtualizadoEm(agora);
        conversaRepository.save(conversa);
        return resposta;
    }

    /**
     * Acha o usuário pelo número do chat. Se o chat vier como LID (identificador
     * anônimo do WhatsApp), pede o número ao WAHA. Compara com e sem o nono dígito.
     */
    Optional<Usuario> identificar(String chatId) {
        Optional<String> telefone = chatId.endsWith("@lid")
            ? waha.telefoneDoLid(chatId)
            : Optional.of(chatId.replaceAll("@.*$", ""));
        if (telefone.isEmpty()) return Optional.empty();

        List<Usuario> encontrados = usuarioRepository.findByTelefoneIn(Telefone.variantes(telefone.get()));
        if (encontrados.size() > 1) {
            log.warn("WhatsApp: {} usuários com o mesmo telefone; usando o primeiro.", encontrados.size());
        }
        return encontrados.stream().findFirst();
    }
}
