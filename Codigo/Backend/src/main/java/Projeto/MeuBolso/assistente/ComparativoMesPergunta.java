package Projeto.MeuBolso.assistente;

import Projeto.MeuBolso.model.Gasto;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.TreeSet;
import org.springframework.stereotype.Component;

/**
 * "Como foi este mês comparado ao anterior?" — compara o gasto acumulado do
 * mês atual (dia 1 até hoje) com o mesmo período do mês anterior.
 */
@Component
public class ComparativoMesPergunta implements PerguntaPronta {

    private static final Locale PT_BR = Locale.forLanguageTag("pt-BR");
    private static final BigDecimal CEM = BigDecimal.valueOf(100);

    private final GastosDoMes gastosDoMes;
    private final Clock clock;

    public ComparativoMesPergunta(GastosDoMes gastosDoMes, Clock clock) {
        this.gastosDoMes = gastosDoMes;
        this.clock = clock;
    }

    @Override
    public String id() {
        return "comparativo_mes";
    }

    @Override
    public String texto() {
        return "Como foi este mês comparado ao anterior?";
    }

    @Override
    public boolean disponivel(String usuarioId) {
        return !mesAtualInteiro(usuarioId).isEmpty();
    }

    @Override
    public RespostaPronta responder(String usuarioId, Map<String, String> params) {
        LocalDate hoje = LocalDate.now(clock);
        int diaCorte = hoje.getDayOfMonth();

        YearMonth mesAtual = YearMonth.from(hoje);
        YearMonth mesAnteriorYm = mesAtual.minusMonths(1);

        LocalDate inicioAtual = mesAtual.atDay(1);
        List<Gasto> gastosAtual = gastosDoMes.noPeriodo(usuarioId, inicioAtual, hoje);

        // Mesmo dia de corte, limitado ao último dia do mês anterior.
        int diaCorteAnterior = Math.min(diaCorte, mesAnteriorYm.lengthOfMonth());
        LocalDate inicioAnterior = mesAnteriorYm.atDay(1);
        LocalDate fimAnterior = mesAnteriorYm.atDay(diaCorteAnterior);
        List<Gasto> gastosAnterior = gastosDoMes.noPeriodo(usuarioId, inicioAnterior, fimAnterior);

        BigDecimal atual = somar(gastosAtual);
        BigDecimal anterior = somar(gastosAnterior);
        BigDecimal diferenca = atual.subtract(anterior);

        Integer percentual = anterior.signum() == 0
            ? null
            : diferenca.multiply(CEM).divide(anterior, 0, RoundingMode.HALF_UP).intValueExact();

        String nomeMesAnterior = mesAnteriorYm.getMonth()
            .getDisplayName(TextStyle.FULL, PT_BR).toLowerCase(PT_BR);

        StringBuilder texto = new StringBuilder();
        if (anterior.signum() == 0) {
            texto.append(String.format(PT_BR,
                "Até o dia %d você gastou %s. Não há gastos no mesmo período de %s para comparar.",
                diaCorte, FormatoBRL.moeda(atual), nomeMesAnterior));
        } else if (diferenca.signum() == 0) {
            texto.append(String.format(PT_BR,
                "Até o dia %d você gastou %s, o mesmo valor do mesmo período de %s.",
                diaCorte, FormatoBRL.moeda(atual), nomeMesAnterior));
        } else {
            String maisMenos = diferenca.signum() > 0 ? "a mais" : "a menos";
            texto.append(String.format(PT_BR,
                "Até o dia %d você gastou %s, %d%% %s que no mesmo período de %s (%s).",
                diaCorte, FormatoBRL.moeda(atual), Math.abs(percentual), maisMenos,
                nomeMesAnterior, FormatoBRL.moeda(anterior)));
        }

        // Só faz sentido comparar categorias quando há um período anterior com gastos.
        Map<String, Object> categoriaQueMaisSubiu =
            anterior.signum() == 0 ? null : maiorAumento(gastosAtual, gastosAnterior);
        if (categoriaQueMaisSubiu != null) {
            texto.append(String.format(PT_BR, " A categoria que mais subiu foi %s (+%s).",
                categoriaQueMaisSubiu.get("nome"),
                FormatoBRL.moeda((BigDecimal) categoriaQueMaisSubiu.get("aumento"))));
        }

        Map<String, Object> dados = new LinkedHashMap<>();
        dados.put("atual", atual);
        dados.put("anterior", anterior);
        dados.put("diferenca", diferenca);
        dados.put("percentual", percentual);
        dados.put("diaCorte", diaCorte);
        dados.put("mesAnterior", nomeMesAnterior);
        dados.put("categoriaQueMaisSubiu", categoriaQueMaisSubiu);
        return new RespostaPronta(texto.toString(), dados);
    }

    // Categoria com maior aumento absoluto (atual - anterior); empate alfabético.
    // null se nenhuma categoria subiu.
    private static Map<String, Object> maiorAumento(List<Gasto> atual, List<Gasto> anterior) {
        Map<String, BigDecimal> somaAtual = porCategoria(atual);
        Map<String, BigDecimal> somaAnterior = porCategoria(anterior);

        TreeSet<String> categorias = new TreeSet<>();
        categorias.addAll(somaAtual.keySet());
        categorias.addAll(somaAnterior.keySet());

        String melhorNome = null;
        BigDecimal melhorAumento = null;
        for (String cat : categorias) {
            BigDecimal aumento = somaAtual.getOrDefault(cat, BigDecimal.ZERO)
                .subtract(somaAnterior.getOrDefault(cat, BigDecimal.ZERO));
            if (aumento.signum() > 0 && (melhorAumento == null || aumento.compareTo(melhorAumento) > 0)) {
                melhorAumento = aumento;
                melhorNome = cat;
            }
        }

        if (melhorNome == null) {
            return null;
        }
        Map<String, Object> resultado = new LinkedHashMap<>();
        resultado.put("nome", melhorNome);
        resultado.put("aumento", melhorAumento);
        return resultado;
    }

    private static Map<String, BigDecimal> porCategoria(List<Gasto> gastos) {
        Map<String, BigDecimal> soma = new LinkedHashMap<>();
        for (Gasto g : gastos) {
            soma.merge(g.getCategoria(), valor(g), BigDecimal::add);
        }
        return soma;
    }

    private List<Gasto> mesAtualInteiro(String usuarioId) {
        YearMonth mes = YearMonth.now(clock);
        return gastosDoMes.noPeriodo(usuarioId, mes.atDay(1), mes.atEndOfMonth());
    }

    private static BigDecimal somar(List<Gasto> gastos) {
        BigDecimal total = BigDecimal.ZERO;
        for (Gasto g : gastos) {
            total = total.add(valor(g));
        }
        return total;
    }

    private static BigDecimal valor(Gasto g) {
        return Optional.ofNullable(g.getValor()).orElse(BigDecimal.ZERO);
    }
}
