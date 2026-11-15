package Projeto.MeuBolso.assistente.ia;

import java.util.List;

/**
 * Um parâmetro de uma {@link FerramentaIA} declarada ao modelo.
 *
 * @param nome              nome do argumento.
 * @param descricao         o que ele representa (vai para o modelo).
 * @param valoresPermitidos valores aceitos (vira "enum"); vazio = texto livre.
 */
public record ParametroFerramenta(String nome, String descricao, List<String> valoresPermitidos) {}
