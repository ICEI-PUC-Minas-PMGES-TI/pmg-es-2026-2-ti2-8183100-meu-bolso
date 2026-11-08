package Projeto.MeuBolso.assistente;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

import Projeto.MeuBolso.assistente.AssistenteService.PerguntaResumo;
import Projeto.MeuBolso.assistente.AssistenteService.RespostaAssistente;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

class AssistenteServiceTest {

    private static final String USUARIO = "u1";
    private static final String AVISO = "Orientação educativa; não substitui um profissional.";

    // Implementação de teste controlável, sem Spring nem Mongo.
    private static final class PerguntaFake implements PerguntaPronta {
        private final String id;
        private final String texto;
        private final boolean disponivel;
        private final List<ParametroPergunta> parametros;

        PerguntaFake(String id, String texto, boolean disponivel) {
            this(id, texto, disponivel, List.of());
        }

        PerguntaFake(String id, String texto, boolean disponivel, List<ParametroPergunta> parametros) {
            this.id = id;
            this.texto = texto;
            this.disponivel = disponivel;
            this.parametros = parametros;
        }

        @Override public String id() { return id; }
        @Override public String texto() { return texto; }
        @Override public boolean disponivel(String usuarioId) { return disponivel; }
        @Override public List<ParametroPergunta> parametros(String usuarioId) { return parametros; }

        @Override
        public RespostaPronta responder(String usuarioId, Map<String, String> params) {
            return new RespostaPronta("resposta de " + id, Map.of("echo", params));
        }
    }

    private static ParametroPergunta opcaoMetaId() {
        return new ParametroPergunta("metaId", "Qual meta?", "opcao",
            List.of(new OpcaoParametro("m1", "Viagem"), new OpcaoParametro("m2", "Carro")));
    }

    @Test
    void listarTrazSomenteAsDisponiveisComParametros() {
        AssistenteService service = new AssistenteService(List.of(
            new PerguntaFake("disp", "Disponível?", true, List.of(opcaoMetaId())),
            new PerguntaFake("indisp", "Indisponível?", false)
        ));

        List<PerguntaResumo> lista = service.listar(USUARIO);

        assertThat(lista).hasSize(1);
        assertThat(lista.get(0).id()).isEqualTo("disp");
        assertThat(lista.get(0).texto()).isEqualTo("Disponível?");
        assertThat(lista.get(0).parametros()).hasSize(1);
        assertThat(lista.get(0).parametros().get(0).nome()).isEqualTo("metaId");
    }

    @Test
    void responderIdInexistenteRetorna404() {
        AssistenteService service = new AssistenteService(List.of(
            new PerguntaFake("disp", "Disponível?", true)
        ));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
            () -> service.responder(USUARIO, "nao-existe", Map.of()));
        assertThat(ex.getStatusCode().value()).isEqualTo(404);
    }

    @Test
    void responderPerguntaIndisponivelRetorna400() {
        AssistenteService service = new AssistenteService(List.of(
            new PerguntaFake("indisp", "Indisponível?", false)
        ));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
            () -> service.responder(USUARIO, "indisp", Map.of()));
        assertThat(ex.getStatusCode().value()).isEqualTo(400);
    }

    @Test
    void parametroAusenteRetorna400() {
        AssistenteService service = new AssistenteService(List.of(
            new PerguntaFake("disp", "Disponível?", true, List.of(opcaoMetaId()))
        ));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
            () -> service.responder(USUARIO, "disp", Map.of()));
        assertThat(ex.getStatusCode().value()).isEqualTo(400);
        assertThat(ex.getReason()).isEqualTo("Parâmetro obrigatório: metaId");
    }

    @Test
    void parametroEmBrancoRetorna400() {
        AssistenteService service = new AssistenteService(List.of(
            new PerguntaFake("disp", "Disponível?", true, List.of(opcaoMetaId()))
        ));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
            () -> service.responder(USUARIO, "disp", Map.of("metaId", "   ")));
        assertThat(ex.getStatusCode().value()).isEqualTo(400);
        assertThat(ex.getReason()).isEqualTo("Parâmetro obrigatório: metaId");
    }

    @Test
    void valorForaDasOpcoesRetorna400() {
        AssistenteService service = new AssistenteService(List.of(
            new PerguntaFake("disp", "Disponível?", true, List.of(opcaoMetaId()))
        ));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
            () -> service.responder(USUARIO, "disp", Map.of("metaId", "outro")));
        assertThat(ex.getStatusCode().value()).isEqualTo(400);
        assertThat(ex.getReason()).isEqualTo("Parâmetro inválido: metaId");
    }

    @Test
    void ordemDeValidacao404AntesDe400() {
        AssistenteService service = new AssistenteService(List.of(
            new PerguntaFake("indisp", "Indisponível?", false, List.of(opcaoMetaId()))
        ));

        // Id inexistente -> 404, mesmo havendo parâmetros em outra pergunta.
        assertThat(assertThrows(ResponseStatusException.class,
            () -> service.responder(USUARIO, "nao-existe", Map.of()))
            .getStatusCode().value()).isEqualTo(404);

        // Indisponível é checado antes de validar parâmetros.
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
            () -> service.responder(USUARIO, "indisp", Map.of()));
        assertThat(ex.getStatusCode().value()).isEqualTo(400);
        assertThat(ex.getReason()).isEqualTo("Pergunta indisponível no momento.");
    }

    @Test
    void paramsNuloEmPerguntaSemParametrosFunciona() {
        AssistenteService service = new AssistenteService(List.of(
            new PerguntaFake("disp", "Disponível?", true)
        ));

        RespostaAssistente r = service.responder(USUARIO, "disp", null);

        assertThat(r.texto()).isEqualTo("resposta de disp");
        assertThat(r.aviso()).isEqualTo(AVISO);
        assertThat(r.dados()).containsEntry("echo", Map.of());
    }

    @Test
    void responderDevolveTextoDadosEAvisoFixo() {
        AssistenteService service = new AssistenteService(List.of(
            new PerguntaFake("disp", "Disponível?", true)
        ));

        RespostaAssistente r = service.responder(USUARIO, "disp", Map.of("k", "v"));

        assertThat(r.texto()).isEqualTo("resposta de disp");
        assertThat(r.aviso()).isEqualTo(AVISO);
        assertThat(r.dados()).containsEntry("echo", Map.of("k", "v"));
    }
}
