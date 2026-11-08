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

        PerguntaFake(String id, String texto, boolean disponivel) {
            this.id = id;
            this.texto = texto;
            this.disponivel = disponivel;
        }

        @Override public String id() { return id; }
        @Override public String texto() { return texto; }
        @Override public boolean disponivel(String usuarioId) { return disponivel; }

        @Override
        public RespostaPronta responder(String usuarioId, Map<String, String> params) {
            return new RespostaPronta("resposta de " + id, Map.of("echo", params));
        }
    }

    @Test
    void listarTrazSomenteAsDisponiveis() {
        AssistenteService service = new AssistenteService(List.of(
            new PerguntaFake("disp", "Disponível?", true),
            new PerguntaFake("indisp", "Indisponível?", false)
        ));

        List<PerguntaResumo> lista = service.listar(USUARIO);

        assertThat(lista).hasSize(1);
        assertThat(lista.get(0).id()).isEqualTo("disp");
        assertThat(lista.get(0).texto()).isEqualTo("Disponível?");
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
