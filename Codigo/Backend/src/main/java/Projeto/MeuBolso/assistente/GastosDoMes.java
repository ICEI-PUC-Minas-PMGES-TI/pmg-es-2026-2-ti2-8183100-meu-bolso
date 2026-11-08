package Projeto.MeuBolso.assistente;

import Projeto.MeuBolso.model.Gasto;
import Projeto.MeuBolso.repository.GastoRepository;

import java.math.BigDecimal;
import java.time.Clock;
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
        YearMonth mes = YearMonth.now(clock);
        String inicio = mes.atDay(1).toString();
        String fim = mes.atEndOfMonth().toString();
        BigDecimal total = BigDecimal.ZERO;
        for (Gasto g : gastoRepository.findPorPeriodo(usuarioId, inicio, fim)) {
            total = total.add(g.getValor() == null ? BigDecimal.ZERO : g.getValor());
        }
        return total;
    }
}
