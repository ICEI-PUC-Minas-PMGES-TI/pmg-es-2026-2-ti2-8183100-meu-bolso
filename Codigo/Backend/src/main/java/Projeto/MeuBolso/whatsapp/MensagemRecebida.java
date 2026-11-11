package Projeto.MeuBolso.whatsapp;

import java.util.Map;
import java.util.Optional;

/**
 * Mensagem de texto recebida de um usuário, extraída do evento do WAHA.
 *
 * Formato do evento (observado nos testes com o WAHA, engine WEBJS):
 * <pre>
 * { "event": "message", "session": "default",
 *   "payload": { "id": "...", "from": "97199505543212@lid", "fromMe": false,
 *                "body": "texto", "hasMedia": false, "_data": { "type": "chat" } } }
 * </pre>
 *
 * @param id     id da mensagem (usado para ignorar reenvios do mesmo evento)
 * @param chatId remetente; também é o destino da resposta ("...@lid" ou "...@c.us")
 * @param texto  conteúdo da mensagem
 */
public record MensagemRecebida(String id, String chatId, String texto) {

    /**
     * Converte o evento em mensagem, ou vazio se ele deve ser ignorado:
     * outro tipo de evento, outra sessão, status (stories), grupos, canais,
     * mensagens enviadas pelo próprio número, mídia ou texto vazio.
     */
    @SuppressWarnings("unchecked")
    public static Optional<MensagemRecebida> doEvento(Map<String, Object> evento, String sessaoEsperada) {
        if (evento == null || !"message".equals(evento.get("event"))) return Optional.empty();
        if (sessaoEsperada != null && !sessaoEsperada.equals(evento.get("session"))) return Optional.empty();
        if (!(evento.get("payload") instanceof Map<?, ?> p)) return Optional.empty();
        Map<String, Object> payload = (Map<String, Object>) p;

        String from = texto(payload.get("from"));
        if (from.isEmpty()) return Optional.empty();
        // Só conversas individuais: ignora status, grupos (@g.us) e canais (@newsletter).
        if (!(from.endsWith("@c.us") || from.endsWith("@lid") || from.endsWith("@s.whatsapp.net"))) {
            return Optional.empty();
        }
        if (Boolean.TRUE.equals(payload.get("fromMe"))) return Optional.empty();
        if (Boolean.TRUE.equals(payload.get("hasMedia"))) return Optional.empty();

        if (payload.get("_data") instanceof Map<?, ?> dados) {
            Object tipo = dados.get("type");
            if (tipo != null && !"chat".equals(tipo)) return Optional.empty();
        }

        String corpo = texto(payload.get("body")).trim();
        if (corpo.isEmpty()) return Optional.empty();

        return Optional.of(new MensagemRecebida(texto(payload.get("id")), from, corpo));
    }

    private static String texto(Object o) {
        return o == null ? "" : o.toString();
    }
}
