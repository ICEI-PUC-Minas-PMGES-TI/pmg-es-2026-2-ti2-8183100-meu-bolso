package Projeto.MeuBolso.assistente;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.text.Normalizer;

/** Utilidades de texto compartilhadas pelas consultas de chat (gastos/receitas). */
final class TextoConsulta {

    private static final DateTimeFormatter DIA_MES = DateTimeFormatter.ofPattern("dd/MM");

    private TextoConsulta() {}

    /** Normaliza para comparar categorias: sem acentos, sem caixa, aparado. */
    static String normalizar(String s) {
        if (s == null) return "";
        String semAcento = Normalizer.normalize(s, Normalizer.Form.NFD)
            .replaceAll("\\p{M}+", "");
        return semAcento.trim().toLowerCase();
    }

    /** true se as duas categorias forem iguais ignorando caixa e acentos. */
    static boolean mesmaCategoria(String a, String b) {
        return normalizar(a).equals(normalizar(b));
    }

    /** "AAAA-MM-DD" -> "dd/MM"; texto original se não casar o formato. */
    static String formatarData(String data) {
        if (data == null) return "";
        try {
            return LocalDate.parse(data).format(DIA_MES);
        } catch (DateTimeParseException e) {
            return data;
        }
    }
}
