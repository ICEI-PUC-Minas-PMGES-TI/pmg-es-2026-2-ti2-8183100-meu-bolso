package Projeto.MeuBolso.Config;

import java.time.LocalDate;
import java.time.ZoneId;

/**
 * Fuso horário de referência do Meu Bolso: o "hoje" e o "mês atual" do
 * sistema são sempre os do Brasil (horário de Brasília).
 *
 * Por que existe: em produção o servidor costuma rodar em UTC (ex.: Render).
 * Sem um fuso fixo, depois das 21h no Brasil o servidor já estaria no dia
 * seguinte — recorrências seriam lançadas um dia antes, o "mês atual" viraria
 * antes da hora e o backend discordaria do "hoje" do navegador (que a
 * Evolução financeira usa para separar realizado de previsto).
 *
 * Todo cálculo de "data de hoje" deve usar este fuso: o {@link java.time.Clock}
 * injetado (ver {@link ClockConfig}) ou, em código estático, {@link #hoje()}.
 */
public final class FusoHorario {

    public static final ZoneId ZONA = ZoneId.of("America/Sao_Paulo");

    private FusoHorario() {}

    /** Data de hoje no fuso do Brasil. */
    public static LocalDate hoje() {
        return LocalDate.now(ZONA);
    }
}
