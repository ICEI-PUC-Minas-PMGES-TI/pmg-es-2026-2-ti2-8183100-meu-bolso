package Projeto.MeuBolso.whatsapp;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import Projeto.MeuBolso.model.Usuario;
import Projeto.MeuBolso.repository.UsuarioRepository;
import Projeto.MeuBolso.whatsapp.ConversaWhatsApp.Etapa;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * Proteções para o número pessoal: palavra de ativação e silêncio para quem
 * não tem cadastro. Só os repositórios (interfaces) são mockados; o chat usa
 * "@c.us", então o WAHA não é chamado.
 */
@ExtendWith(MockitoExtension.class)
class WhatsAppServiceTest {

    private static final String CHAT = "5531997186768@c.us";
    private static final Instant AGORA = Instant.parse("2026-10-21T15:00:00Z");

    @Mock ConversaWhatsAppRepository conversaRepository;
    @Mock UsuarioRepository usuarioRepository;

    Usuario usuario;

    @BeforeEach
    void preparar() {
        usuario = new Usuario("Gabriel Hermont", "g@teste.com", "31997186768", "hash");
        usuario.setId("u1");
    }

    @Test
    void mensagemComumSemConversaEmAndamentoEhIgnorada() {
        when(conversaRepository.findById(CHAT)).thenReturn(Optional.empty());

        assertThat(servico("meu bolso", false).processar(msg("oi, tudo bem?"))).isNull();

        verify(usuarioRepository, never()).findByTelefoneIn(anyCollection());
        verify(conversaRepository, never()).save(any());
    }

    @Test
    void palavraDeAtivacaoIniciaAConversaIgnorandoAcentoEMaiuscula() {
        when(conversaRepository.findById(CHAT)).thenReturn(Optional.empty());
        when(usuarioRepository.findByTelefoneIn(anyCollection())).thenReturn(List.of(usuario));

        String r = servico("meu bolso", false).processar(msg("Oi MEU BÔLSO!"));

        assertThat(r).startsWith("Olá, Gabriel!").contains("O que você deseja fazer?");
        verify(conversaRepository).save(any());
    }

    @Test
    void conversaEmAndamentoNaoPrecisaDaPalavra() {
        ConversaWhatsApp c = new ConversaWhatsApp(CHAT);
        c.setUsuarioId("u1");
        c.setEtapa(Etapa.MENU);
        c.setAtualizadoEm(AGORA.minusSeconds(60));
        when(conversaRepository.findById(CHAT)).thenReturn(Optional.of(c));
        when(usuarioRepository.findById("u1")).thenReturn(Optional.of(usuario));

        assertThat(servico("meu bolso", false).processar(msg("6"))).contains("Seus saldos");
    }

    @Test
    void conversaExpiradaVoltaAExigirAPalavra() {
        ConversaWhatsApp c = new ConversaWhatsApp(CHAT);
        c.setUsuarioId("u1");
        c.setEtapa(Etapa.VALOR);
        c.setAtualizadoEm(AGORA.minus(WhatsAppService.TIMEOUT).minusSeconds(1));
        when(conversaRepository.findById(CHAT)).thenReturn(Optional.of(c));

        assertThat(servico("meu bolso", false).processar(msg("50"))).isNull();
        verify(conversaRepository, never()).save(any());
    }

    @Test
    void naoCadastradoFicaSemRespostaPorPadrao() {
        when(conversaRepository.findById(CHAT)).thenReturn(Optional.empty());
        when(usuarioRepository.findByTelefoneIn(anyCollection())).thenReturn(List.of());

        assertThat(servico("meu bolso", false).processar(msg("meu bolso"))).isNull();
        verify(conversaRepository, never()).save(any());
    }

    @Test
    void comNumeroDedicadoQualquerMensagemChamaEONaoCadastradoEhAvisado() {
        when(conversaRepository.findById(CHAT)).thenReturn(Optional.empty());
        when(usuarioRepository.findByTelefoneIn(anyCollection())).thenReturn(List.of());

        assertThat(servico("", true).processar(msg("oi"))).isEqualTo(WhatsAppService.NAO_CADASTRADO);
    }

    @Test
    void comparacaoDaPalavraDeAtivacao() {
        assertThat(WhatsAppService.contemPalavraAtivacao("Quero usar o MeuBolso", "meu bolso")).isTrue();
        assertThat(WhatsAppService.contemPalavraAtivacao("meu  bolso", "Meu Bolso")).isTrue();
        assertThat(WhatsAppService.contemPalavraAtivacao("bolsa", "meu bolso")).isFalse();
        assertThat(WhatsAppService.contemPalavraAtivacao(null, "meu bolso")).isFalse();
        assertThat(WhatsAppService.contemPalavraAtivacao("qualquer coisa", "")).isTrue();
        assertThat(WhatsAppService.contemPalavraAtivacao("qualquer coisa", null)).isTrue();
    }

    private WhatsAppService servico(String palavra, boolean responderNaoCadastrados) {
        // URL inválida de propósito: nenhum destes cenários chama o WAHA.
        WahaClient waha = new WahaClient("http://localhost:1", "default", "");
        Clock clock = Clock.fixed(AGORA, ZoneId.of("America/Sao_Paulo"));
        return new WhatsAppService(conversaRepository, usuarioRepository, waha,
            new FluxoChatbotTest.OperacoesFalsas(), clock, palavra, responderNaoCadastrados);
    }

    private static MensagemRecebida msg(String texto) {
        return new MensagemRecebida("id-" + texto.hashCode(), CHAT, texto);
    }
}
