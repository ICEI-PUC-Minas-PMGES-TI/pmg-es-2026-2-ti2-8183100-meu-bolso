package Projeto.MeuBolso.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import Projeto.MeuBolso.model.Gasto;
import Projeto.MeuBolso.model.Meta;
import Projeto.MeuBolso.model.Orcamento;
import Projeto.MeuBolso.model.Recorrencia;
import Projeto.MeuBolso.repository.GastoRepository;
import Projeto.MeuBolso.repository.OrcamentoRepository;
import Projeto.MeuBolso.repository.RecorrenciaRepository;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ReservaServiceTest {

    private static final String USUARIO = "u1";
    private static final ZoneId ZONA = ZoneId.of("America/Sao_Paulo");
    // Hoje = 20/11/2026: meses completos do histórico = out, set e ago/2026.
    private static final Clock CLOCK = Clock.fixed(
        LocalDate.of(2026, 11, 20).atStartOfDay(ZONA).toInstant(), ZONA);

    @Mock GastoRepository gastoRepository;
    @Mock RecorrenciaRepository recorrenciaRepository;
    @Mock OrcamentoRepository orcamentoRepository;

    ReservaService service;

    @BeforeEach
    void preparar() {
        service = new ReservaService(gastoRepository, recorrenciaRepository, orcamentoRepository, CLOCK);
    }

    private static Gasto gasto(String data, String valor, String recorrenciaId) {
        return new Gasto(USUARIO, "x", "Outros", "Inter", data, new BigDecimal(valor), "", recorrenciaId);
    }

    private static Recorrencia recorrencia(String valor, String... mesesPulados) {
        Recorrencia r = new Recorrencia(USUARIO, "Aluguel", "Moradia", "Inter",
            new BigDecimal(valor), "", 5, true, "2026-11");
        r.setMesesPulados(List.of(mesesPulados));
        return r;
    }

    private void gastos(Gasto... gs) {
        when(gastoRepository.findByUsuarioIdOrderByDataDesc(USUARIO)).thenReturn(List.of(gs));
    }

    private void recorrencias(Recorrencia... rs) {
        when(recorrenciaRepository.findByUsuarioId(USUARIO)).thenReturn(List.of(rs));
    }

    private static BigDecimal valorDo(ReservaService.Sugestao s, int meses) {
        return s.opcoes().stream().filter(o -> o.meses() == meses).findFirst().orElseThrow().valor();
    }

    private static Meta reserva(String atual, Boolean automatico, String minimo, Integer horizonte) {
        Meta m = new Meta(USUARIO, "Reserva", null, null, "alta");
        m.setTipo(Meta.TIPO_RESERVA);
        m.setValorAtual(new BigDecimal(atual));
        m.setMinimoAutomatico(automatico);
        m.setValorMinimo(minimo == null ? null : new BigDecimal(minimo));
        m.setHorizonteMeses(horizonte);
        return m;
    }

    /* ---------- Bases do cálculo ---------- */

    @Test
    void historicoSomaFixosPrevistosEMediaDosVariaveisArredondando() {
        // Variáveis: out 300 + set 700 + ago 300 = 1300 / 3 = 433,33 por mês.
        // O gasto recorrente de outubro (r1) fica fora da média.
        // Fixos: aluguel de 1000 por mês.
        gastos(
            gasto("2026-10-10", "300", null),
            gasto("2026-10-05", "1000", "r1"),
            gasto("2026-09-12", "700", null),
            gasto("2026-08-03", "300", null),
            gasto("2026-11-02", "999", null)); // mês atual: não entra
        recorrencias(recorrencia("1000"));

        ReservaService.Sugestao s = service.sugerir(USUARIO, null);

        assertThat(s.base()).isEqualTo(ReservaService.BASE_HISTORICO);
        // 3 meses: 3000 + 1299,99 = 4299,99 -> 4300
        assertThat(valorDo(s, 3)).isEqualByComparingTo("4300");
        // 6 meses: 6000 + 2599,98 = 8599,98 -> 8600
        assertThat(valorDo(s, 6)).isEqualByComparingTo("8600");
        // 12 meses: 12000 + 5199,96 = 17199,96 -> 17200
        assertThat(valorDo(s, 12)).isEqualByComparingTo("17200");
        assertThat(s.custoMensal()).isEqualByComparingTo("1433.33");
    }

    @Test
    void mesPuladoNaoEntraNosFixos() {
        gastos(gasto("2026-10-10", "0.01", null), gasto("2026-08-10", "0.01", null));
        recorrencias(recorrencia("1000", "2026-12"));

        ReservaService.Sugestao s = service.sugerir(USUARIO, null);

        // 3 meses (dez pulado, jan, fev): 2000 + centavos -> 2100
        assertThat(valorDo(s, 3)).isEqualByComparingTo("2100");
    }

    @Test
    void mediaIgnoraMesesAntesDoPrimeiroGasto() {
        // Conta começou em outubro: a média é só de outubro (600), não 600/3.
        gastos(gasto("2026-10-10", "600", null));
        recorrencias();

        ReservaService.Sugestao s = service.sugerir(USUARIO, null);

        assertThat(s.base()).isEqualTo(ReservaService.BASE_HISTORICO);
        assertThat(valorDo(s, 3)).isEqualByComparingTo("1800");
    }

    @Test
    void semMesCompletoUsaOrcamento() {
        gastos(gasto("2026-11-02", "50", null)); // só o mês atual
        recorrencias();
        when(orcamentoRepository.findByUsuarioIdAndMes(USUARIO, "2026-11"))
            .thenReturn(Optional.of(new Orcamento(USUARIO, "2026-11", new BigDecimal("2000"))));

        ReservaService.Sugestao s = service.sugerir(USUARIO, null);

        assertThat(s.base()).isEqualTo(ReservaService.BASE_ORCAMENTO);
        assertThat(valorDo(s, 6)).isEqualByComparingTo("12000");
    }

    @Test
    void semHistoricoNemOrcamentoUsaSoOsFixos() {
        gastos();
        recorrencias(recorrencia("750"));

        ReservaService.Sugestao s = service.sugerir(USUARIO, null);

        assertThat(s.base()).isEqualTo(ReservaService.BASE_RECORRENCIAS);
        assertThat(valorDo(s, 3)).isEqualByComparingTo("2300"); // 2250 -> 2300
    }

    @Test
    void semDadosUsaOValorInformado() {
        gastos();
        recorrencias();

        ReservaService.Sugestao s = service.sugerir(USUARIO, new BigDecimal("1450"));

        assertThat(s.base()).isEqualTo(ReservaService.BASE_INFORMADO);
        assertThat(valorDo(s, 6)).isEqualByComparingTo("8700");
    }

    @Test
    void semNenhumDadoNaoSugere() {
        gastos();
        recorrencias();

        ReservaService.Sugestao s = service.sugerir(USUARIO, null);

        assertThat(s.base()).isEqualTo(ReservaService.BASE_SEM_DADOS);
        assertThat(s.custoMensal()).isNull();
        assertThat(s.opcoes()).allSatisfy(o -> assertThat(o.valor()).isNull());
    }

    /* ---------- Situação e níveis ---------- */

    @Test
    void situacaoComMinimoAutomaticoUsaOHorizonteDaReserva() {
        // Informado 1000/mês, horizonte 3 -> mínimo 3000; guardado 1500 = 50% -> atenção.
        gastos();
        recorrencias();
        Meta r = reserva("1500", true, null, 3);
        r.setCustoMensalInformado(new BigDecimal("1000"));

        ReservaService.Situacao s = service.situacao(USUARIO, r);

        assertThat(s.valorMinimo()).isEqualByComparingTo("3000");
        assertThat(s.nivel()).isEqualTo(ReservaService.NIVEL_ATENCAO);
        assertThat(s.mesesCobertos()).isEqualByComparingTo("1.5");
    }

    @Test
    void situacaoComMinimoManualIgnoraOCalculo() {
        gastos();
        recorrencias();
        Meta r = reserva("2000", false, "5000", 6);
        r.setCustoMensalInformado(new BigDecimal("1000"));

        ReservaService.Situacao s = service.situacao(USUARIO, r);

        assertThat(s.valorMinimo()).isEqualByComparingTo("5000");
        assertThat(s.nivel()).isEqualTo(ReservaService.NIVEL_CRITICA); // 40%
        assertThat(s.mesesCobertos()).isEqualByComparingTo("2.0");
    }

    @Test
    void niveisDeAlerta() {
        BigDecimal minimo = new BigDecimal("1000");
        assertThat(ReservaService.nivel(BigDecimal.ZERO, minimo)).isEqualTo(ReservaService.NIVEL_VAZIA);
        assertThat(ReservaService.nivel(new BigDecimal("499.99"), minimo)).isEqualTo(ReservaService.NIVEL_CRITICA);
        assertThat(ReservaService.nivel(new BigDecimal("500"), minimo)).isEqualTo(ReservaService.NIVEL_ATENCAO);
        assertThat(ReservaService.nivel(new BigDecimal("999.99"), minimo)).isEqualTo(ReservaService.NIVEL_ATENCAO);
        assertThat(ReservaService.nivel(new BigDecimal("1000"), minimo)).isEqualTo(ReservaService.NIVEL_PROTEGIDA);
        assertThat(ReservaService.nivel(new BigDecimal("10"), null)).isEqualTo(ReservaService.NIVEL_SEM_MINIMO);
        assertThat(ReservaService.nivel(null, null)).isEqualTo(ReservaService.NIVEL_VAZIA);
    }

    @Test
    void horizonteInvalidoViraOPadrao() {
        assertThat(ReservaService.horizonte(reserva("0", true, null, null))).isEqualTo(6);
        assertThat(ReservaService.horizonte(reserva("0", true, null, 5))).isEqualTo(6);
        assertThat(ReservaService.horizonte(reserva("0", true, null, 12))).isEqualTo(12);
    }

    @Test
    void referenciaDoObjetivoEOValorAlvo() {
        Meta objetivo = new Meta(USUARIO, "Viagem", new BigDecimal("3000"), null, "media");
        assertThat(service.referencia(USUARIO, objetivo)).isEqualByComparingTo("3000");
    }
}
