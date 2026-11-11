package Projeto.MeuBolso.assistente;

import Projeto.MeuBolso.model.Gasto;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import org.springframework.stereotype.Component;

/**
 * "Qual foi meu maior gasto do mês?" — destaca o gasto de maior valor do mês
 * atual (empate pela data mais recente) e o seu peso no total do mês.
 */
@Component
public class MaiorGastoPergunta implements PerguntaPronta {

    private static final Locale PT_BR = Locale.forLanguageTag("pt-BR");
    private static final BigDecimal CEM = BigDecimal.valueOf(100);
    private static final DateTimeFormatter DIA_MES = DateTimeFormatter.ofPattern("dd/MM");

    private final GastosDoMes gastosDoMes;
    private final Clock clock;

    public MaiorGastoPergunta(GastosDoMes gastosDoMes, Clock clock) {
        this.gastosDoMes = gastosDoMes;
        this.clock = clock;
    }

    @Override
    public String id() {
        return "maior_gasto";
    }

    @Override
    public String texto() {
        return "Qual foi meu maior gasto do mês?";
    }

    @Override
    public boolean disponivel(String usuarioId) {
        return !gastosDoMes(usuarioId).isEmpty();
    }

    @Override
    public RespostaPronta responder(String usuarioId, Map<String, String> params) {
        List<Gasto> gastos = gastosDoMes(usuarioId);

        // Maior valor; empate pela data (texto ISO) mais recente.
        Gasto maior = gastos.stream()
            .max(Comparator.comparing(MaiorGastoPergunta::valor)
                .thenComparing(Gasto::getData))
            .orElseThrow();

        BigDecimal total = BigDecimal.ZERO;
        for (Gasto g : gastos) {
            total = total.add(valor(g));
        }

        int percentual = valor(maior).multiply(CEM)
            .divide(total, 0, RoundingMode.HALF_UP)
            .intValueExact();

        String dataFmt = LocalDate.parse(maior.getData()).format(DIA_MES);
        String texto = String.format(PT_BR,
            "Seu maior gasto neste mês foi \"%s\" (%s): %s em %s, %d%% do total do mês.",
            maior.getDescricao(), maior.getCategoria(), FormatoBRL.moeda(valor(maior)), dataFmt, percentual);

        Map<String, Object> dados = new LinkedHashMap<>();
        dados.put("descricao", maior.getDescricao());
        dados.put("categoria", maior.getCategoria());
        dados.put("valor", valor(maior));
        dados.put("data", maior.getData());
        dados.put("percentualDoTotal", percentual);
        return new RespostaPronta(texto, dados);
    }

    private List<Gasto> gastosDoMes(String usuarioId) {
        YearMonth mes = YearMonth.now(clock);
        return gastosDoMes.noPeriodo(usuarioId, mes.atDay(1), mes.atEndOfMonth());
    }

    private static BigDecimal valor(Gasto g) {
        return Optional.ofNullable(g.getValor()).orElse(BigDecimal.ZERO);
    }
}
