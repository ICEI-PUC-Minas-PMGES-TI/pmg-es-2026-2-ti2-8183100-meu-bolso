package Projeto.MeuBolso.assistente;

import Projeto.MeuBolso.model.Gasto;
import Projeto.MeuBolso.repository.GastoRepository;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import org.springframework.stereotype.Component;

/**
 * Soma dos gastos do mês atual de um usuário. Centraliza a regra "mês corrente"
 * (1º ao último dia, via Clock injetado) para as perguntas de orçamento.
 */
@Component
public class GastosDoMes {

    private final GastoRepository gastoRepository;
    private final Clock clock;

    public GastosDoMes(GastoRepository gastoRepository, Clock clock) {
        this.gastoRepository = gastoRepository;
        this.clock = clock;
    }

    public BigDecimal total(String usuarioId) {
        BigDecimal total = BigDecimal.ZERO;
        for (Gasto g : doMes(usuarioId)) {
            total = total.add(g.getValor() == null ? BigDecimal.ZERO : g.getValor());
        }
        return total;
    }

    /** Gastos do mês corrente (1º ao último dia, via Clock injetado). */
    public List<Gasto> doMes(String usuarioId) {
        YearMonth mes = YearMonth.now(clock);
        return noPeriodo(usuarioId, mes.atDay(1), mes.atEndOfMonth());
    }

    /** Gastos do usuário num intervalo de datas (limites inclusivos). */
    public List<Gasto> noPeriodo(String usuarioId, LocalDate inicio, LocalDate fim) {
        return gastoRepository.findPorPeriodo(usuarioId, inicio.toString(), fim.toString());
    }
}
