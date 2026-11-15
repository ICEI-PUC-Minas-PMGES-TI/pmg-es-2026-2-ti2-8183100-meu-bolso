package Projeto.MeuBolso.assistente;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import Projeto.MeuBolso.model.Receita;
import Projeto.MeuBolso.repository.ReceitaRepository;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ReceitasDoMesTest {

    private static final String USUARIO = "u1";
    private static final ZoneId ZONA = ZoneId.systemDefault();
    // Mês atual = março/2026, seja qual for o fuso da máquina.
    private static final Clock CLOCK = Clock.fixed(
        LocalDate.of(2026, 3, 15).atStartOfDay(ZONA).toInstant(), ZONA);

    @Mock
    ReceitaRepository receitaRepository;

    ReceitasDoMes receitasDoMes;

    @BeforeEach
    void preparar() {
        receitasDoMes = new ReceitasDoMes(receitaRepository, CLOCK);
    }

    private static Receita receita(String valor) {
        return new Receita(USUARIO, "d", "Cat", "c", "2026-03-10", new BigDecimal(valor), "", null);
    }

    @Test
    void somaSoDoMesAtual() {
        when(receitaRepository.findPorPeriodo(USUARIO, "2026-03-01", "2026-03-31"))
            .thenReturn(List.of(receita("500"), receita("300"), receita("220")));
        assertThat(receitasDoMes.total(USUARIO)).isEqualByComparingTo("1020");
    }

    @Test
    void semReceitasRetornaZero() {
        when(receitaRepository.findPorPeriodo(USUARIO, "2026-03-01", "2026-03-31"))
            .thenReturn(List.of());
        assertThat(receitasDoMes.total(USUARIO)).isEqualByComparingTo("0");
    }

    @Test
    void mesAtualChaveRetornaChaveDoMes() {
        assertThat(receitasDoMes.mesAtualChave()).isEqualTo("2026-03");
    }
}
