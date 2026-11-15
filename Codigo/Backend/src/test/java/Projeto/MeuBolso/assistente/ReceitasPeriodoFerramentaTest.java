package Projeto.MeuBolso.assistente;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import Projeto.MeuBolso.model.Receita;
import Projeto.MeuBolso.repository.ReceitaRepository;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

class ReceitasPeriodoFerramentaTest {

    private static final String USUARIO = "u1";
    // Clock fixo em 15/03/2026 (meio-dia UTC), zona UTC para datas estáveis.
    private static final Clock CLOCK =
        Clock.fixed(Instant.parse("2026-03-15T12:00:00Z"), ZoneId.of("UTC"));

    private ReceitaRepository receitaRepository;
    private ReceitasPeriodoFerramenta ferramenta;

    @BeforeEach
    void setUp() {
        receitaRepository = mock(ReceitaRepository.class);
        ferramenta = new ReceitasPeriodoFerramenta(receitaRepository, CLOCK);
    }

    private static Receita receita(String descricao, String categoria, String valor, String data) {
        Receita r = new Receita();
        r.setDescricao(descricao);
        r.setCategoria(categoria);
        r.setValor(valor == null ? null : new BigDecimal(valor));
        r.setData(data);
        return r;
    }

    // Captura os argumentos (inicio, fim) passados a findPorPeriodo.
    private String[] intervaloConsultado(Map<String, String> params) {
        when(receitaRepository.findPorPeriodo(anyString(), anyString(), anyString()))
            .thenReturn(List.of());
        ferramenta.executar(USUARIO, params);
        ArgumentCaptor<String> inicio = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<String> fim = ArgumentCaptor.forClass(String.class);
        org.mockito.Mockito.verify(receitaRepository)
            .findPorPeriodo(eq(USUARIO), inicio.capture(), fim.capture());
        return new String[] { inicio.getValue(), fim.getValue() };
    }

    @Test
    void indisponivelSemReceitasDisponivelComReceitas() {
        when(receitaRepository.findByUsuarioIdOrderByDataDesc(USUARIO)).thenReturn(List.of());
        assertThat(ferramenta.disponivel(USUARIO)).isFalse();

        when(receitaRepository.findByUsuarioIdOrderByDataDesc(USUARIO))
            .thenReturn(List.of(receita("Salário", "Salário", "1.00", "2026-03-10")));
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
        when(receitaRepository.findPorPeriodo(anyString(), anyString(), anyString())).thenReturn(List.of(
            receita("A", "Cat", "100.00", "2026-03-02"),
            receita("B", "Cat", "50.00", "2026-03-03")));

        RespostaPronta r = ferramenta.executar(USUARIO, Map.of("periodo", "mes_atual"));

        assertThat(r.dados().get("total")).isEqualTo(new BigDecimal("150.00"));
        assertThat(r.dados().get("quantidade")).isEqualTo(2);
        assertThat(r.texto()).contains("Total: " + FormatoBRL.moeda(new BigDecimal("150.00")) + " (2 receitas)");
    }

    @Test
    void ordemDas3MaioresEntradas() {
        when(receitaRepository.findPorPeriodo(anyString(), anyString(), anyString())).thenReturn(List.of(
            receita("Pequena", "Cat", "1.00", "2026-03-02"),
            receita("Grande", "Cat", "100.00", "2026-03-03"),
            receita("Media", "Cat", "50.00", "2026-03-04"),
            receita("Minuscula", "Cat", "0.50", "2026-03-05")));

        RespostaPronta r = ferramenta.executar(USUARIO, Map.of("periodo", "mes_atual"));

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> maiores = (List<Map<String, Object>>) r.dados().get("maiores");
        assertThat(maiores).extracting(m -> m.get("descricao"))
            .containsExactly("Grande", "Media", "Pequena");
    }

    @Test
    void categoriaIgnoraAcentoECaixa() {
        when(receitaRepository.findPorPeriodo(anyString(), anyString(), anyString())).thenReturn(List.of(
            receita("Mensal", "Salário", "3000.00", "2026-03-02"),
            receita("App", "Freelance", "500.00", "2026-03-03")));

        RespostaPronta r = ferramenta.executar(USUARIO,
            Map.of("periodo", "mes_atual", "categoria", "salario"));

        assertThat(r.dados().get("total")).isEqualTo(new BigDecimal("3000.00"));
        assertThat(r.texto()).contains("em salario:");
    }

    @Test
    void categoriaInexistenteListaCategoriasDeReceita() {
        when(receitaRepository.findPorPeriodo(anyString(), anyString(), anyString())).thenReturn(List.of());
        when(receitaRepository.findByUsuarioIdOrderByDataDesc(USUARIO)).thenReturn(List.of(
            receita("Mensal", "Salário", "3000.00", "2026-01-02"),
            receita("App", "Freelance", "500.00", "2026-01-03")));

        RespostaPronta r = ferramenta.executar(USUARIO,
            Map.of("periodo", "mes_atual", "categoria", "Aluguel"));

        assertThat(r.texto()).isEqualTo(
            "Não encontrei a categoria \"Aluguel\". Suas categorias de receita: Freelance, Salário.");
    }

    @Test
    void categoriaExisteMasSemReceitasNoPeriodo() {
        when(receitaRepository.findPorPeriodo(anyString(), anyString(), anyString())).thenReturn(List.of());
        when(receitaRepository.findByUsuarioIdOrderByDataDesc(USUARIO)).thenReturn(List.of(
            receita("Mensal", "Salário", "3000.00", "2026-01-02")));

        RespostaPronta r = ferramenta.executar(USUARIO,
            Map.of("periodo", "mes_atual", "categoria", "Salário"));

        assertThat(r.texto()).isEqualTo("Você não teve receitas em Salário neste período.");
    }

    @Test
    void periodoSemReceitasSemCategoria() {
        when(receitaRepository.findPorPeriodo(anyString(), anyString(), anyString())).thenReturn(List.of());

        RespostaPronta r = ferramenta.executar(USUARIO, Map.of("periodo", "mes_atual"));

        assertThat(r.texto()).isEqualTo("Você não teve receitas neste período.");
    }

    @Test
    void umaReceitaUsaSingular() {
        when(receitaRepository.findPorPeriodo(anyString(), anyString(), anyString()))
            .thenReturn(List.of(receita("Salário", "Salário", "3000.00", "2026-03-02")));

        RespostaPronta r = ferramenta.executar(USUARIO, Map.of("periodo", "mes_atual"));

        assertThat(r.texto()).contains("(1 receita)");
    }

    @Test
    void deOndeVeioSoSemFiltroEComDuasCategorias() {
        List<Receita> receitas = List.of(
            receita("Mensal", "Salário", "3000.00", "2026-03-02"),
            receita("App", "Freelance", "500.00", "2026-03-03"));

        when(receitaRepository.findPorPeriodo(anyString(), anyString(), anyString())).thenReturn(receitas);
        assertThat(ferramenta.executar(USUARIO, Map.of("periodo", "mes_atual")).texto())
            .contains("De onde veio:");

        assertThat(ferramenta.executar(USUARIO,
            Map.of("periodo", "mes_atual", "categoria", "Salário")).texto())
            .doesNotContain("De onde veio:");

        when(receitaRepository.findPorPeriodo(anyString(), anyString(), anyString())).thenReturn(List.of(
            receita("Mensal", "Salário", "3000.00", "2026-03-02")));
        assertThat(ferramenta.executar(USUARIO, Map.of("periodo", "mes_atual")).texto())
            .doesNotContain("De onde veio:");
    }
}
