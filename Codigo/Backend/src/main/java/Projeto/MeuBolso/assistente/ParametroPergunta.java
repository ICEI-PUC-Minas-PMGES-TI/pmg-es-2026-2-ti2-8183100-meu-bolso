package Projeto.MeuBolso.assistente;

import java.util.List;

/**
 * Descreve um parâmetro que uma pergunta precisa para ser respondida.
 *
 * tipo: "opcao" (escolha entre {@link #opcoes}) ou "valor" (texto livre).
 * Para "valor", {@code opcoes} vem vazio.
 */
public record ParametroPergunta(String nome, String rotulo, String tipo, List<OpcaoParametro> opcoes) {}
