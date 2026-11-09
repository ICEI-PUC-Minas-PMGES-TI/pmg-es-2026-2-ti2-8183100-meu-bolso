package Projeto.MeuBolso.util;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/**
 * Normalização de telefone para um formato canônico usado na identificação
 * do usuário pelo WhatsApp (o número precisa bater com o que o provedor envia).
 *
 * Regra (padrão Brasil): remove tudo que não é dígito e garante o DDI 55.
 *  - "(31) 99999-0000"      -> "5531999990000"
 *  - "+55 31 99999-0000"    -> "5531999990000"
 *  - "5531999990000"        -> "5531999990000" (já com DDI)
 *  - "whatsapp:+5531999990000" -> "5531999990000"
 *
 * Observação: é uma normalização pragmática para o escopo do projeto
 * (números brasileiros), não uma validação E.164 completa.
 */
public final class Telefone {

    private static final String DDI_BRASIL = "55";

    private Telefone() {}

    /**
     * Devolve só os dígitos do telefone, com o DDI 55 na frente.
     * Retorna null se a entrada for nula/vazia ou não tiver dígitos.
     */
    public static String normalizar(String bruto) {
        if (bruto == null) return null;

        // Mantém apenas dígitos (descarta "(", ")", "-", espaços, "+", "whatsapp:" etc.).
        String digitos = bruto.replaceAll("\\D", "");
        if (digitos.isEmpty()) return null;

        // Se já começa com o DDI do Brasil e tem comprimento de número completo
        // (12 ou 13 dígitos: 55 + DDD + 8/9 dígitos), mantém como está.
        if (digitos.startsWith(DDI_BRASIL) && (digitos.length() == 12 || digitos.length() == 13)) {
            return digitos;
        }

        // Número local (DDD + 8/9 dígitos = 10 ou 11 dígitos): adiciona o DDI.
        if (digitos.length() == 10 || digitos.length() == 11) {
            return DDI_BRASIL + digitos;
        }

        // Outros formatos: devolve os dígitos como vieram (sem forçar DDI),
        // para não corromper números atípicos.
        return digitos;
    }

    /**
     * Formas equivalentes do mesmo celular brasileiro, com e sem o nono dígito,
     * para usar na BUSCA do usuário (não altera como o telefone é salvo).
     *
     * Motivo: o WhatsApp identifica números antigos sem o 9 após o DDD
     * (ex.: "553197186768"), enquanto o usuário costuma cadastrar com o 9
     * ("5531997186768"). Comparando as duas formas, ambos os lados batem.
     *  - "5531997186768" -> ["5531997186768", "553197186768"]
     *  - "553197186768"  -> ["553197186768", "5531997186768"]
     *  - "553133334444"  -> ["553133334444"] (fixo: começa com 2-5, não ganha 9)
     *
     * Retorna lista vazia se a entrada não tiver dígitos.
     */
    public static List<String> variantes(String bruto) {
        String n = normalizar(bruto);
        if (n == null) return List.of();

        Set<String> formas = new LinkedHashSet<>();
        formas.add(n);

        if (n.startsWith(DDI_BRASIL)) {
            String ddd = n.substring(2, 4);
            String assinante = n.substring(4);

            if (n.length() == 13 && assinante.charAt(0) == '9') {
                // Com o nono dígito -> versão sem ele.
                formas.add(DDI_BRASIL + ddd + assinante.substring(1));
            } else if (n.length() == 12 && "6789".indexOf(assinante.charAt(0)) >= 0) {
                // Celular antigo (8 dígitos começando em 6-9) -> versão com o 9.
                formas.add(DDI_BRASIL + ddd + "9" + assinante);
            }
        }
        return List.copyOf(formas);
    }
}
