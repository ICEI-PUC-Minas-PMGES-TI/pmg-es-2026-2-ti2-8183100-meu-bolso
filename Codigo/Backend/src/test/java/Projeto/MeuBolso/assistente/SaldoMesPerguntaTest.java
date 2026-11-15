package Projeto.MeuBolso.assistente;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

import Projeto.MeuBolso.model.Gasto;
import Projeto.MeuBolso.model.Receita;
import Projeto.MeuBolso.repository.GastoRepository;
import Projeto.MeuBolso.repository.ReceitaRepository;
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
class SaldoMesPerguntaTest {

    private static final String USUARIO = "u1";
    private static final ZoneId ZONA = ZoneId.of("America/Sao_Paulo");
    // 15/03/2026 -> mês atual = março/2026.
    private static final Clock CLOCK =
        Clock.fixed(Instant.parse("2026-03-15T12:00:00Z"), ZONA);

    @Mock
    ReceitaRepository receitaRepository;

    @Mock
    GastoRepository gastoRepository;

    SaldoMesPergunta pergunta;

    @BeforeEach
    void preparar() {
        // Helpers reais sobre os repositórios (interfaces) mockados e o Clock fixo.
        pergunta = new SaldoMesPergunta(
            new ReceitasDoMes(receitaRepository, CLOCK),
            new GastosDoMes(gastoRepository, CLOCK));
    }

    private static Receita receita(String valor) {
        return new Receita(USUARIO, "d", "Cat", "c", "2026-03-10", new BigDecimal(valor), "", null);
    }

    private static Gasto gasto(String valor) {
        return new Gasto(USUARIO, "d", "Cat", "c", "2026-03-10", new BigDecimal(valor), "", null);
    }

    private void receitasDoMes(Receita... receitas) {
        lenient().when(receitaRepository.findPorPeriodo(USUARIO, "2026-03-01", "2026-03-31"))
            .thenReturn(List.of(receitas));
    }

    private void gastosDoMes(Gasto... gastos) {
        lenient().when(gastoRepository.findPorPeriodo(USUARIO, "2026-03-01", "2026-03-31"))
            .thenReturn(List.of(gastos));
    }

    @Test
    void indisponivelSemReceitasESemGastos() {
        receitasDoMes();
        gastosDoMes();
        assertThat(pergunta.disponivel(USUARIO)).isFalse();
    }

    @Test
    void disponivelSoComGastos() {
        receitasDoMes();
        gastosDoMes(gasto("200"));
        assertThat(pergunta.disponivel(USUARIO)).isTrue();
    }

    @Test
    void disponivelSoComReceitas() {
        receitasDoMes(receita("200"));
        gastosDoMes();
        assertThat(pergunta.disponivel(USUARIO)).isTrue();
    }

    @Test
    void saldoPositivoCalculaPercentualEDizSobraram() {
        receitasDoMes(receita("3000"));
        gastosDoMes(gasto("1200"));

        RespostaPronta r = pergunta.responder(USUARIO, Map.of());

        assertThat((BigDecimal) r.dados().get("receitas")).isEqualByComparingTo("3000");
        assertThat((BigDecimal) r.dados().get("gastos")).isEqualByComparingTo("1200");
        assertThat((BigDecimal) r.dados().get("saldo")).isEqualByComparingTo("1800");
        assertThat(r.dados().get("percentualGasto")).isEqualTo(40);
        assertThat(r.texto())
            .contains("Sobraram")
            .contains(FormatoBRL.moeda(new BigDecimal("1800")))
            .contains("40%");
    }

    @Test
    void saldoNegativoDizFaltaramComValorAbsoluto() {
        receitasDoMes(receita("1000"));
        gastosDoMes(gasto("1500"));

        RespostaPronta r = pergunta.responder(USUARIO, Map.of());

        assertThat((BigDecimal) r.dados().get("saldo")).isEqualByComparingTo("-500");
        assertThat(r.texto())
            .contains("Faltaram")
            .contains(FormatoBRL.moeda(new BigDecimal("500")));
    }

    @Test
    void semReceitasPercentualNuloEDizNaoHaReceitas() {
        receitasDoMes();
        gastosDoMes(gasto("200"));

        RespostaPronta r = pergunta.responder(USUARIO, Map.of());

        assertThat(r.dados().get("percentualGasto")).isNull();
        assertThat(r.texto())
            .contains("ainda não há receitas")
            .contains(FormatoBRL.moeda(new BigDecimal("200")));
    }
}
