package Projeto.MeuBolso.assistente;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
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
import org.mockito.ArgumentCaptor;

class GastosPeriodoFerramentaTest {

    private static final String USUARIO = "u1";
    // Clock fixo em 15/03/2026 (meio-dia UTC), zona UTC para datas estáveis.
    private static final Clock CLOCK =
        Clock.fixed(Instant.parse("2026-03-15T12:00:00Z"), ZoneId.of("UTC"));

    private GastoRepository gastoRepository;
    private GastosPeriodoFerramenta ferramenta;

    @BeforeEach
    void setUp() {
        gastoRepository = mock(GastoRepository.class);
        ferramenta = new GastosPeriodoFerramenta(gastoRepository, CLOCK);
    }

    private static Gasto gasto(String descricao, String categoria, String valor, String data) {
        Gasto g = new Gasto();
        g.setDescricao(descricao);
        g.setCategoria(categoria);
        g.setValor(valor == null ? null : new BigDecimal(valor));
        g.setData(data);
        return g;
    }

    // Captura os argumentos (inicio, fim) passados a findPorPeriodo.
    private String[] intervaloConsultado(Map<String, String> params) {
        when(gastoRepository.findPorPeriodo(anyString(), anyString(), anyString()))
            .thenReturn(List.of());
        ferramenta.executar(USUARIO, params);
        ArgumentCaptor<String> inicio = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<String> fim = ArgumentCaptor.forClass(String.class);
        org.mockito.Mockito.verify(gastoRepository)
            .findPorPeriodo(eq(USUARIO), inicio.capture(), fim.capture());
        return new String[] { inicio.getValue(), fim.getValue() };
    }

    @Test
    void indisponivelSemGastosDisponivelComGastos() {
        when(gastoRepository.findByUsuarioIdOrderByDataDesc(USUARIO)).thenReturn(List.of());
        assertThat(ferramenta.disponivel(USUARIO)).isFalse();

        when(gastoRepository.findByUsuarioIdOrderByDataDesc(USUARIO))
            .thenReturn(List.of(gasto("A", "Cat", "1.00", "2026-03-10")));
        assertThat(ferramenta.disponivel(USUARIO)).isTrue();
    }

    @Test
    void intervaloMesAtual() {
        assertThat(intervaloConsultado(Map.of("periodo", "mes_atual")))
            .containsExactly("2026-03-01", "2026-03-31");
    }

    @Test
    void intervaloMesAnterior() {
        assertThat(intervaloConsultado(Map.of("periodo", "mes_anterior")))
            .containsExactly("2026-02-01", "2026-02-28");
    }

    @Test
    void intervaloUltimos7Dias() {
        assertThat(intervaloConsultado(Map.of("periodo", "ultimos_7_dias")))
            .containsExactly("2026-03-09", "2026-03-15");
    }

    @Test
    void intervaloUltimos30Dias() {
        assertThat(intervaloConsultado(Map.of("periodo", "ultimos_30_dias")))
            .containsExactly("2026-02-14", "2026-03-15");
    }

    @Test
    void periodoInvalidoCaiEmMesAtual() {
        assertThat(intervaloConsultado(Map.of("periodo", "xpto")))
            .containsExactly("2026-03-01", "2026-03-31");
    }

    @Test
    void totalEQuantidade() {
        when(gastoRepository.findPorPeriodo(anyString(), anyString(), anyString())).thenReturn(List.of(
            gasto("A", "Cat", "10.00", "2026-03-02"),
            gasto("B", "Cat", "5.50", "2026-03-03"),
            gasto("C", "Cat", "4.50", "2026-03-04")));

        RespostaPronta r = ferramenta.executar(USUARIO, Map.of("periodo", "mes_atual"));

        assertThat(r.dados().get("total")).isEqualTo(new BigDecimal("20.00"));
        assertThat(r.dados().get("quantidade")).isEqualTo(3);
        assertThat(r.texto()).contains("Total: " + FormatoBRL.moeda(new BigDecimal("20.00")) + " (3 gastos)");
    }

    @Test
    void ordemDos3Maiores() {
        when(gastoRepository.findPorPeriodo(anyString(), anyString(), anyString())).thenReturn(List.of(
            gasto("Pequeno", "Cat", "1.00", "2026-03-02"),
            gasto("Grande", "Cat", "100.00", "2026-03-03"),
            gasto("Medio", "Cat", "50.00", "2026-03-04"),
            gasto("Minusculo", "Cat", "0.50", "2026-03-05")));

        RespostaPronta r = ferramenta.executar(USUARIO, Map.of("periodo", "mes_atual"));

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> maiores = (List<Map<String, Object>>) r.dados().get("maiores");
        assertThat(maiores).hasSize(3);
        assertThat(maiores).extracting(m -> m.get("descricao"))
            .containsExactly("Grande", "Medio", "Pequeno");
    }

    @Test
    void categoriaIgnoraAcentoECaixa() {
        when(gastoRepository.findPorPeriodo(anyString(), anyString(), anyString())).thenReturn(List.of(
            gasto("Feira", "Alimentação", "30.00", "2026-03-02"),
            gasto("Uber", "Transporte", "20.00", "2026-03-03")));

        RespostaPronta r = ferramenta.executar(USUARIO,
            Map.of("periodo", "mes_atual", "categoria", "alimentacao"));

        assertThat(r.dados().get("total")).isEqualTo(new BigDecimal("30.00"));
        assertThat(r.texto()).contains("em alimentacao:");
    }

    @Test
    void categoriaInexistenteListaCategorias() {
        when(gastoRepository.findPorPeriodo(anyString(), anyString(), anyString())).thenReturn(List.of());
        when(gastoRepository.findByUsuarioIdOrderByDataDesc(USUARIO)).thenReturn(List.of(
            gasto("Feira", "Alimentação", "30.00", "2026-01-02"),
            gasto("Uber", "Transporte", "20.00", "2026-01-03")));

        RespostaPronta r = ferramenta.executar(USUARIO,
            Map.of("periodo", "mes_atual", "categoria", "Viagem"));

        assertThat(r.texto()).isEqualTo(
            "Não encontrei a categoria \"Viagem\". Suas categorias: Alimentação, Transporte.");
    }

    @Test
    void categoriaExisteMasSemGastosNoPeriodo() {
        when(gastoRepository.findPorPeriodo(anyString(), anyString(), anyString())).thenReturn(List.of());
        when(gastoRepository.findByUsuarioIdOrderByDataDesc(USUARIO)).thenReturn(List.of(
            gasto("Feira", "Alimentação", "30.00", "2026-01-02")));

        RespostaPronta r = ferramenta.executar(USUARIO,
            Map.of("periodo", "mes_atual", "categoria", "Alimentação"));

        assertThat(r.texto()).isEqualTo("Você não teve gastos em Alimentação neste período.");
    }

    @Test
    void periodoSemGastosSemCategoria() {
        when(gastoRepository.findPorPeriodo(anyString(), anyString(), anyString())).thenReturn(List.of());

        RespostaPronta r = ferramenta.executar(USUARIO, Map.of("periodo", "mes_atual"));

        assertThat(r.texto()).isEqualTo("Você não teve gastos neste período.");
    }

    @Test
    void umGastoUsaSingular() {
        when(gastoRepository.findPorPeriodo(anyString(), anyString(), anyString()))
            .thenReturn(List.of(gasto("A", "Cat", "10.00", "2026-03-02")));

        RespostaPronta r = ferramenta.executar(USUARIO, Map.of("periodo", "mes_atual"));

        assertThat(r.texto()).contains("(1 gasto)");
    }

    @Test
    void ondeMaisGastouSoSemFiltroEComDuasCategorias() {
        List<Gasto> gastos = List.of(
            gasto("Feira", "Alimentação", "30.00", "2026-03-02"),
            gasto("Uber", "Transporte", "20.00", "2026-03-03"));

        // Sem filtro e com 2 categorias: o bloco aparece.
        when(gastoRepository.findPorPeriodo(anyString(), anyString(), anyString())).thenReturn(gastos);
        assertThat(ferramenta.executar(USUARIO, Map.of("periodo", "mes_atual")).texto())
            .contains("Onde mais gastou:");

        // Com filtro: o bloco não aparece.
        assertThat(ferramenta.executar(USUARIO,
            Map.of("periodo", "mes_atual", "categoria", "Alimentação")).texto())
            .doesNotContain("Onde mais gastou:");

        // Sem filtro, uma categoria só: o bloco não aparece.
        when(gastoRepository.findPorPeriodo(anyString(), anyString(), anyString())).thenReturn(List.of(
            gasto("Feira", "Alimentação", "30.00", "2026-03-02")));
        assertThat(ferramenta.executar(USUARIO, Map.of("periodo", "mes_atual")).texto())
            .doesNotContain("Onde mais gastou:");
    }
}
