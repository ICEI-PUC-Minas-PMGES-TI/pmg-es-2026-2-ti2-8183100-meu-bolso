package Projeto.MeuBolso.assistente;

import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

/**
 * Orquestra as perguntas prontas do assistente. Recebe todas as
 * {@link PerguntaPronta} do contexto e, dado um usuário, sabe listar as
 * disponíveis e responder uma delas.
 */
@Service
public class AssistenteService {

    private static final String AVISO =
        "Orientação educativa; não substitui um profissional.";

    private final List<PerguntaPronta> perguntas;

    public AssistenteService(List<PerguntaPronta> perguntas) {
        this.perguntas = perguntas;
    }

    /** Item exibido na lista de perguntas: id, texto e os parâmetros exigidos. */
    public record PerguntaResumo(String id, String texto, List<ParametroPergunta> parametros) {}

    /** Resposta entregue ao usuário: texto, dados e o aviso educativo fixo. */
    public record RespostaAssistente(String texto, Map<String, Object> dados, String aviso) {}

    /** Perguntas disponíveis para o usuário (apenas id e texto). */
    public List<PerguntaResumo> listar(String usuarioId) {
        return perguntas.stream()
            .filter(p -> p.disponivel(usuarioId))
            .map(p -> new PerguntaResumo(p.id(), p.texto(), p.parametros(usuarioId)))
            .toList();
    }

    /**
     * Responde a pergunta de id informado para o usuário. Valida, nesta ordem:
     *  - 404 se o id não existe;
     *  - 400 se a pergunta está indisponível para este usuário;
     *  - 400 se faltar um parâmetro obrigatório ou se um valor de opção for inválido.
     */
    public RespostaAssistente responder(String usuarioId, String id, Map<String, String> params) {
        PerguntaPronta pergunta = perguntas.stream()
            .filter(p -> p.id().equals(id))
            .findFirst()
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pergunta não encontrada."));

        if (!pergunta.disponivel(usuarioId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Pergunta indisponível no momento.");
        }

        Map<String, String> p = params == null ? Map.of() : params;
        validarParametros(pergunta, usuarioId, p);

        RespostaPronta resposta = pergunta.responder(usuarioId, p);
        return new RespostaAssistente(resposta.texto(), resposta.dados(), AVISO);
    }

    private static void validarParametros(PerguntaPronta pergunta, String usuarioId, Map<String, String> params) {
        for (ParametroPergunta parametro : pergunta.parametros(usuarioId)) {
            String valor = params.get(parametro.nome());
            if (valor == null || valor.isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Parâmetro obrigatório: " + parametro.nome());
            }
            if ("opcao".equals(parametro.tipo())) {
                boolean valida = parametro.opcoes().stream()
                    .anyMatch(o -> o.valor().equals(valor));
                if (!valida) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Parâmetro inválido: " + parametro.nome());
                }
            }
        }
    }
}
