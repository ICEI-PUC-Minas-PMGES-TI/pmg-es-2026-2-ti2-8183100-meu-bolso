package Projeto.MeuBolso.assistente;

import java.util.Map;

/** Resposta crua de uma {@link PerguntaPronta}: texto humano e dados estruturados. */
public record RespostaPronta(String texto, Map<String, Object> dados) {}
