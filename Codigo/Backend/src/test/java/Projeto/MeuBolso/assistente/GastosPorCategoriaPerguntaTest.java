package Projeto.MeuBolso.assistente;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import Projeto.MeuBolso.model.Gasto;
import Projeto.MeuBolso.repository.GastoRepository;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class GastosPorCategoriaPerguntaTest {

    private static final String USUARIO = "u1";
    private static final ZoneId ZONA = ZoneId.of("America/Sao_Paulo");
    // 15/03/2026 -> mês atual = março/2026.
    private static final Clock CLOCK =
        Clock.fixed(Instant.parse("2026-03-15T12:00:00Z"), ZONA);

    @Mock
    GastoRepository gastoRepository;

    GastosPorCategoriaPergunta pergunta;

    @BeforeEach
    void preparar() {
        // GastosDoMes real sobre o GastoRepository (interface) mockado e o Clock fixo.
        pergunta = new GastosPorCategoriaPergunta(new GastosDoMes(gastoRepository, CLOCK));
    }

    private static Gasto gasto(String categoria, String data, String valor) {
        Gasto g = new Gasto(USUARIO, "d", categoria, "c", data, new BigDecimal(valor), "", null);
        return g;
    }

    private void mesComGastos(Gasto... gastos) {
        when(gastoRepository.findPorPeriodo(USUARIO, "2026-03-01", "2026-03-31"))
            .thenReturn(List.of(gastos));
    }

    @Test
    void indisponivelSemGastos() {
        when(gastoRepository.findPorPeriodo(USUARIO, "2026-03-01", "2026-03-31"))
            .thenReturn(List.of());
        assertThat(pergunta.disponivel(USUARIO)).isFalse();
    }

    @Test
    void disponivelComGastosNoMes() {
        mesComGastos(gasto("Alimentação", "2026-03-10", "500"));
        assertThat(pergunta.disponivel(USUARIO)).isTrue();
    }

    @Test
    void retornaTop3ComPercentuais() {
        // Total = 1020. Alimentação 500 (49%), Transporte 300 (29%), Lazer 150 (15%),
        // Mercado 70 (fica de fora do top 3).
        mesComGastos(
            gasto("Alimentação", "2026-03-01", "500"),
            gasto("Transporte", "2026-03-02", "300"),
            gasto("Lazer", "2026-03-03", "150"),
            gasto("Mercado", "2026-03-04", "70")
        );

        RespostaPronta r = pergunta.responder(USUARIO, Map.of());

        assertThat(r.dados().get("total")).isEqualTo(new BigDecimal("1020"));

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> categorias = (List<Map<String, Object>>) r.dados().get("categorias");
        assertThat(categorias).hasSize(3);
        assertThat(categorias.get(0).get("nome")).isEqualTo("Alimentação");
        assertThat(categorias.get(0).get("valor")).isEqualTo(new BigDecimal("500"));
        assertThat(categorias.get(0).get("percentual")).isEqualTo(49);
        assertThat(categorias.get(1).get("nome")).isEqualTo("Transporte");
        assertThat(categorias.get(1).get("percentual")).isEqualTo(29);
        assertThat(categorias.get(2).get("nome")).isEqualTo("Lazer");
        assertThat(categorias.get(2).get("percentual")).isEqualTo(15);

        assertThat(r.texto())
            .contains("Alimentação")
            .contains("49%")
            .contains("Maiores categorias");
    }

    @Test
    void somaValoresDaMesmaCategoria() {
        mesComGastos(
            gasto("Alimentação", "2026-03-01", "200"),
            gasto("Alimentação", "2026-03-05", "300"),
            gasto("Transporte", "2026-03-02", "100")
        );

        RespostaPronta r = pergunta.responder(USUARIO, Map.of());

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> categorias = (List<Map<String, Object>>) r.dados().get("categorias");
        assertThat(categorias.get(0).get("nome")).isEqualTo("Alimentação");
        assertThat(categorias.get(0).get("valor")).isEqualTo(new BigDecimal("500"));
        assertThat(r.dados().get("total")).isEqualTo(new BigDecimal("600"));
    }

    @Test
    void consultaApenasOMesAtual() {
        // A pergunta deve pedir ao repositório só o intervalo de março/2026;
        // gastos de outros meses nem chegam porque o findPorPeriodo já filtra.
        mesComGastos(gasto("Alimentação", "2026-03-10", "500"));

        pergunta.responder(USUARIO, Map.of());

        org.mockito.Mockito.verify(gastoRepository)
            .findPorPeriodo(USUARIO, "2026-03-01", "2026-03-31");
        org.mockito.Mockito.verifyNoMoreInteractions(gastoRepository);
    }
}
