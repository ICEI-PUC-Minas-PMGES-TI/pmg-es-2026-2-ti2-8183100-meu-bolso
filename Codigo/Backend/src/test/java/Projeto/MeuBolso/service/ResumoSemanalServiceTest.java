package Projeto.MeuBolso.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import Projeto.MeuBolso.model.Meta;
import Projeto.MeuBolso.model.ResumoSemanalDtos.MetaProgresso;
import Projeto.MeuBolso.model.ResumoSemanalDtos.Resumo;
import Projeto.MeuBolso.repository.GastoRepository;
import Projeto.MeuBolso.repository.MetaRepository;
import Projeto.MeuBolso.repository.OrcamentoRepository;
import Projeto.MeuBolso.repository.PreferenciaResumoRepository;
import Projeto.MeuBolso.repository.RecorrenciaRepository;
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

/**
 * Montagem do resumo semanal com e sem reserva de emergência.
 *
 * Só os repositórios (interfaces) são simulados; os services são instâncias
 * reais, porque o Mockito não consegue simular classes no JDK 26.
 */
@ExtendWith(MockitoExtension.class)
class ResumoSemanalServiceTest {

    private static final String USUARIO = "u1";
    private static final ZoneId ZONA = ZoneId.of("America/Sao_Paulo");
    private static final LocalDate HOJE = LocalDate.of(2026, 11, 24);
    private static final Clock CLOCK = Clock.fixed(HOJE.atStartOfDay(ZONA).toInstant(), ZONA);

    @Mock GastoRepository gastoRepository;
    @Mock OrcamentoRepository orcamentoRepository;
    @Mock MetaRepository metaRepository;
    @Mock RecorrenciaRepository recorrenciaRepository;
    @Mock PreferenciaResumoRepository preferenciaRepository;

    ResumoSemanalService service;

    @BeforeEach
    void preparar() {
        // Sem recorrências, o processamento não toca na carteira (CarteiraService = null).
        GastoRecorrenciaService recorrencias = new GastoRecorrenciaService(gastoRepository, recorrenciaRepository, null);
        ReservaService reservas = new ReservaService(gastoRepository, recorrenciaRepository, orcamentoRepository, CLOCK);
        service = new ResumoSemanalService(gastoRepository, orcamentoRepository, metaRepository,
            recorrenciaRepository, preferenciaRepository, recorrencias, new ResumoEmailService(null), reservas);
    }

    private static Meta objetivo(String nome, String alvo, String atual) {
        Meta m = new Meta(USUARIO, nome, new BigDecimal(alvo), null, "media");
        m.setValorAtual(new BigDecimal(atual));
        return m;
    }

    @Test
    void semReservaOResumoTrazOConvite() {
        when(metaRepository.findByUsuarioId(USUARIO)).thenReturn(List.of(objetivo("Viagem", "3000", "300")));

        Resumo r = service.montar(USUARIO, HOJE);

        assertThat(r.reserva()).isNotNull();
        assertThat(r.reserva().nivel()).isEqualTo("sem_reserva");
        assertThat(r.reserva().nome()).isNull();
        assertThat(r.reserva().mensagem()).contains("ainda não configurou sua reserva de emergência");
        assertThat(r.metas()).extracting(MetaProgresso::nome).containsExactly("Viagem");
    }

    @Test
    void semNenhumaMetaTambemTrazOConvite() {
        when(metaRepository.findByUsuarioId(USUARIO)).thenReturn(List.of());

        Resumo r = service.montar(USUARIO, HOJE);

        assertThat(r.metas()).isEmpty();
        assertThat(r.reserva().nivel()).isEqualTo("sem_reserva");
    }

    @Test
    void comReservaOResumoTrazNivelMensagemEProgressoAteOMinimo() {
        Meta reserva = new Meta(USUARIO, "Reserva de emergência", null, null, "alta");
        reserva.setTipo(Meta.TIPO_RESERVA);
        reserva.setValorAtual(new BigDecimal("100"));
        reserva.setHorizonteMeses(6);
        reserva.setMinimoAutomatico(false);
        reserva.setValorMinimo(new BigDecimal("1200"));
        reserva.setCustoMensalInformado(new BigDecimal("200"));
        when(metaRepository.findByUsuarioId(USUARIO)).thenReturn(List.of(objetivo("Viagem", "3000", "300"), reserva));

        Resumo r = service.montar(USUARIO, HOJE);

        assertThat(r.reserva().nome()).isEqualTo("Reserva de emergência");
        assertThat(r.reserva().nivel()).isEqualTo(ReservaService.NIVEL_CRITICA);
        assertThat(r.reserva().mensagem()).contains("só cobre 15 dias de gastos");
        // Na lista de metas, a reserva usa o mínimo (1200) no lugar do valor-alvo: 100/1200 = 8%.
        MetaProgresso progresso = r.metas().stream()
            .filter(m -> m.nome().equals("Reserva de emergência")).findFirst().orElseThrow();
        assertThat(progresso.valorAlvo()).isEqualByComparingTo("1200");
        assertThat(progresso.percentual()).isEqualTo(8);
    }
}
