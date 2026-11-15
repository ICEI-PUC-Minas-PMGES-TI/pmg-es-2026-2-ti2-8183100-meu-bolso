package Projeto.MeuBolso.assistente;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import Projeto.MeuBolso.model.Gasto;
import Projeto.MeuBolso.repository.GastoRepository;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class GastosRecentesFerramentaTest {

    private static final String USUARIO = "u1";

    private GastoRepository gastoRepository;
    private GastosRecentesFerramenta ferramenta;

    @BeforeEach
    void setUp() {
        gastoRepository = mock(GastoRepository.class);
        ferramenta = new GastosRecentesFerramenta(gastoRepository);
    }

    private static Gasto gasto(String descricao, String categoria, String valor, String data) {
        Gasto g = new Gasto();
        g.setDescricao(descricao);
        g.setCategoria(categoria);
        g.setValor(valor == null ? null : new BigDecimal(valor));
        g.setData(data);
        return g;
    }

    // n gastos "mais recentes primeiro", com valores previsíveis.
    private List<Gasto> varios(int n) {
        List<Gasto> lista = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            lista.add(gasto("Item " + i, "Cat", "10.00", "2026-11-" + String.format("%02d", 28 - i)));
        }
        return lista;
    }

    @Test
    void indisponivelSemGastos() {
        when(gastoRepository.findByUsuarioIdOrderByDataDesc(USUARIO)).thenReturn(List.of());
        assertThat(ferramenta.disponivel(USUARIO)).isFalse();
    }

    @Test
    void disponivelComGastos() {
        when(gastoRepository.findByUsuarioIdOrderByDataDesc(USUARIO)).thenReturn(varios(1));
        assertThat(ferramenta.disponivel(USUARIO)).isTrue();
    }

    @Test
    void padraoLimitaA5() {
        when(gastoRepository.findByUsuarioIdOrderByDataDesc(USUARIO)).thenReturn(varios(7));

        RespostaPronta r = ferramenta.executar(USUARIO, Map.of());

        assertThat(r.texto()).startsWith("Seus últimos 5 gastos:");
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> gastos = (List<Map<String, Object>>) r.dados().get("gastos");
        assertThat(gastos).hasSize(5);
    }

    @Test
    void quantidade10TrazAte10() {
        when(gastoRepository.findByUsuarioIdOrderByDataDesc(USUARIO)).thenReturn(varios(12));

        RespostaPronta r = ferramenta.executar(USUARIO, Map.of("quantidade", "10"));

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> gastos = (List<Map<String, Object>>) r.dados().get("gastos");
        assertThat(gastos).hasSize(10);
    }

    @Test
    void quantidadeInvalidaVoltaA5() {
        when(gastoRepository.findByUsuarioIdOrderByDataDesc(USUARIO)).thenReturn(varios(7));

        RespostaPronta r = ferramenta.executar(USUARIO, Map.of("quantidade", "abc"));

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> gastos = (List<Map<String, Object>>) r.dados().get("gastos");
        assertThat(gastos).hasSize(5);
    }

    @Test
    void totalCorreto() {
        List<Gasto> lista = List.of(
            gasto("A", "Cat", "10.00", "2026-11-10"),
            gasto("B", "Cat", "5.50", "2026-11-09"));
        when(gastoRepository.findByUsuarioIdOrderByDataDesc(USUARIO)).thenReturn(lista);

        RespostaPronta r = ferramenta.executar(USUARIO, Map.of());

        assertThat(r.dados().get("total")).isEqualTo(new BigDecimal("15.50"));
        assertThat(r.texto()).contains("Total listado: " + FormatoBRL.moeda(new BigDecimal("15.50")));
    }

    @Test
    void formatoDaLinha() {
        when(gastoRepository.findByUsuarioIdOrderByDataDesc(USUARIO))
            .thenReturn(List.of(gasto("Mercado", "Alimentação", "85.90", "2026-11-12")));

        RespostaPronta r = ferramenta.executar(USUARIO, Map.of());

        assertThat(r.texto()).contains(
            "• 12/11 — Mercado (Alimentação): " + FormatoBRL.moeda(new BigDecimal("85.90")));
    }

    @Test
    void categoriaEDescricaoNulas() {
        when(gastoRepository.findByUsuarioIdOrderByDataDesc(USUARIO))
            .thenReturn(List.of(gasto(null, null, "20.00", "2026-11-05")));

        RespostaPronta r = ferramenta.executar(USUARIO, Map.of());

        assertThat(r.texto()).contains("Sem descrição (Sem categoria)");
    }

    @Test
    void umGastoUsaSingular() {
        when(gastoRepository.findByUsuarioIdOrderByDataDesc(USUARIO)).thenReturn(varios(1));

        RespostaPronta r = ferramenta.executar(USUARIO, Map.of());

        assertThat(r.texto()).startsWith("Seu último gasto:");
    }

    @Test
    void parametroQuantidadeTemOpcoes5E10() {
        var params = ferramenta.parametros(USUARIO);
        assertThat(params).hasSize(1);
        assertThat(params.get(0).nome()).isEqualTo("quantidade");
        assertThat(params.get(0).opcoes()).extracting(OpcaoParametro::valor).containsExactly("5", "10");
    }

    @Test
    void dataInvalidaMostraTextoOriginal() {
        when(gastoRepository.findByUsuarioIdOrderByDataDesc(eq(USUARIO)))
            .thenReturn(List.of(gasto("X", "Cat", "1.00", "data-ruim")));

        RespostaPronta r = ferramenta.executar(USUARIO, Map.of());

        assertThat(r.texto()).contains("• data-ruim — X");
    }
}
