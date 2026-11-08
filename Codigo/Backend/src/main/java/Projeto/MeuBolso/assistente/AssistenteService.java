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

    /** Item exibido na lista de perguntas: só id e texto. */
    public record PerguntaResumo(String id, String texto) {}

    /** Resposta entregue ao usuário: texto, dados e o aviso educativo fixo. */
    public record RespostaAssistente(String texto, Map<String, Object> dados, String aviso) {}

    /** Perguntas disponíveis para o usuário (apenas id e texto). */
    public List<PerguntaResumo> listar(String usuarioId) {
        return perguntas.stream()
            .filter(p -> p.disponivel(usuarioId))
            .map(p -> new PerguntaResumo(p.id(), p.texto()))
            .toList();
    }

    /**
     * Responde a pergunta de id informado para o usuário.
     *  - 404 se o id não existe.
     *  - 400 se a pergunta existe mas está indisponível para este usuário.
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
        RespostaPronta resposta = pergunta.responder(usuarioId, p);
        return new RespostaAssistente(resposta.texto(), resposta.dados(), AVISO);
    }
}
