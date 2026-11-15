package Projeto.MeuBolso.assistente.ia;

/**
 * Uma mensagem do histórico de conversa enviado à IA.
 *
 * @param papel "user" (usuário) ou "assistant" (Jarvis).
 * @param texto conteúdo da mensagem.
 */
public record MensagemChat(String papel, String texto) {}
