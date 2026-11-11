package Projeto.MeuBolso.assistente;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import Projeto.MeuBolso.model.Meta;
import Projeto.MeuBolso.repository.MetaRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class MetasTotalGuardadoPerguntaTest {

    private static final String USUARIO = "u1";

    @Mock
    MetaRepository metaRepository;

    MetasTotalGuardadoPergunta pergunta;

    @BeforeEach
    void preparar() {
        pergunta = new MetasTotalGuardadoPergunta(metaRepository);
    }

    private static Meta meta(String id, String nome, String alvo, String atual) {
        Meta m = new Meta(USUARIO, nome, new BigDecimal(alvo), (LocalDate) null, "alta");
        m.setId(id);
        m.setValorAtual(new BigDecimal(atual));
        return m;
    }

    private void metas(Meta... ms) {
        when(metaRepository.findByUsuarioId(USUARIO)).thenReturn(List.of(ms));
    }

    @Test
    void somaPercentualEMaisAvancada() {
        // Viagem 600/1000 (60%), Carro 450/1500 (30%), Reserva 100/500 (20%).
        // Total guardado = 1150, alvo = 3000 -> 38%. Mais avançada = Viagem (60%).
        metas(
            meta("m1", "Viagem", "1000", "600"),
            meta("m2", "Carro", "1500", "450"),
            meta("m3", "Reserva", "500", "100")
        );
        RespostaPronta r = pergunta.responder(USUARIO, Map.of());
        assertThat((BigDecimal) r.dados().get("totalGuardado")).isEqualByComparingTo("1150");
        assertThat((BigDecimal) r.dados().get("totalAlvo")).isEqualByComparingTo("3000");
        assertThat(r.dados().get("percentual")).isEqualTo(38);
        assertThat(r.dados().get("quantidade")).isEqualTo(3);
        @SuppressWarnings("unchecked")
        Map<String, Object> avancada = (Map<String, Object>) r.dados().get("maisAvancada");
        assertThat(avancada.get("nome")).isEqualTo("Viagem");
        assertThat(avancada.get("percentual")).isEqualTo(60);
        assertThat(r.texto())
            .isEqualTo("Você já guardou " + FormatoBRL.moeda(new BigDecimal("1150")) + " em 3 metas, 38% do total de "
                + FormatoBRL.moeda(new BigDecimal("3000")) + ". A mais avançada é \"Viagem\" (60%).");
    }

    @Test
    void empateDeMaisAvancadaVenceOrdemAlfabetica() {
        // Abacate e Zebra ambos 50%; vence "Abacate".
        metas(
            meta("m1", "Zebra", "1000", "500"),
            meta("m2", "Abacate", "200", "100")
        );
        RespostaPronta r = pergunta.responder(USUARIO, Map.of());
        @SuppressWarnings("unchecked")
        Map<String, Object> avancada = (Map<String, Object>) r.dados().get("maisAvancada");
        assertThat(avancada.get("nome")).isEqualTo("Abacate");
        assertThat(avancada.get("percentual")).isEqualTo(50);
    }

    @Test
    void singularComUmaMeta() {
        metas(meta("m1", "Viagem", "1000", "250"));
        RespostaPronta r = pergunta.responder(USUARIO, Map.of());
        assertThat(r.dados().get("quantidade")).isEqualTo(1);
        assertThat(r.texto()).contains("em 1 meta,");
    }

    @Test
    void valorAlvoZeroNaoQuebra() {
        metas(
            meta("m1", "SemAlvo", "0", "100"),
            meta("m2", "Viagem", "1000", "500")
        );
        RespostaPronta r = pergunta.responder(USUARIO, Map.of());
        assertThat((BigDecimal) r.dados().get("totalGuardado")).isEqualByComparingTo("600");
        assertThat((BigDecimal) r.dados().get("totalAlvo")).isEqualByComparingTo("1000");
        assertThat(r.dados().get("percentual")).isEqualTo(60);
        @SuppressWarnings("unchecked")
        Map<String, Object> avancada = (Map<String, Object>) r.dados().get("maisAvancada");
        // SemAlvo tem percentual 0 (alvo <= 0); Viagem 50% é a mais avançada.
        assertThat(avancada.get("nome")).isEqualTo("Viagem");
        assertThat(avancada.get("percentual")).isEqualTo(50);
    }

    @Test
    void indisponivelSemMetas() {
        when(metaRepository.findByUsuarioId(USUARIO)).thenReturn(List.of());
        assertThat(pergunta.disponivel(USUARIO)).isFalse();
    }
}
