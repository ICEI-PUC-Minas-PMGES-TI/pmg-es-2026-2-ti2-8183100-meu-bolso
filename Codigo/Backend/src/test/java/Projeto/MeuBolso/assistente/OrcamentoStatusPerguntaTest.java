package Projeto.MeuBolso.assistente;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

import Projeto.MeuBolso.model.Gasto;
import Projeto.MeuBolso.model.Orcamento;
import Projeto.MeuBolso.repository.GastoRepository;
import Projeto.MeuBolso.repository.OrcamentoRepository;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class OrcamentoStatusPerguntaTest {

    private static final String USUARIO = "u1";
    private static final ZoneId ZONA = ZoneId.systemDefault();
    // Mês atual = março/2026 (só precisa de um mês definido para o GastosDoMes).
    private static final Clock CLOCK = Clock.fixed(
        LocalDate.of(2026, 3, 15).atStartOfDay(ZONA).toInstant(), ZONA);

    @Mock
    OrcamentoRepository orcamentoRepository;

    @Mock
    GastoRepository gastoRepository;

    OrcamentoStatusPergunta pergunta;

    @BeforeEach
    void preparar() {
        // GastosDoMes é classe concreta: no JDK atual o Mockito não a mocka,
        // então usamos a instância real sobre o GastoRepository (interface) mockado.
        pergunta = new OrcamentoStatusPergunta(orcamentoRepository, new GastosDoMes(gastoRepository, CLOCK));
    }

    private void orcamento(String valor) {
        when(orcamentoRepository.findByUsuarioId(USUARIO))
            .thenReturn(Optional.of(new Orcamento(USUARIO, new BigDecimal(valor))));
    }

    private void gasto(String valor) {
        Gasto g = new Gasto(USUARIO, "d", "Cat", "c", "2026-03-10", new BigDecimal(valor), "", null);
        lenient().when(gastoRepository.findPorPeriodo(USUARIO, "2026-03-01", "2026-03-31"))
            .thenReturn(List.of(g));
    }

    @Test
    void dentro() {
        orcamento("1500");
        gasto("1020");
        RespostaPronta r = pergunta.responder(USUARIO, Map.of());
        assertThat(r.dados().get("situacao")).isEqualTo("dentro");
        assertThat(r.dados().get("percentual")).isEqualTo(68);
        assertThat(r.dados().get("restante")).isEqualTo(new BigDecimal("480"));
        assertThat(r.texto())
            .isEqualTo("Você está dentro do orçamento: usou 68% ("
                + FormatoBRL.moeda(new BigDecimal("1020")) + " de " + FormatoBRL.moeda(new BigDecimal("1500"))
                + "). Restam " + FormatoBRL.moeda(new BigDecimal("480")) + ".");
    }

    @Test
    void atencao() {
        orcamento("1500");
        gasto("1275");
        RespostaPronta r = pergunta.responder(USUARIO, Map.of());
        assertThat(r.dados().get("situacao")).isEqualTo("atencao");
        assertThat(r.dados().get("percentual")).isEqualTo(85);
        assertThat(r.texto())
            .isEqualTo("Atenção: você já usou 85% do orçamento ("
                + FormatoBRL.moeda(new BigDecimal("1275")) + " de " + FormatoBRL.moeda(new BigDecimal("1500"))
                + "). Restam " + FormatoBRL.moeda(new BigDecimal("225")) + ".");
    }

    @Test
    void exatamente80PorCentoEhAtencao() {
        orcamento("1500");
        gasto("1200"); // 80% exatos
        RespostaPronta r = pergunta.responder(USUARIO, Map.of());
        assertThat(r.dados().get("situacao")).isEqualTo("atencao");
        assertThat(r.dados().get("percentual")).isEqualTo(80);
    }

    @Test
    void exatamente100PorCentoEhAtencaoComRestanteZero() {
        orcamento("1500");
        gasto("1500");
        RespostaPronta r = pergunta.responder(USUARIO, Map.of());
        assertThat(r.dados().get("situacao")).isEqualTo("atencao");
        assertThat(r.dados().get("percentual")).isEqualTo(100);
        assertThat((BigDecimal) r.dados().get("restante")).isEqualByComparingTo("0");
    }

    @Test
    void estourou() {
        orcamento("1500");
        gasto("1620");
        RespostaPronta r = pergunta.responder(USUARIO, Map.of());
        assertThat(r.dados().get("situacao")).isEqualTo("estourou");
        assertThat((BigDecimal) r.dados().get("restante")).isEqualByComparingTo("-120");
        assertThat(r.texto())
            .isEqualTo("Você passou do orçamento em "
                + FormatoBRL.moeda(new BigDecimal("120")) + " ("
                + FormatoBRL.moeda(new BigDecimal("1620")) + " de " + FormatoBRL.moeda(new BigDecimal("1500")) + ").");
    }

    @Test
    void disponivelComZeroGastos() {
        orcamento("1500");
        when(gastoRepository.findPorPeriodo(USUARIO, "2026-03-01", "2026-03-31")).thenReturn(List.of());
        assertThat(pergunta.disponivel(USUARIO)).isTrue();
        RespostaPronta r = pergunta.responder(USUARIO, Map.of());
        assertThat(r.dados().get("situacao")).isEqualTo("dentro");
        assertThat(r.dados().get("percentual")).isEqualTo(0);
    }

    @Test
    void indisponivelSemOrcamento() {
        when(orcamentoRepository.findByUsuarioId(USUARIO)).thenReturn(Optional.empty());
        assertThat(pergunta.disponivel(USUARIO)).isFalse();
    }

    @Test
    void indisponivelComOrcamentoZero() {
        orcamento("0");
        assertThat(pergunta.disponivel(USUARIO)).isFalse();
    }
}
