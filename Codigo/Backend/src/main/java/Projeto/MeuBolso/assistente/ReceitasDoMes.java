package Projeto.MeuBolso.assistente;

import Projeto.MeuBolso.model.Receita;
import Projeto.MeuBolso.repository.ReceitaRepository;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import org.springframework.stereotype.Component;

/**
 * Soma das receitas do mês atual de um usuário. Centraliza a regra "mês corrente"
 * (1º ao último dia, via Clock injetado) para as perguntas de orçamento.
 */
@Component
public class ReceitasDoMes {

    private final ReceitaRepository receitaRepository;
    private final Clock clock;

    public ReceitasDoMes(ReceitaRepository receitaRepository, Clock clock) {
        this.receitaRepository = receitaRepository;
        this.clock = clock;
    }

    public BigDecimal total(String usuarioId) {
        BigDecimal total = BigDecimal.ZERO;
        for (Receita r : doMes(usuarioId)) {
            total = total.add(r.getValor() == null ? BigDecimal.ZERO : r.getValor());
        }
        return total;
    }

    /** Receitas do mês corrente (1º ao último dia, via Clock injetado). */
    public List<Receita> doMes(String usuarioId) {
        YearMonth mes = YearMonth.now(clock);
        return noPeriodo(usuarioId, mes.atDay(1), mes.atEndOfMonth());
    }

    /** Chave "AAAA-MM" do mês corrente (mesmo Clock usado em doMes/total). */
    public String mesAtualChave() {
        return YearMonth.now(clock).toString();
    }

    /** Receitas do usuário num intervalo de datas (limites inclusivos). */
    public List<Receita> noPeriodo(String usuarioId, LocalDate inicio, LocalDate fim) {
        return receitaRepository.findPorPeriodo(usuarioId, inicio.toString(), fim.toString());
    }
}
