package Projeto.MeuBolso.assistente.ia;

import java.util.Map;

/**
 * Resultado de uma chamada ao modelo: ou texto livre, ou a escolha de uma
 * ferramenta com seus argumentos (exatamente um dos dois é preenchido).
 *
 * @param texto      resposta em texto (nulo quando o modelo chamou uma ferramenta).
 * @param ferramenta nome da ferramenta escolhida (nulo quando respondeu em texto).
 * @param argumentos argumentos da ferramenta (vazio quando respondeu em texto).
 */
public record ResultadoIA(String texto, String ferramenta, Map<String, String> argumentos) {

    /** Resultado em texto livre. */
    public static ResultadoIA deTexto(String texto) {
        return new ResultadoIA(texto, null, Map.of());
    }

    /** Resultado que escolhe uma ferramenta. */
    public static ResultadoIA deFerramenta(String ferramenta, Map<String, String> argumentos) {
        return new ResultadoIA(null, ferramenta, argumentos == null ? Map.of() : argumentos);
    }

    /** true quando o modelo escolheu chamar uma ferramenta. */
    public boolean temFerramenta() {
        return ferramenta != null && !ferramenta.isBlank();
    }
}
