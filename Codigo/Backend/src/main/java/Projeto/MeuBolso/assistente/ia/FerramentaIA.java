package Projeto.MeuBolso.assistente.ia;

import java.util.List;

/**
 * Uma "ferramenta" (function declaration) oferecida ao modelo: ele pode
 * escolher chamá-la em vez de responder em texto.
 *
 * @param nome       identificador da função (casa com [A-Za-z0-9_]).
 * @param descricao  o que a função faz (ajuda o modelo a escolher).
 * @param parametros argumentos que a função aceita.
 */
public record FerramentaIA(String nome, String descricao, List<ParametroFerramenta> parametros) {}
