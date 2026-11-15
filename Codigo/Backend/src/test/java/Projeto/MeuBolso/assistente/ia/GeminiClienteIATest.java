package Projeto.MeuBolso.assistente.ia;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

class GeminiClienteIATest {

    private static final ObjectMapper JSON = new ObjectMapper();

    private GeminiClienteIA cliente() {
        return new GeminiClienteIA("chave-qualquer", "gemini-3.5-flash-lite", 30);
    }

    @Test
    void chaveEmBrancoLancaIaIndisponivel() {
        GeminiClienteIA semChave = new GeminiClienteIA("", "gemini-3.5-flash-lite", 30);

        IaIndisponivelException ex = assertThrows(IaIndisponivelException.class,
            () -> semChave.gerarComFerramentas("instrução",
                List.of(new MensagemChat("user", "Oi")), List.of()));

        assertThat(ex.isLimiteAtingido()).isFalse();
        assertThat(ex.getMessage()).isEqualTo("IA não configurada.");
    }

    @Test
    @SuppressWarnings("unchecked")
    void montarCorpoIncluiFunctionDeclarationsEEnumQuandoHaValores() {
        FerramentaIA f = new FerramentaIA("meta_faltante", "Quanto falta para minha meta?",
            List.of(new ParametroFerramenta("metaId", "Qual meta?", List.of("m1", "m2"))));

        Map<String, Object> corpo = cliente().montarCorpo(
            "instr", List.of(new MensagemChat("user", "oi")), List.of(f), new HashMap<>());

        assertThat(corpo).containsKey("tools");
        assertThat(corpo).containsKey("toolConfig");

        List<Map<String, Object>> tools = (List<Map<String, Object>>) corpo.get("tools");
        List<Map<String, Object>> decls = (List<Map<String, Object>>) tools.get(0).get("functionDeclarations");
        Map<String, Object> decl = decls.get(0);
        assertThat(decl.get("name")).isEqualTo("meta_faltante");

        Map<String, Object> parameters = (Map<String, Object>) decl.get("parameters");
        Map<String, Object> props = (Map<String, Object>) parameters.get("properties");
        Map<String, Object> metaId = (Map<String, Object>) props.get("metaId");
        assertThat(metaId.get("enum")).isEqualTo(List.of("m1", "m2"));
    }

    @Test
    void montarCorpoOmiteToolsQuandoListaVazia() {
        Map<String, Object> corpo = cliente().montarCorpo(
            "instr", List.of(new MensagemChat("user", "oi")), List.of(), new HashMap<>());

        assertThat(corpo).doesNotContainKey("tools");
        assertThat(corpo).doesNotContainKey("toolConfig");
    }

    @Test
    void interpretarReconheceFunctionCall() throws Exception {
        JsonNode resposta = JSON.readTree("""
            {"candidates":[{"content":{"parts":[
              {"functionCall":{"name":"saldo_mes","args":{"metaId":"m1"}}}
            ]}}]}
            """);

        ResultadoIA r = cliente().interpretar(resposta);

        assertThat(r.temFerramenta()).isTrue();
        assertThat(r.ferramenta()).isEqualTo("saldo_mes");
        assertThat(r.argumentos()).containsEntry("metaId", "m1");
    }

    @Test
    void interpretarReconheceTextoSimples() throws Exception {
        JsonNode resposta = JSON.readTree("""
            {"candidates":[{"content":{"parts":[{"text":"Olá, sou o Jarvis."}]}}]}
            """);

        ResultadoIA r = cliente().interpretar(resposta);

        assertThat(r.temFerramenta()).isFalse();
        assertThat(r.texto()).isEqualTo("Olá, sou o Jarvis.");
    }
}
