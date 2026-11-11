package Projeto.MeuBolso.assistente;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

import Projeto.MeuBolso.model.Gasto;
import Projeto.MeuBolso.repository.GastoRepository;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ComparativoMesPerguntaTest {

    private static final String USUARIO = "u1";
    private static final ZoneId ZONA = ZoneId.systemDefault();

    @Mock
    GastoRepository gastoRepository;

    private static Clock em(LocalDate dia) {
        return Clock.fixed(dia.atStartOfDay(ZONA).toInstant(), ZONA);
    }

    private ComparativoMesPergunta pergunta(Clock clock) {
        return new ComparativoMesPergunta(new GastosDoMes(gastoRepository, clock), clock);
    }

    private static Gasto gasto(String categoria, String data, String valor) {
        return new Gasto(USUARIO, "d", categoria, "c", data, new BigDecimal(valor), "", null);
    }

    // Stub do período atual (dia 1 -> hoje).
    private void atual(String inicio, String fim, Gasto... gastos) {
        when(gastoRepository.findPorPeriodo(USUARIO, inicio, fim)).thenReturn(List.of(gastos));
    }

    // Stub do período anterior.
    private void anterior(String inicio, String fim, Gasto... gastos) {
        when(gastoRepository.findPorPeriodo(USUARIO, inicio, fim)).thenReturn(List.of(gastos));
    }

    // Stub do mês inteiro atual (usado por disponivel).
    private void mesInteiro(String inicio, String fim, Gasto... gastos) {
        lenient().when(gastoRepository.findPorPeriodo(USUARIO, inicio, fim)).thenReturn(List.of(gastos));
    }

    @Test
    void gastouMais() {
        // Hoje = 08/11/2026. Atual 01-08/nov = 1200; anterior 01-08/out = 1000. +20%.
        atual("2026-11-01", "2026-11-08", gasto("Mercado", "2026-11-03", "1200"));
        anterior("2026-10-01", "2026-10-08", gasto("Mercado", "2026-10-02", "1000"));
        RespostaPronta r = pergunta(em(LocalDate.of(2026, 11, 8))).responder(USUARIO, Map.of());
        assertThat(r.dados().get("percentual")).isEqualTo(20);
        assertThat(r.texto())
            .startsWith("Até o dia 8 você gastou " + FormatoBRL.moeda(new BigDecimal("1200"))
                + ", 20% a mais que no mesmo período de outubro ("
                + FormatoBRL.moeda(new BigDecimal("1000")) + ").");
    }

    @Test
    void gastouMenos() {
        // Atual 850; anterior 1000. -15%.
        atual("2026-11-01", "2026-11-08", gasto("Mercado", "2026-11-03", "850"));
        anterior("2026-10-01", "2026-10-08", gasto("Mercado", "2026-10-02", "1000"));
        RespostaPronta r = pergunta(em(LocalDate.of(2026, 11, 8))).responder(USUARIO, Map.of());
        assertThat(r.dados().get("percentual")).isEqualTo(-15);
        assertThat(r.texto())
            .startsWith("Até o dia 8 você gastou " + FormatoBRL.moeda(new BigDecimal("850"))
                + ", 15% a menos que no mesmo período de outubro ("
                + FormatoBRL.moeda(new BigDecimal("1000")) + ").");
    }

    @Test
    void gastouIgual() {
        atual("2026-11-01", "2026-11-08", gasto("Mercado", "2026-11-03", "1000"));
        anterior("2026-10-01", "2026-10-08", gasto("Mercado", "2026-10-02", "1000"));
        RespostaPronta r = pergunta(em(LocalDate.of(2026, 11, 8))).responder(USUARIO, Map.of());
        assertThat(r.dados().get("diferenca")).isEqualTo(new BigDecimal("0"));
        assertThat(r.texto())
            .isEqualTo("Até o dia 8 você gastou " + FormatoBRL.moeda(new BigDecimal("1000"))
                + ", o mesmo valor do mesmo período de outubro.");
    }

    @Test
    void anteriorVazioNaoTemPercentual() {
        atual("2026-11-01", "2026-11-08", gasto("Mercado", "2026-11-03", "1200"));
        anterior("2026-10-01", "2026-10-08");
        RespostaPronta r = pergunta(em(LocalDate.of(2026, 11, 8))).responder(USUARIO, Map.of());
        assertThat(r.dados().get("percentual")).isNull();
        assertThat(r.texto())
            .isEqualTo("Até o dia 8 você gastou " + FormatoBRL.moeda(new BigDecimal("1200"))
                + ". Não há gastos no mesmo período de outubro para comparar.");
    }

    @Test
    void corteDia31DeMarcoContraFevereiroDe28Dias() {
        // Hoje = 31/03/2026. Anterior = 01-28/fev (fev/2026 tem 28 dias).
        atual("2026-03-01", "2026-03-31", gasto("Mercado", "2026-03-10", "500"));
        anterior("2026-02-01", "2026-02-28", gasto("Mercado", "2026-02-10", "400"));
        RespostaPronta r = pergunta(em(LocalDate.of(2026, 3, 31))).responder(USUARIO, Map.of());
        assertThat(r.dados().get("diaCorte")).isEqualTo(31);
        assertThat(r.dados().get("mesAnterior")).isEqualTo("fevereiro");
        assertThat((BigDecimal) r.dados().get("anterior")).isEqualByComparingTo("400");
    }

    @Test
    void viradaDeAnoComparaComDezembro() {
        // Hoje = 05/01/2027. Anterior = 01-05/dez/2026.
        atual("2027-01-01", "2027-01-05", gasto("Mercado", "2027-01-02", "300"));
        anterior("2026-12-01", "2026-12-05", gasto("Mercado", "2026-12-02", "200"));
        RespostaPronta r = pergunta(em(LocalDate.of(2027, 1, 5))).responder(USUARIO, Map.of());
        assertThat(r.dados().get("mesAnterior")).isEqualTo("dezembro");
        assertThat((BigDecimal) r.dados().get("anterior")).isEqualByComparingTo("200");
    }

    @Test
    void categoriaQueMaisSubiu() {
        // Atual: Lazer 400, Mercado 200. Anterior: Lazer 100, Mercado 150.
        // Aumentos: Lazer +300, Mercado +50 -> Lazer.
        atual("2026-11-01", "2026-11-08",
            gasto("Lazer", "2026-11-03", "400"), gasto("Mercado", "2026-11-04", "200"));
        anterior("2026-10-01", "2026-10-08",
            gasto("Lazer", "2026-10-02", "100"), gasto("Mercado", "2026-10-03", "150"));
        RespostaPronta r = pergunta(em(LocalDate.of(2026, 11, 8))).responder(USUARIO, Map.of());
        @SuppressWarnings("unchecked")
        Map<String, Object> cat = (Map<String, Object>) r.dados().get("categoriaQueMaisSubiu");
        assertThat(cat.get("nome")).isEqualTo("Lazer");
        assertThat((BigDecimal) cat.get("aumento")).isEqualByComparingTo("300");
        assertThat(r.texto())
            .endsWith("A categoria que mais subiu foi Lazer (+" + FormatoBRL.moeda(new BigDecimal("300")) + ").");
    }

    @Test
    void nenhumaCategoriaSubiuDaNull() {
        // Tudo caiu ou ficou igual.
        atual("2026-11-01", "2026-11-08", gasto("Mercado", "2026-11-03", "100"));
        anterior("2026-10-01", "2026-10-08", gasto("Mercado", "2026-10-02", "300"));
        RespostaPronta r = pergunta(em(LocalDate.of(2026, 11, 8))).responder(USUARIO, Map.of());
        assertThat(r.dados().get("categoriaQueMaisSubiu")).isNull();
        assertThat(r.texto()).doesNotContain("mais subiu");
    }

    @Test
    void indisponivelSemGastosNoMesAtual() {
        mesInteiro("2026-11-01", "2026-11-30");
        assertThat(pergunta(em(LocalDate.of(2026, 11, 8))).disponivel(USUARIO)).isFalse();
    }
}
