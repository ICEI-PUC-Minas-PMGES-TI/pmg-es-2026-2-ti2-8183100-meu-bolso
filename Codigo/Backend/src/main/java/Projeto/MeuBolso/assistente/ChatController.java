package Projeto.MeuBolso.assistente;

import Projeto.MeuBolso.assistente.ChatService.ChatResponse;
import Projeto.MeuBolso.assistente.ia.IaIndisponivelException;
import Projeto.MeuBolso.assistente.ia.LimiteUsoException;
import Projeto.MeuBolso.assistente.ia.MensagemChat;
import Projeto.MeuBolso.model.Usuario;
import Projeto.MeuBolso.repository.UsuarioRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/**
 * Chat livre com o Jarvis do usuário autenticado.
 *
 *   POST /api/assistente/chat   -> { "resposta": "...", "ferramenta": "..."|null }
 *
 * Autenticação igual ao {@link AssistenteController}: o token traz o e-mail,
 * que resolvemos no usuário.
 */
@RestController
@RequestMapping("/api/assistente")
public class ChatController {

    private final ChatService chatService;
    private final UsuarioRepository usuarioRepository;

    public ChatController(ChatService chatService,
                          UsuarioRepository usuarioRepository) {
        this.chatService = chatService;
        this.usuarioRepository = usuarioRepository;
    }

    /** Body do POST: { "mensagens": [ { "papel": "user", "texto": "..." } ] }. */
    public record ChatRequest(List<MensagemChat> mensagens) {}

    @PostMapping("/chat")
    public ChatResponse chat(@RequestBody ChatRequest request,
                             Authentication authentication) {
        Usuario usuario = usuarioAutenticado(authentication);

        List<MensagemChat> mensagens = request == null ? null : request.mensagens();
        try {
            return chatService.responder(usuario.getId(), mensagens);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (LimiteUsoException e) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, e.getMessage());
        } catch (IaIndisponivelException e) {
            if (e.isLimiteAtingido()) {
                throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                    "Limite de uso do Jarvis atingido. Tente mais tarde ou use as perguntas rápidas.");
            }
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                "O Jarvis está indisponível no momento. Tente as perguntas rápidas.");
        }
    }

    private Usuario usuarioAutenticado(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuário não autenticado.");
        }
        return usuarioRepository.findByEmail(authentication.getName())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuário não encontrado."));
    }
}
