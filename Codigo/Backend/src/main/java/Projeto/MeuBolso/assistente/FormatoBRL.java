package Projeto.MeuBolso.assistente;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.util.Locale;

/** Formatação monetária em Real (pt-BR), compartilhada pelas perguntas do assistente. */
public final class FormatoBRL {

    private static final Locale PT_BR = Locale.forLanguageTag("pt-BR");

    private FormatoBRL() {}

    public static String moeda(BigDecimal valor) {
        return NumberFormat.getCurrencyInstance(PT_BR).format(valor);
    }
}
