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
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class GastoPorDiaPerguntaTest {

    private static final String USUARIO = "u1";
    private static final ZoneId ZONA = ZoneId.systemDefault();

    @Mock
    OrcamentoRepository orcamentoRepository;

    @Mock
    GastoRepository gastoRepository;

    private static Clock em(LocalDate dia) {
        return Clock.fixed(dia.atStartOfDay(ZONA).toInstant(), ZONA);
    }

    // GastosDoMes é classe concreta (inmockável no JDK atual): usa-se a real
    // sobre o GastoRepository mockado, com o mesmo Clock da pergunta.
    private GastoPorDiaPergunta pergunta(Clock clock) {
        return new GastoPorDiaPergunta(orcamentoRepository, new GastosDoMes(gastoRepository, clock), clock);
    }

    private void orcamento(String valor) {
        when(orcamentoRepository.findByUsuarioId(USUARIO))
            .thenReturn(Optional.of(new Orcamento(USUARIO, new BigDecimal(valor))));
    }

    private void gasto(LocalDate dia, String valor) {
        String data = dia.toString();
        String inicio = dia.withDayOfMonth(1).toString();
        String fim = dia.withDayOfMonth(dia.lengthOfMonth()).toString();
        Gasto g = new Gasto(USUARIO, "d", "Cat", "c", data, new BigDecimal(valor), "", null);
        lenient().when(gastoRepository.findPorPeriodo(USUARIO, inicio, fim)).thenReturn(List.of(g));
    }

    @Test
    void dividePeloDiasRestantesIncluindoHoje() {
        // 19/nov (mês de 30 dias) -> 12 dias restantes; restante 480 -> 40,00/dia.
        LocalDate dia = LocalDate.of(2026, 11, 19);
        orcamento("1500");
        gasto(dia, "1020");
        RespostaPronta r = pergunta(em(dia)).responder(USUARIO, Map.of());
        assertThat(r.dados().get("diasRestantes")).isEqualTo(12);
        assertThat((BigDecimal) r.dados().get("porDia")).isEqualByComparingTo("40.00");
        assertThat(r.texto())
            .isEqualTo("Restam " + FormatoBRL.moeda(new BigDecimal("480"))
                + " do orçamento e 12 dias neste mês: dá para gastar até "
                + FormatoBRL.moeda(new BigDecimal("40.00")) + " por dia.");
    }

    @Test
    void ultimoDiaDoMesEhUmDia() {
        LocalDate dia = LocalDate.of(2026, 11, 30);
        orcamento("1500");
        gasto(dia, "1020");
        RespostaPronta r = pergunta(em(dia)).responder(USUARIO, Map.of());
        assertThat(r.dados().get("diasRestantes")).isEqualTo(1);
        assertThat((BigDecimal) r.dados().get("porDia")).isEqualByComparingTo("480.00");
        assertThat(r.texto()).contains("1 dia neste mês");
    }

    @Test
    void orcamentoEstouradoDaZeroPorDia() {
        LocalDate dia = LocalDate.of(2026, 11, 19);
        orcamento("1500");
        gasto(dia, "1620");
        RespostaPronta r = pergunta(em(dia)).responder(USUARIO, Map.of());
        assertThat((BigDecimal) r.dados().get("porDia")).isEqualByComparingTo("0");
        assertThat(r.texto())
            .isEqualTo("Você já usou todo o orçamento deste mês: não há valor livre por dia.");
    }

    @Test
    void arredondaParaBaixo() {
        // restante 100 em 3 dias (último dia = 28/fev/2026) -> 33,33.
        LocalDate dia = LocalDate.of(2026, 2, 26);
        orcamento("100");
        gasto(dia, "0");
        RespostaPronta r = pergunta(em(dia)).responder(USUARIO, Map.of());
        assertThat(r.dados().get("diasRestantes")).isEqualTo(3);
        assertThat((BigDecimal) r.dados().get("porDia")).isEqualByComparingTo("33.33");
    }

    @Test
    void indisponivelSemOrcamento() {
        when(orcamentoRepository.findByUsuarioId(USUARIO)).thenReturn(Optional.empty());
        assertThat(pergunta(em(LocalDate.of(2026, 11, 19))).disponivel(USUARIO)).isFalse();
    }
}
