package Projeto.MeuBolso.email;

import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

/**
 * Transporte via API HTTP da Brevo (endpoint transacional
 * {@code POST https://api.brevo.com/v3/smtp/email}, porta 443).
 *
 * Ativo quando {@code app.mail.provider=brevo}. Necessário no Render Free, que
 * bloqueia as portas de SMTP; a API HTTP passa normalmente.
 *
 * Requer:
 *  - {@code app.mail.brevo.api-key} (BREVO_API_KEY): a chave da Brevo.
 *  - {@code app.mail.from} (MAIL_FROM): um remetente VERIFICADO na Brevo.
 *    E-mail não verificado faz a API recusar o envio.
 */
@Component
@ConditionalOnProperty(name = "app.mail.provider", havingValue = "brevo")
public class BrevoEnviadorEmail implements EnviadorEmail {

    private static final String URL_BREVO = "https://api.brevo.com/v3/smtp/email";

    private final RestClient rest;
    private final String remetente;

    public BrevoEnviadorEmail(
            @Value("${app.mail.brevo.api-key}") String apiKey,
            @Value("${app.mail.from}") String remetente) {
        this.remetente = remetente;
        this.rest = RestClient.builder()
                .baseUrl(URL_BREVO)
                .defaultHeader("api-key", apiKey)
                .defaultHeader("accept", MediaType.APPLICATION_JSON_VALUE)
                .defaultHeader("content-type", MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    @Override
    public void enviarTexto(String para, String assunto, String texto) {
        enviar(para, assunto, texto, null);
    }

    @Override
    public void enviarHtml(String para, String assunto, String texto, String html) {
        enviar(para, assunto, texto, html);
    }

    /**
     * Monta o corpo JSON da Brevo e dispara a chamada. A Brevo exige um
     * htmlContent; quando só há texto, enviamos o próprio texto como
     * textContent e também como htmlContent mínimo (em &lt;pre&gt;), para não
     * perder quebras de linha.
     */
    private void enviar(String para, String assunto, String texto, String html) {
        String nomeRemetente = "Meu Bolso";

        Map<String, Object> corpo = Map.of(
                "sender", Map.of("name", nomeRemetente, "email", remetente),
                "to", List.of(Map.of("email", para)),
                "subject", assunto,
                "htmlContent", html != null ? html : ("<pre>" + escaparHtml(texto) + "</pre>"),
                "textContent", texto != null ? texto : ""
        );

        // Lança em erro HTTP (4xx/5xx): quem chama (@Async) captura e loga.
        rest.post().body(corpo).retrieve().toBodilessEntity();
    }

    /** Escape mínimo para o fallback em &lt;pre&gt; (evita HTML inesperado). */
    private static String escaparHtml(String texto) {
        if (texto == null) return "";
        return texto
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;");
    }
}
