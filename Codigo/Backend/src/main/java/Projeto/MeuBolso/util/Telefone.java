package Projeto.MeuBolso.util;

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
}
