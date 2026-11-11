package Projeto.MeuBolso.assistente;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import Projeto.MeuBolso.model.Gasto;
import Projeto.MeuBolso.repository.GastoRepository;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class GastosDoMesTest {

    private static final String USUARIO = "u1";
    private static final ZoneId ZONA = ZoneId.systemDefault();
    // Mês atual = março/2026, seja qual for o fuso da máquina.
    private static final Clock CLOCK = Clock.fixed(
        LocalDate.of(2026, 3, 15).atStartOfDay(ZONA).toInstant(), ZONA);

    @Mock
    GastoRepository gastoRepository;

    GastosDoMes gastosDoMes;

    @BeforeEach
    void preparar() {
        gastosDoMes = new GastosDoMes(gastoRepository, CLOCK);
    }

    private static Gasto gasto(String valor) {
        return new Gasto(USUARIO, "d", "Cat", "c", "2026-03-10", new BigDecimal(valor), "", null);
    }

    @Test
    void somaSoDoMesAtual() {
        when(gastoRepository.findPorPeriodo(USUARIO, "2026-03-01", "2026-03-31"))
            .thenReturn(List.of(gasto("500"), gasto("300"), gasto("220")));
        assertThat(gastosDoMes.total(USUARIO)).isEqualByComparingTo("1020");
    }

    @Test
    void zeroSemGastos() {
        when(gastoRepository.findPorPeriodo(USUARIO, "2026-03-01", "2026-03-31"))
            .thenReturn(List.of());
        assertThat(gastosDoMes.total(USUARIO)).isEqualByComparingTo("0");
    }

    @Test
    void noPeriodoUsaLimitesInclusivos() {
        when(gastoRepository.findPorPeriodo(USUARIO, "2026-03-05", "2026-03-10"))
            .thenReturn(List.of(gasto("10"), gasto("20")));
        assertThat(gastosDoMes.noPeriodo(USUARIO, LocalDate.of(2026, 3, 5), LocalDate.of(2026, 3, 10)))
            .hasSize(2);
    }
}
