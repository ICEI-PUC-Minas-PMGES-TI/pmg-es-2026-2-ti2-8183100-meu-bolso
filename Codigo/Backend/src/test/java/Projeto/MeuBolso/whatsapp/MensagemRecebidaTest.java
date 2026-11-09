package Projeto.MeuBolso.whatsapp;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.Map;
import org.junit.jupiter.api.Test;

class MensagemRecebidaTest {

    private static final String SESSAO = "default";

    @Test
    void extraiMensagemDeTextoDeUmContato() {
        assertThat(MensagemRecebida.doEvento(evento("97199505543212@lid", false, "oi", false, "chat"), SESSAO))
            .contains(new MensagemRecebida("msg-1", "97199505543212@lid", "oi"));
    }

    @Test
    void aceitaRemetenteComNumero() {
        assertThat(MensagemRecebida.doEvento(evento("553197186768@c.us", false, "  1 ", false, "chat"), SESSAO))
            .hasValueSatisfying(m -> assertThat(m.texto()).isEqualTo("1"));
    }

    @Test
    void ignoraStatusGruposEOProprioNumero() {
        assertThat(MensagemRecebida.doEvento(evento("status@broadcast", false, "story", false, "chat"), SESSAO)).isEmpty();
        assertThat(MensagemRecebida.doEvento(evento("1203630@g.us", false, "grupo", false, "chat"), SESSAO)).isEmpty();
        assertThat(MensagemRecebida.doEvento(evento("123@newsletter", false, "canal", false, "chat"), SESSAO)).isEmpty();
        assertThat(MensagemRecebida.doEvento(evento("97199505543212@lid", true, "eco", false, "chat"), SESSAO)).isEmpty();
    }

    @Test
    void ignoraMidiaETextoVazio() {
        assertThat(MensagemRecebida.doEvento(evento("97199505543212@lid", false, "", true, "image"), SESSAO)).isEmpty();
        assertThat(MensagemRecebida.doEvento(evento("97199505543212@lid", false, "legenda", false, "sticker"), SESSAO)).isEmpty();
        assertThat(MensagemRecebida.doEvento(evento("97199505543212@lid", false, "   ", false, "chat"), SESSAO)).isEmpty();
    }

    @Test
    void ignoraOutrosEventosEOutrasSessoes() {
        Map<String, Object> ack = evento("97199505543212@lid", false, "oi", false, "chat");
        ack.put("event", "message.ack");
        assertThat(MensagemRecebida.doEvento(ack, SESSAO)).isEmpty();

        assertThat(MensagemRecebida.doEvento(evento("97199505543212@lid", false, "oi", false, "chat"), "outra")).isEmpty();
        assertThat(MensagemRecebida.doEvento(null, SESSAO)).isEmpty();
        assertThat(MensagemRecebida.doEvento(Map.of("event", "message"), SESSAO)).isEmpty();
    }

    private static Map<String, Object> evento(String from, boolean fromMe, String body, boolean hasMedia, String tipo) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("id", "msg-1");
        payload.put("from", from);
        payload.put("fromMe", fromMe);
        payload.put("body", body);
        payload.put("hasMedia", hasMedia);
        payload.put("_data", Map.of("type", tipo));

        Map<String, Object> evento = new HashMap<>();
        evento.put("event", "message");
        evento.put("session", SESSAO);
        evento.put("payload", payload);
        return evento;
    }
}
