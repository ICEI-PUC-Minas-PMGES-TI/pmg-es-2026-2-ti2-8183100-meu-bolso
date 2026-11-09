package Projeto.MeuBolso.whatsapp;

import java.time.Duration;
import java.util.Map;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

/**
 * Cliente HTTP do WAHA (WhatsApp HTTP API) rodando localmente.
 *
 * Usa o header X-Api-Key (variável WAHA_API_KEY, a mesma passada ao container).
 */
@Component
public class WahaClient {

    private static final Logger log = LoggerFactory.getLogger(WahaClient.class);

    private final RestClient http;
    private final String sessao;

    public WahaClient(@Value("${app.waha.api-url}") String apiUrl,
                      @Value("${app.waha.session}") String sessao,
                      @Value("${app.waha.api-key:}") String apiKey) {
        SimpleClientHttpRequestFactory fabrica = new SimpleClientHttpRequestFactory();
        fabrica.setConnectTimeout(Duration.ofSeconds(5));
        fabrica.setReadTimeout(Duration.ofSeconds(20));

        RestClient.Builder builder = RestClient.builder()
            .baseUrl(apiUrl)
            .requestFactory(fabrica);
        if (apiKey != null && !apiKey.isBlank()) {
            builder.defaultHeader("X-Api-Key", apiKey);
        }
        this.http = builder.build();
        this.sessao = sessao;
    }

    public String sessao() {
        return sessao;
    }

    /** Envia uma mensagem de texto. Falhas são registradas em log (não interrompem o webhook). */
    public void enviarTexto(String chatId, String texto) {
        try {
            http.post()
                .uri("/api/sendText")
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("session", sessao, "chatId", chatId, "text", texto))
                .retrieve()
                .toBodilessEntity();
        } catch (RestClientException e) {
            log.warn("Falha ao enviar mensagem pelo WAHA para {}: {}", chatId, e.getMessage());
        }
    }

    /**
     * Traduz um LID ("97199505543212@lid") no número de telefone, via
     * GET /api/{sessao}/lids/{lid} -> { "lid": "...", "pn": "553197186768@c.us" }.
     * Retorna só os dígitos do número, ou vazio se o WAHA não souber.
     */
    public Optional<String> telefoneDoLid(String lid) {
        try {
            // Variáveis de template são codificadas pelo RestClient ("@" é válido no path).
            Map<?, ?> resposta = http.get()
                .uri("/api/{sessao}/lids/{lid}", sessao, lid)
                .retrieve()
                .body(Map.class);
            Object pn = resposta == null ? null : resposta.get("pn");
            if (pn == null) return Optional.empty();
            String digitos = pn.toString().replaceAll("@.*$", "").replaceAll("\\D", "");
            return digitos.isEmpty() ? Optional.empty() : Optional.of(digitos);
        } catch (RestClientException e) {
            log.warn("Falha ao consultar o telefone do LID {} no WAHA: {}", lid, e.getMessage());
            return Optional.empty();
        }
    }
}
