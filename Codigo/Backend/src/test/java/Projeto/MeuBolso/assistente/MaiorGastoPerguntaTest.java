package Projeto.MeuBolso.assistente;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import Projeto.MeuBolso.model.Gasto;
import Projeto.MeuBolso.repository.GastoRepository;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class MaiorGastoPerguntaTest {

    private static final String USUARIO = "u1";
    private static final ZoneId ZONA = ZoneId.systemDefault();
    // Mês atual = novembro/2026.
    private static final Clock CLOCK = Clock.fixed(
        LocalDate.of(2026, 11, 15).atStartOfDay(ZONA).toInstant(), ZONA);

    @Mock
    GastoRepository gastoRepository;

    MaiorGastoPergunta pergunta;

    @BeforeEach
    void preparar() {
        // GastosDoMes (classe concreta) real sobre o GastoRepository (interface) mockado.
        pergunta = new MaiorGastoPergunta(new GastosDoMes(gastoRepository, CLOCK), CLOCK);
    }

    private static Gasto gasto(String descricao, String categoria, String data, String valor) {
        return new Gasto(USUARIO, descricao, categoria, "c", data, new BigDecimal(valor), "", null);
    }

    private void mes(Gasto... gastos) {
        when(gastoRepository.findPorPeriodo(USUARIO, "2026-11-01", "2026-11-30"))
            .thenReturn(List.of(gastos));
    }

    @Test
    void maiorValorEPercentualDoTotal() {
        // Total = 1000. Maior = Aluguel 600 -> 60%.
        mes(
            gasto("Mercado", "Alimentação", "2026-11-12", "250"),
            gasto("Uber", "Transporte", "2026-11-10", "150"),
            gasto("Aluguel", "Moradia", "2026-11-05", "600")
        );
        RespostaPronta r = pergunta.responder(USUARIO, Map.of());
        assertThat(r.dados().get("descricao")).isEqualTo("Aluguel");
        assertThat(r.dados().get("categoria")).isEqualTo("Moradia");
        assertThat((BigDecimal) r.dados().get("valor")).isEqualByComparingTo("600");
        assertThat(r.dados().get("percentualDoTotal")).isEqualTo(60);
    }

    @Test
    void empateVenceDataMaisRecente() {
        mes(
            gasto("A", "Cat", "2026-11-05", "300"),
            gasto("B", "Cat", "2026-11-20", "300"),
            gasto("C", "Cat", "2026-11-10", "100")
        );
        RespostaPronta r = pergunta.responder(USUARIO, Map.of());
        assertThat(r.dados().get("descricao")).isEqualTo("B");
        assertThat(r.dados().get("data")).isEqualTo("2026-11-20");
    }

    @Test
    void textoNoFormatoEsperado() {
        // Total = 1000, maior = Uber 750 (75%).
        mes(
            gasto("Mercado", "Alimentação", "2026-11-12", "250"),
            gasto("Uber", "Transporte", "2026-11-10", "750")
        );
        RespostaPronta r = pergunta.responder(USUARIO, Map.of());
        assertThat(r.texto())
            .isEqualTo("Seu maior gasto neste mês foi \"Uber\" (Transporte): "
                + FormatoBRL.moeda(new BigDecimal("750")) + " em 10/11, 75% do total do mês.");
    }

    @Test
    void indisponivelSemGastos() {
        when(gastoRepository.findPorPeriodo(USUARIO, "2026-11-01", "2026-11-30")).thenReturn(List.of());
        assertThat(pergunta.disponivel(USUARIO)).isFalse();
    }

    @Test
    void consultaApenasOMesAtual() {
        mes(gasto("Mercado", "Alimentação", "2026-11-12", "250"));
        pergunta.responder(USUARIO, Map.of());
        org.mockito.Mockito.verify(gastoRepository).findPorPeriodo(USUARIO, "2026-11-01", "2026-11-30");
        org.mockito.Mockito.verifyNoMoreInteractions(gastoRepository);
    }
}
