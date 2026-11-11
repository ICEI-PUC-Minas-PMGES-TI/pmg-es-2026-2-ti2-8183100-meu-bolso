package Projeto.MeuBolso.whatsapp;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Optional;
import java.util.regex.Pattern;

/**
 * Interpreta um valor em reais digitado livremente no WhatsApp.
 *
 * Aceita: "50", "50,9", "50,90", "50.90", "R$ 1.234,56", "1.234", "1234.5".
 * Regras para o separador:
 *  - com vírgula e ponto: ponto é milhar e vírgula é decimal ("1.234,56");
 *  - só vírgula: vírgula é decimal ("50,90");
 *  - só ponto: se o formato for de milhar ("1.234" / "12.345.678") é milhar,
 *    senão é decimal ("50.90").
 * O valor precisa ser maior que zero, ter no máximo 2 casas e ser menor que
 * 1 bilhão (evita digitação absurda).
 */
public final class ValorMonetario {

    private static final BigDecimal LIMITE = new BigDecimal("1000000000");
    private static final Pattern SO_NUMERO = Pattern.compile("\\d+(\\.\\d+)?");
    private static final Pattern MILHAR_COM_PONTO = Pattern.compile("\\d{1,3}(\\.\\d{3})+");

    private ValorMonetario() {}

    public static Optional<BigDecimal> interpretar(String texto) {
        if (texto == null) return Optional.empty();

        String s = texto.trim()
            .replaceFirst("(?i)^r\\$", "")
            .replace(" ", "")
            .replace("\u00A0", "");
        if (s.isEmpty()) return Optional.empty();

        boolean temVirgula = s.contains(",");
        boolean temPonto = s.contains(".");
        if (temVirgula && temPonto) {
            s = s.replace(".", "").replace(",", ".");
        } else if (temVirgula) {
            s = s.replace(",", ".");
        } else if (temPonto && MILHAR_COM_PONTO.matcher(s).matches()) {
            s = s.replace(".", "");
        }

        if (!SO_NUMERO.matcher(s).matches()) return Optional.empty();

        BigDecimal valor = new BigDecimal(s);
        if (valor.scale() > 2) return Optional.empty();
        if (valor.signum() <= 0 || valor.compareTo(LIMITE) >= 0) return Optional.empty();
        return Optional.of(valor.setScale(2, RoundingMode.UNNECESSARY));
    }
}
