package Projeto.MeuBolso.whatsapp;

import java.math.BigDecimal;

/**
 * Item de uma lista numerada mostrada ao usuário no WhatsApp (meta, conta,
 * cartão, dinheiro). Fica salvo na conversa para que a resposta "2" seja
 * traduzida no id certo, mesmo que a lista mude depois.
 *
 * @param id      id da meta/carteira no sistema
 * @param nome    nome exibido e gravado no lançamento (ex.: "Nubank (Crédito)")
 * @param detalhe texto complementar da lista (ex.: "saldo R$ 120,00"); pode ser vazio
 * @param valor   saldo da conta ou valor guardado na meta; null quando não se aplica
 */
public record Opcao(String id, String nome, String detalhe, BigDecimal valor) {}
