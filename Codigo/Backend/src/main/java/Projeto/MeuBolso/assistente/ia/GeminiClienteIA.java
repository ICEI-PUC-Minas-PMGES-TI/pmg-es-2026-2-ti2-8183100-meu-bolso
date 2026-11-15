package Projeto.MeuBolso.assistente.ia;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

/**
 * Cliente da Gemini API (generateContent) com function calling.
 *
 * Mesma abordagem do {@code WahaClient}: um {@link RestClient} com timeouts e
 * a chave lida de propriedade. A chave vai no header x-goog-api-key.
 *
 * Nunca registramos em log a chave nem o texto das mensagens: só o status HTTP.
 */
@Component
public class GeminiClienteIA implements ClienteIA {

    private static final Logger log = LoggerFactory.getLogger(GeminiClienteIA.class);

    private static final String URL_BASE = "https://generativelanguage.googleapis.com/v1beta";

    private static final ObjectMapper JSON = new ObjectMapper();

    private final RestClient http;
    private final String apiKey;
    private final String modelo;

    public GeminiClienteIA(@Value("${app.ia.gemini.api-key:}") String apiKey,
                           @Value("${app.ia.gemini.modelo:gemini-3.5-flash-lite}") String modelo,
                           @Value("${app.ia.gemini.timeout-segundos:30}") int timeoutSegundos) {
        SimpleClientHttpRequestFactory fabrica = new SimpleClientHttpRequestFactory();
        fabrica.setConnectTimeout(Duration.ofSeconds(5));
        fabrica.setReadTimeout(Duration.ofSeconds(timeoutSegundos));

        this.http = RestClient.builder()
            .baseUrl(URL_BASE)
            .requestFactory(fabrica)
            .build();
        this.apiKey = apiKey;
        this.modelo = modelo;
    }

    @Override
    public ResultadoIA gerarComFerramentas(String instrucaoSistema,
                                           List<MensagemChat> historico,
                                           List<FerramentaIA> ferramentas) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new IaIndisponivelException("IA não configurada.");
        }

        // Nomes de função precisam casar com [A-Za-z0-9_]: sanitizamos no envio
        // e guardamos o mapa para traduzir de volta o que o modelo escolher.
        Map<String, String> sanitizadoParaOriginal = new HashMap<>();
        Map<String, Object> corpo = montarCorpo(instrucaoSistema, historico, ferramentas, sanitizadoParaOriginal);

        JsonNode resposta;
        try {
            String bruto = http.post()
                .uri("/models/{modelo}:generateContent", modelo)
                .header("x-goog-api-key", apiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .body(corpo)
                .retrieve()
                .body(String.class);
            resposta = JSON.readTree(bruto == null ? "" : bruto);
        } catch (RestClientResponseException e) {
            HttpStatusCode status = e.getStatusCode();
            log.warn("Gemini respondeu com erro HTTP {}", status.value());
            boolean limite = status.value() == 429;
            throw new IaIndisponivelException("Falha ao consultar a IA.", limite);
        } catch (RestClientException | com.fasterxml.jackson.core.JacksonException e) {
            // Timeout, falha de conexão ou corpo ilegível (mensagem não é logada).
            log.warn("Falha de comunicação com o Gemini.");
            throw new IaIndisponivelException("Falha ao consultar a IA.");
        }

        ResultadoIA resultado = interpretar(resposta);
        if (resultado == null) {
            log.warn("Gemini respondeu sem texto nem functionCall utilizável.");
            throw new IaIndisponivelException("Resposta da IA sem conteúdo.");
        }
        // Traduz o nome sanitizado de volta para o id original da pergunta.
        if (resultado.temFerramenta()) {
            String original = sanitizadoParaOriginal.getOrDefault(resultado.ferramenta(), resultado.ferramenta());
            return ResultadoIA.deFerramenta(original, resultado.argumentos());
        }
        return resultado;
    }

    /**
     * Monta o corpo { systemInstruction, contents, [tools, toolConfig] } esperado
     * pela API. Preenche {@code sanitizadoParaOriginal} com o mapa dos nomes de
     * função (sanitizado -> id original).
     */
    Map<String, Object> montarCorpo(String instrucaoSistema,
                                    List<MensagemChat> historico,
                                    List<FerramentaIA> ferramentas,
                                    Map<String, String> sanitizadoParaOriginal) {
        List<Map<String, Object>> contents = new ArrayList<>();
        for (MensagemChat m : historico) {
            // "assistant" vira "model"; "user" segue como "user".
            String role = "assistant".equals(m.papel()) ? "model" : "user";
            contents.add(Map.of(
                "role", role,
                "parts", List.of(Map.of("text", m.texto()))
            ));
        }

        Map<String, Object> corpo = new LinkedHashMap<>();
        corpo.put("systemInstruction", Map.of("parts", List.of(Map.of("text", instrucaoSistema))));
        corpo.put("contents", contents);

        if (ferramentas != null && !ferramentas.isEmpty()) {
            List<Map<String, Object>> declaracoes = new ArrayList<>();
            for (FerramentaIA f : ferramentas) {
                String nomeSanitizado = sanitizar(f.nome());
                sanitizadoParaOriginal.put(nomeSanitizado, f.nome());
                declaracoes.add(declararFuncao(nomeSanitizado, f));
            }
            corpo.put("tools", List.of(Map.of("functionDeclarations", declaracoes)));
            corpo.put("toolConfig", Map.of("functionCallingConfig", Map.of("mode", "AUTO")));
        }
        return corpo;
    }

    /** Monta uma functionDeclaration (name, description, parameters). */
    private Map<String, Object> declararFuncao(String nome, FerramentaIA f) {
        Map<String, Object> propriedades = new LinkedHashMap<>();
        if (f.parametros() != null) {
            for (ParametroFerramenta p : f.parametros()) {
                Map<String, Object> prop = new LinkedHashMap<>();
                prop.put("type", "STRING");
                prop.put("description", p.descricao());
                if (p.valoresPermitidos() != null && !p.valoresPermitidos().isEmpty()) {
                    prop.put("enum", p.valoresPermitidos());
                }
                propriedades.put(p.nome(), prop);
            }
        }
        Map<String, Object> declaracao = new LinkedHashMap<>();
        declaracao.put("name", nome);
        declaracao.put("description", f.descricao());
        declaracao.put("parameters", Map.of("type", "OBJECT", "properties", propriedades));
        return declaracao;
    }

    /**
     * Lê a primeira part de candidates[0].content: se houver functionCall
     * {name,args}, devolve um resultado de ferramenta (args convertidos para
     * String); senão devolve o texto. Retorna null se não houver conteúdo.
     */
    ResultadoIA interpretar(JsonNode resposta) {
        if (resposta == null) return null;
        JsonNode parte = resposta.path("candidates").path(0).path("content").path("parts").path(0);
        if (parte.isMissingNode()) return null;

        JsonNode functionCall = parte.get("functionCall");
        if (functionCall != null && functionCall.hasNonNull("name")) {
            String nome = functionCall.get("name").asText();
            Map<String, String> argumentos = new LinkedHashMap<>();
            JsonNode args = functionCall.get("args");
            if (args != null && args.isObject()) {
                args.fields().forEachRemaining(e ->
                    argumentos.put(e.getKey(), e.getValue().asText()));
            }
            return ResultadoIA.deFerramenta(nome, argumentos);
        }

        JsonNode texto = parte.get("text");
        if (texto != null && !texto.asText().isBlank()) {
            return ResultadoIA.deTexto(texto.asText());
        }
        return null;
    }

    /** Troca por "_" tudo que não casar com [A-Za-z0-9_]. */
    private String sanitizar(String nome) {
        return nome == null ? "" : nome.replaceAll("[^A-Za-z0-9_]", "_");
    }
}
