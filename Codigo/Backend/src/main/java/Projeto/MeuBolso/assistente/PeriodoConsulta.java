package Projeto.MeuBolso.assistente;

import java.time.Clock;
import java.time.LocalDate;
import java.time.YearMonth;

/**
 * Período nomeado das consultas de chat (gastos/receitas): um id, o rótulo em
 * minúsculas e o intervalo [inicio, fim].
 *
 * Centraliza o cálculo dos intervalos via {@link Clock}. Valor do parâmetro
 * inválido ou ausente cai em "mes_atual".
 */
record PeriodoConsulta(String id, String rotulo, LocalDate inicio, LocalDate fim) {

    /** Resolve o período a partir do Clock e do valor do parâmetro "periodo". */
    static PeriodoConsulta de(Clock clock, String valor) {
        LocalDate hoje = LocalDate.now(clock);
        return switch (valor == null ? "" : valor) {
            case "mes_anterior" -> {
                YearMonth anterior = YearMonth.from(hoje).minusMonths(1);
                yield new PeriodoConsulta("mes_anterior", "no mês passado",
                    anterior.atDay(1), anterior.atEndOfMonth());
            }
            case "ultimos_7_dias" -> new PeriodoConsulta("ultimos_7_dias", "nos últimos 7 dias",
                hoje.minusDays(6), hoje);
            case "ultimos_30_dias" -> new PeriodoConsulta("ultimos_30_dias", "nos últimos 30 dias",
                hoje.minusDays(29), hoje);
            default -> {
                YearMonth mes = YearMonth.from(hoje);
                yield new PeriodoConsulta("mes_atual", "este mês", mes.atDay(1), mes.atEndOfMonth());
            }
        };
    }
}
