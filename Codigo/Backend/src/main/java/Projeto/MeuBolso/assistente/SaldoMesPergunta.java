package Projeto.MeuBolso.assistente;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import org.springframework.stereotype.Component;

/**
 * "Qual é o meu saldo deste mês?" — compara o que entrou (receitas) com o que
 * saiu (gastos) no mês atual e diz quanto sobrou ou faltou.
 *
 * Reaproveita {@link ReceitasDoMes} e {@link GastosDoMes} (regra de "mês corrente"
 * via Clock) e {@link FormatoBRL} (formatação monetária pt-BR).
 */
@Component
public class SaldoMesPergunta implements PerguntaPronta {

    private static final Locale PT_BR = Locale.forLanguageTag("pt-BR");
    private static final BigDecimal CEM = BigDecimal.valueOf(100);

    private final ReceitasDoMes receitasDoMes;
    private final GastosDoMes gastosDoMes;

    public SaldoMesPergunta(ReceitasDoMes receitasDoMes, GastosDoMes gastosDoMes) {
        this.receitasDoMes = receitasDoMes;
        this.gastosDoMes = gastosDoMes;
    }

    @Override
    public String id() {
        return "saldo_mes";
    }

    @Override
    public String texto() {
        return "Qual é o meu saldo deste mês?";
    }

    @Override
    public boolean disponivel(String usuarioId) {
        // Basta uma movimentação (receita OU gasto) para a resposta fazer sentido.
        return !receitasDoMes.doMes(usuarioId).isEmpty() || !gastosDoMes.doMes(usuarioId).isEmpty();
    }

    @Override
    public RespostaPronta responder(String usuarioId, Map<String, String> params) {
        BigDecimal receitas = receitasDoMes.total(usuarioId);
        BigDecimal gastos = gastosDoMes.total(usuarioId);
        BigDecimal saldo = receitas.subtract(gastos);
        boolean temReceitas = receitas.signum() > 0;

        // percentualGasto só existe quando houve receitas (evita divisão por zero).
        Integer percentualGasto = temReceitas
            ? gastos.multiply(CEM).divide(receitas, 0, RoundingMode.HALF_UP).intValueExact()
            : null;

        String texto;
        if (!temReceitas) {
            // (c) sem receitas no mês.
            texto = String.format(PT_BR,
                "Neste mês você gastou %s e ainda não há receitas registradas.",
                FormatoBRL.moeda(gastos));
        } else {
            if (saldo.signum() >= 0) {
                // (a) sobrou (ou ficou zerado).
                texto = String.format(PT_BR,
                    "Neste mês você recebeu %s e gastou %s. Sobraram %s.",
                    FormatoBRL.moeda(receitas), FormatoBRL.moeda(gastos), FormatoBRL.moeda(saldo));
            } else {
                // (b) faltou: mostra o valor absoluto.
                texto = String.format(PT_BR,
                    "Neste mês você recebeu %s e gastou %s. Faltaram %s.",
                    FormatoBRL.moeda(receitas), FormatoBRL.moeda(gastos), FormatoBRL.moeda(saldo.abs()));
            }
            // (d) complemento com o percentual gasto do que foi recebido.
            texto += String.format(PT_BR, " Você gastou %d%% do que recebeu.", percentualGasto);
        }

        Map<String, Object> dados = new LinkedHashMap<>();
        dados.put("receitas", receitas);
        dados.put("gastos", gastos);
        dados.put("saldo", saldo);
        dados.put("percentualGasto", percentualGasto);

        return new RespostaPronta(texto, dados);
    }
}
