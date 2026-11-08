package Projeto.MeuBolso.assistente;

import Projeto.MeuBolso.model.Gasto;

import java.math.BigDecimal;
import java.math.RoundingMode;
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
 * Reaproveita {@link GastosDoMes} (regra de "mês corrente" via Clock) e
 * {@link FormatoBRL} (formatação monetária pt-BR).
 */
@Component
public class GastosPorCategoriaPergunta implements PerguntaPronta {

    private static final Locale PT_BR = Locale.forLanguageTag("pt-BR");
    private static final int TOP = 3;

    private final GastosDoMes gastosDoMes;

    public GastosPorCategoriaPergunta(GastosDoMes gastosDoMes) {
        this.gastosDoMes = gastosDoMes;
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
        return !gastosDoMes.doMes(usuarioId).isEmpty();
    }

    @Override
    public RespostaPronta responder(String usuarioId, Map<String, String> params) {
        List<Gasto> gastos = gastosDoMes.doMes(usuarioId);

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
                e.getKey(), FormatoBRL.moeda(e.getValue()), percentual));
        }

        String texto = String.format(PT_BR, "Neste mês você gastou %s. Maiores categorias: %s.",
            FormatoBRL.moeda(total), String.join(", ", partesTexto));

        Map<String, Object> dados = new LinkedHashMap<>();
        dados.put("total", total);
        dados.put("categorias", categorias);

        return new RespostaPronta(texto, dados);
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
}
