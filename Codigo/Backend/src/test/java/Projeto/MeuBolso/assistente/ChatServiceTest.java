package Projeto.MeuBolso.assistente;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import Projeto.MeuBolso.assistente.AssistenteService.PerguntaResumo;
import Projeto.MeuBolso.assistente.AssistenteService.RespostaAssistente;
import Projeto.MeuBolso.assistente.ChatService.ChatResponse;
import Projeto.MeuBolso.assistente.ia.ClienteIA;
import Projeto.MeuBolso.assistente.ia.FerramentaIA;
import Projeto.MeuBolso.assistente.ia.LimitadorUsoIA;
import Projeto.MeuBolso.assistente.ia.LimiteUsoException;
import Projeto.MeuBolso.assistente.ia.MensagemChat;
import Projeto.MeuBolso.assistente.ia.ResultadoIA;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

class ChatServiceTest {

    private static final String USUARIO = "u1";

    private ClienteIA clienteIA;
    private AssistenteService assistenteService;
    private LimitadorUsoIA limitador;
    private ChatService service;

    @BeforeEach
    void setUp() {
        clienteIA = org.mockito.Mockito.mock(ClienteIA.class);
        assistenteService = org.mockito.Mockito.mock(AssistenteService.class);
        limitador = org.mockito.Mockito.mock(LimitadorUsoIA.class);
        when(limitador.registrarUso(anyString())).thenReturn(9);
        service = new ChatService(clienteIA, assistenteService, limitador, List.of());
    }

    // Cria um service com uma consulta extra (gastos_recentes) injetada.
    private ChatService comConsulta(FerramentaConsulta consulta) {
        return new ChatService(clienteIA, assistenteService, limitador, List.of(consulta));
    }

    private static List<MensagemChat> uma(String texto) {
        return List.of(new MensagemChat("user", texto));
    }

    private static PerguntaResumo perguntaSaldo() {
        return new PerguntaResumo("saldo_mes", "Qual é o meu saldo deste mês?", List.of());
    }

    @Test
    void iaRespondeTextoNaoChamaAssistente() {
        when(assistenteService.listar(USUARIO)).thenReturn(List.of(perguntaSaldo()));
        when(clienteIA.gerarComFerramentas(anyString(), anyList(), anyList()))
            .thenReturn(ResultadoIA.deTexto("Sou o Jarvis."));

        ChatResponse r = service.responder(USUARIO, uma("oi, o que você faz?"));

        assertThat(r.resposta()).isEqualTo("Sou o Jarvis.");
        assertThat(r.ferramenta()).isNull();
        verify(assistenteService, never()).responder(anyString(), anyString(), any());
        verify(clienteIA, times(1)).gerarComFerramentas(anyString(), anyList(), anyList());
    }

    @Test
    void iaEscolheFerramentaValidaComArgumento() {
        PerguntaResumo meta = new PerguntaResumo("meta_faltante", "Quanto falta para minha meta?", List.of());
        when(assistenteService.listar(USUARIO)).thenReturn(List.of(meta));
        when(clienteIA.gerarComFerramentas(anyString(), anyList(), anyList()))
            .thenReturn(ResultadoIA.deFerramenta("meta_faltante", Map.of("metaId", "m1")));
        when(assistenteService.responder(eq(USUARIO), eq("meta_faltante"), any()))
            .thenReturn(new RespostaAssistente("Faltam R$ 100,00.", Map.of(), "aviso"));

        ChatResponse r = service.responder(USUARIO, uma("quanto falta para a viagem?"));

        assertThat(r.resposta()).isEqualTo("Faltam R$ 100,00.");
        assertThat(r.ferramenta()).isEqualTo("meta_faltante");

        @SuppressWarnings("unchecked")
        ArgumentCaptor<Map<String, String>> args = ArgumentCaptor.forClass(Map.class);
        verify(assistenteService).responder(eq(USUARIO), eq("meta_faltante"), args.capture());
        assertThat(args.getValue()).containsEntry("metaId", "m1");
        verify(clienteIA, times(1)).gerarComFerramentas(anyString(), anyList(), anyList());
    }

    @Test
    void ferramentaDesconhecidaDevolveMensagemAmigavel() {
        when(assistenteService.listar(USUARIO)).thenReturn(List.of(perguntaSaldo()));
        when(clienteIA.gerarComFerramentas(anyString(), anyList(), anyList()))
            .thenReturn(ResultadoIA.deFerramenta("nao_existe", Map.of()));

        ChatResponse r = service.responder(USUARIO, uma("faz algo"));

        assertThat(r.resposta()).contains("Não consegui entender");
        assertThat(r.ferramenta()).isNull();
        verify(assistenteService, never()).responder(anyString(), anyString(), any());
        verify(clienteIA, times(1)).gerarComFerramentas(anyString(), anyList(), anyList());
    }

    @Test
    void erro400DoAssistenteViraRespostaAmigavelComMotivo() {
        when(assistenteService.listar(USUARIO)).thenReturn(List.of(perguntaSaldo()));
        when(clienteIA.gerarComFerramentas(anyString(), anyList(), anyList()))
            .thenReturn(ResultadoIA.deFerramenta("saldo_mes", Map.of()));
        when(assistenteService.responder(eq(USUARIO), eq("saldo_mes"), any()))
            .thenThrow(new ResponseStatusException(HttpStatus.BAD_REQUEST, "Parâmetro obrigatório: metaId"));

        ChatResponse r = service.responder(USUARIO, uma("saldo?"));

        assertThat(r.resposta()).isEqualTo("Parâmetro obrigatório: metaId");
        assertThat(r.ferramenta()).isNull();
        verify(clienteIA, times(1)).gerarComFerramentas(anyString(), anyList(), anyList());
    }

    @Test
    void listaDeFerramentasVaziaSegueOFluxo() {
        when(assistenteService.listar(USUARIO)).thenReturn(List.of());
        when(clienteIA.gerarComFerramentas(anyString(), anyList(), anyList()))
            .thenReturn(ResultadoIA.deTexto("Posso consultar gastos, receitas, metas..."));

        ChatResponse r = service.responder(USUARIO, uma("oi"));

        assertThat(r.resposta()).contains("Posso consultar");

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<FerramentaIA>> ferramentas = ArgumentCaptor.forClass(List.class);
        verify(clienteIA, times(1)).gerarComFerramentas(anyString(), anyList(), ferramentas.capture());
        assertThat(ferramentas.getValue()).isEmpty();
    }

    @Test
    void usuarioIdNuncaVaiNosArgumentosEnviadosAoCliente() {
        when(assistenteService.listar(USUARIO)).thenReturn(List.of(perguntaSaldo()));
        when(clienteIA.gerarComFerramentas(anyString(), anyList(), anyList()))
            .thenReturn(ResultadoIA.deTexto("ok"));

        service.responder(USUARIO, uma("oi, tudo bem?"));

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<MensagemChat>> historico = ArgumentCaptor.forClass(List.class);
        verify(clienteIA).gerarComFerramentas(anyString(), historico.capture(), anyList());
        assertThat(historico.getValue())
            .noneMatch(m -> m.texto().contains(USUARIO));
    }

    @Test
    void entradaInvalidaNaoChamaOLimitador() {
        org.junit.jupiter.api.Assertions.assertThrows(IllegalArgumentException.class,
            () -> service.responder(USUARIO, List.of()));

        verify(limitador, never()).registrarUso(anyString());
        verify(clienteIA, never()).gerarComFerramentas(anyString(), anyList(), anyList());
    }

    @Test
    void limiteAtingidoImpedeChamadaAIa() {
        when(limitador.registrarUso(USUARIO)).thenThrow(new LimiteUsoException("estourou"));

        org.junit.jupiter.api.Assertions.assertThrows(LimiteUsoException.class,
            () -> service.responder(USUARIO, uma("oi")));

        verify(clienteIA, never()).gerarComFerramentas(anyString(), anyList(), anyList());
    }

    @Test
    void restantesHojeVemNaResposta() {
        when(limitador.registrarUso(USUARIO)).thenReturn(7);
        when(assistenteService.listar(USUARIO)).thenReturn(List.of(perguntaSaldo()));
        when(clienteIA.gerarComFerramentas(anyString(), anyList(), anyList()))
            .thenReturn(ResultadoIA.deTexto("oi"));

        ChatResponse r = service.responder(USUARIO, uma("oi"));

        assertThat(r.restantesHoje()).isEqualTo(7);
    }

    @Test
    void historicoAcimaDe4000CaracteresECortadoMantendoAUltima() {
        when(assistenteService.listar(USUARIO)).thenReturn(List.of(perguntaSaldo()));
        when(clienteIA.gerarComFerramentas(anyString(), anyList(), anyList()))
            .thenReturn(ResultadoIA.deTexto("ok"));

        // 10 mensagens de 450 caracteres (cada uma < 500, mas o total = 4500 > 4000):
        // o histórico enviado deve ficar dentro de 4000 e manter a última.
        String bloco = "a".repeat(450);
        List<MensagemChat> mensagens = new java.util.ArrayList<>();
        for (int i = 0; i < 9; i++) {
            mensagens.add(i % 2 == 0 ? new MensagemChat("user", bloco) : new MensagemChat("assistant", bloco));
        }
        mensagens.add(new MensagemChat("user", "ultima " + bloco));

        service.responder(USUARIO, mensagens);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<MensagemChat>> historico = ArgumentCaptor.forClass(List.class);
        verify(clienteIA).gerarComFerramentas(anyString(), historico.capture(), anyList());

        List<MensagemChat> enviado = historico.getValue();
        int total = enviado.stream().mapToInt(m -> m.texto().length()).sum();
        assertThat(total).isLessThanOrEqualTo(4000);
        assertThat(enviado).hasSizeLessThan(10);
        assertThat(enviado.get(enviado.size() - 1).texto()).startsWith("ultima ");
    }

    // Consulta de chat controlável, com disponibilidade e execução configuráveis.
    private static final class ConsultaFake implements FerramentaConsulta {
        private final String id;
        private final boolean disponivel;
        private RespostaPronta resposta = new RespostaPronta("ok consulta", Map.of());
        private RuntimeException erro;
        private List<ParametroPergunta> parametros = List.of();
        String usuarioRecebido;
        Map<String, String> argsRecebidos;

        ConsultaFake(String id, boolean disponivel) {
            this.id = id;
            this.disponivel = disponivel;
        }

        @Override public String id() { return id; }
        @Override public String descricao() { return "consulta " + id; }
        @Override public boolean disponivel(String usuarioId) { return disponivel; }
        @Override public List<ParametroPergunta> parametros(String usuarioId) { return parametros; }

        @Override
        public RespostaPronta executar(String usuarioId, Map<String, String> params) {
            this.usuarioRecebido = usuarioId;
            this.argsRecebidos = params;
            if (erro != null) throw erro;
            return resposta;
        }
    }

    @Test
    void parametroTextoVaiAoClienteSemValoresPermitidos() {
        ConsultaFake consulta = new ConsultaFake("gastos_periodo", true);
        consulta.parametros = List.of(
            new ParametroPergunta("categoria", "Categoria (opcional)", "texto", List.of()));
        when(assistenteService.listar(USUARIO)).thenReturn(List.of());
        when(clienteIA.gerarComFerramentas(anyString(), anyList(), anyList()))
            .thenReturn(ResultadoIA.deTexto("oi"));

        comConsulta(consulta).responder(USUARIO, uma("oi"));

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<FerramentaIA>> ferramentas = ArgumentCaptor.forClass(List.class);
        verify(clienteIA, times(1)).gerarComFerramentas(anyString(), anyList(), ferramentas.capture());
        FerramentaIA f = ferramentas.getValue().stream()
            .filter(x -> x.nome().equals("gastos_periodo")).findFirst().orElseThrow();
        assertThat(f.parametros().get(0).valoresPermitidos()).isEmpty();
    }

    @Test
    void duasConsultasVaoAoClienteEAEscolhidaRecebeOsArgumentos() {
        ConsultaFake gastos = new ConsultaFake("gastos_periodo", true);
        ConsultaFake receitas = new ConsultaFake("receitas_periodo", true);
        when(assistenteService.listar(USUARIO)).thenReturn(List.of());
        when(clienteIA.gerarComFerramentas(anyString(), anyList(), anyList()))
            .thenReturn(ResultadoIA.deFerramenta("receitas_periodo", Map.of("periodo", "mes_atual")));

        ChatService service = new ChatService(clienteIA, assistenteService, limitador, List.of(gastos, receitas));
        ChatResponse r = service.responder(USUARIO, uma("quanto recebi este mês?"));

        assertThat(r.ferramenta()).isEqualTo("receitas_periodo");
        assertThat(receitas.usuarioRecebido).isEqualTo(USUARIO);
        assertThat(receitas.argsRecebidos).containsEntry("periodo", "mes_atual");
        assertThat(gastos.usuarioRecebido).isNull();

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<FerramentaIA>> ferramentas = ArgumentCaptor.forClass(List.class);
        verify(clienteIA, times(1)).gerarComFerramentas(anyString(), anyList(), ferramentas.capture());
        assertThat(ferramentas.getValue()).extracting(FerramentaIA::nome)
            .contains("gastos_periodo", "receitas_periodo");
    }

    @Test
    void argumentosPeriodoECategoriaChegamAoExecutar() {
        ConsultaFake consulta = new ConsultaFake("gastos_periodo", true);
        when(assistenteService.listar(USUARIO)).thenReturn(List.of());
        when(clienteIA.gerarComFerramentas(anyString(), anyList(), anyList()))
            .thenReturn(ResultadoIA.deFerramenta("gastos_periodo",
                Map.of("periodo", "ultimos_7_dias", "categoria", "Alimentação")));

        comConsulta(consulta).responder(USUARIO, uma("quanto gastei com alimentação?"));

        assertThat(consulta.argsRecebidos)
            .containsEntry("periodo", "ultimos_7_dias")
            .containsEntry("categoria", "Alimentação");
        verify(clienteIA, times(1)).gerarComFerramentas(anyString(), anyList(), anyList());
    }

    @Test
    void consultaDisponivelVaiAoClienteJuntoComAsPerguntas() {
        ConsultaFake consulta = new ConsultaFake("gastos_recentes", true);
        when(assistenteService.listar(USUARIO)).thenReturn(List.of(perguntaSaldo()));
        when(clienteIA.gerarComFerramentas(anyString(), anyList(), anyList()))
            .thenReturn(ResultadoIA.deTexto("oi"));

        comConsulta(consulta).responder(USUARIO, uma("oi"));

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<FerramentaIA>> ferramentas = ArgumentCaptor.forClass(List.class);
        verify(clienteIA, times(1)).gerarComFerramentas(anyString(), anyList(), ferramentas.capture());
        assertThat(ferramentas.getValue()).extracting(FerramentaIA::nome)
            .contains("saldo_mes", "gastos_recentes");
    }

    @Test
    void consultaIndisponivelEOmitida() {
        ConsultaFake consulta = new ConsultaFake("gastos_recentes", false);
        when(assistenteService.listar(USUARIO)).thenReturn(List.of(perguntaSaldo()));
        when(clienteIA.gerarComFerramentas(anyString(), anyList(), anyList()))
            .thenReturn(ResultadoIA.deTexto("oi"));

        comConsulta(consulta).responder(USUARIO, uma("oi"));

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<FerramentaIA>> ferramentas = ArgumentCaptor.forClass(List.class);
        verify(clienteIA, times(1)).gerarComFerramentas(anyString(), anyList(), ferramentas.capture());
        assertThat(ferramentas.getValue()).extracting(FerramentaIA::nome)
            .doesNotContain("gastos_recentes");
    }

    @Test
    void iaEscolheConsultaChamaExecutarENaoOAssistente() {
        ConsultaFake consulta = new ConsultaFake("gastos_recentes", true);
        consulta.resposta = new RespostaPronta("Seus últimos 5 gastos: ...", Map.of());
        when(assistenteService.listar(USUARIO)).thenReturn(List.of(perguntaSaldo()));
        when(clienteIA.gerarComFerramentas(anyString(), anyList(), anyList()))
            .thenReturn(ResultadoIA.deFerramenta("gastos_recentes", Map.of("quantidade", "10")));

        ChatResponse r = comConsulta(consulta).responder(USUARIO, uma("meus últimos gastos"));

        assertThat(r.ferramenta()).isEqualTo("gastos_recentes");
        assertThat(r.resposta()).startsWith("Seus últimos");
        assertThat(consulta.usuarioRecebido).isEqualTo(USUARIO);
        assertThat(consulta.argsRecebidos).containsEntry("quantidade", "10");
        verify(assistenteService, never()).responder(anyString(), anyString(), any());
        verify(clienteIA, times(1)).gerarComFerramentas(anyString(), anyList(), anyList());
    }

    @Test
    void illegalArgumentDaConsultaViraRespostaAmigavel() {
        ConsultaFake consulta = new ConsultaFake("gastos_recentes", true);
        consulta.erro = new IllegalArgumentException("Quantidade inválida.");
        when(assistenteService.listar(USUARIO)).thenReturn(List.of());
        when(clienteIA.gerarComFerramentas(anyString(), anyList(), anyList()))
            .thenReturn(ResultadoIA.deFerramenta("gastos_recentes", Map.of()));

        ChatResponse r = comConsulta(consulta).responder(USUARIO, uma("gastos"));

        assertThat(r.resposta()).isEqualTo("Quantidade inválida.");
        assertThat(r.ferramenta()).isNull();
        verify(clienteIA, times(1)).gerarComFerramentas(anyString(), anyList(), anyList());
    }

    @Test
    void idRepetidoAPerguntaProntaVence() {
        // Consulta com o MESMO id de uma pergunta pronta: a pergunta vence.
        ConsultaFake consulta = new ConsultaFake("saldo_mes", true);
        when(assistenteService.listar(USUARIO)).thenReturn(List.of(perguntaSaldo()));
        when(clienteIA.gerarComFerramentas(anyString(), anyList(), anyList()))
            .thenReturn(ResultadoIA.deFerramenta("saldo_mes", Map.of()));
        when(assistenteService.responder(eq(USUARIO), eq("saldo_mes"), any()))
            .thenReturn(new RespostaAssistente("Saldo via pergunta.", Map.of(), "aviso"));

        ChatResponse r = comConsulta(consulta).responder(USUARIO, uma("saldo?"));

        assertThat(r.resposta()).isEqualTo("Saldo via pergunta.");
        assertThat(consulta.usuarioRecebido).isNull();
        verify(assistenteService, times(1)).responder(eq(USUARIO), eq("saldo_mes"), any());
        verify(clienteIA, times(1)).gerarComFerramentas(anyString(), anyList(), anyList());
    }
}
