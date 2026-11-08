package Projeto.MeuBolso.assistente;

import Projeto.MeuBolso.model.Gasto;
import Projeto.MeuBolso.repository.GastoRepository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.NumberFormat;
import java.time.Clock;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.springframework.stereotype.Component;

/**
 * "Onde gastei mais este mês?" — mostra as 3 maiores categorias de gasto do
 * mês atual, com valor e percentual do total.
 *
 * Só considera gastos do mês corrente (campo data no formato "AAAA-MM-DD"),
 * obtido via {@link Clock} injetado para permitir data fixa nos testes.
 */
@Component
public class GastosPorCategoriaPergunta implements PerguntaPronta {

    private static final Locale PT_BR = Locale.forLanguageTag("pt-BR");
    private static final int TOP = 3;

    private final GastoRepository gastoRepository;
    private final Clock clock;

    public GastosPorCategoriaPergunta(GastoRepository gastoRepository, Clock clock) {
        this.gastoRepository = gastoRepository;
        this.clock = clock;
    }

    @Override
    public String id() {
        return "gastos_por_categoria";
    }

    @Override
    public String texto() {
        return "Onde gastei mais este mês?";
    }

    @Override
    public boolean disponivel(String usuarioId) {
        return !gastosDoMes(usuarioId).isEmpty();
    }

    @Override
    public RespostaPronta responder(String usuarioId, Map<String, String> params) {
        List<Gasto> gastos = gastosDoMes(usuarioId);

        // Soma por categoria, preservando ordem de inserção para desempate estável.
        Map<String, BigDecimal> porCategoria = new LinkedHashMap<>();
        BigDecimal total = BigDecimal.ZERO;
        for (Gasto g : gastos) {
            BigDecimal valor = g.getValor() == null ? BigDecimal.ZERO : g.getValor();
            porCategoria.merge(g.getCategoria(), valor, BigDecimal::add);
            total = total.add(valor);
        }

        List<Map.Entry<String, BigDecimal>> ordenadas = new ArrayList<>(porCategoria.entrySet());
        ordenadas.sort(Comparator.comparing(Map.Entry<String, BigDecimal>::getValue).reversed());

        List<Map<String, Object>> categorias = new ArrayList<>();
        List<String> partesTexto = new ArrayList<>();
        for (Map.Entry<String, BigDecimal> e : ordenadas.stream().limit(TOP).toList()) {
            int percentual = percentual(e.getValue(), total);
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("nome", e.getKey());
            item.put("valor", e.getValue());
            item.put("percentual", percentual);
            categorias.add(item);
            partesTexto.add(String.format(PT_BR, "%s (%s, %d%%)",
                e.getKey(), moeda(e.getValue()), percentual));
        }

        String texto = String.format(PT_BR, "Neste mês você gastou %s. Maiores categorias: %s.",
            moeda(total), String.join(", ", partesTexto));

        Map<String, Object> dados = new LinkedHashMap<>();
        dados.put("total", total);
        dados.put("categorias", categorias);

        return new RespostaPronta(texto, dados);
    }

    private List<Gasto> gastosDoMes(String usuarioId) {
        YearMonth mes = YearMonth.now(clock);
        String inicio = mes.atDay(1).toString();
        String fim = mes.atEndOfMonth().toString();
        return gastoRepository.findPorPeriodo(usuarioId, inicio, fim);
    }

    // Percentual inteiro do valor sobre o total, arredondado HALF_UP.
    private static int percentual(BigDecimal valor, BigDecimal total) {
        if (total.signum() == 0) {
            return 0;
        }
        return valor.multiply(BigDecimal.valueOf(100))
            .divide(total, 0, RoundingMode.HALF_UP)
            .intValueExact();
    }

    private static String moeda(BigDecimal valor) {
        return NumberFormat.getCurrencyInstance(PT_BR).format(valor);
    }
}
