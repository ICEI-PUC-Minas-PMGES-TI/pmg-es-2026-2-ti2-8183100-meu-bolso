package Projeto.MeuBolso.assistente;

import Projeto.MeuBolso.assistente.AssistenteService.PerguntaResumo;
import Projeto.MeuBolso.assistente.AssistenteService.RespostaAssistente;
import Projeto.MeuBolso.model.Usuario;
import Projeto.MeuBolso.repository.UsuarioRepository;

import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/**
 * Assistente de perguntas prontas do usuário autenticado.
 *
 *   GET  /api/assistente/perguntas        -> perguntas disponíveis (id + texto)
 *   POST /api/assistente/perguntas/{id}   -> responde a pergunta (body opcional)
 *
 * Autenticação igual aos demais controllers: o token traz o e-mail, que
 * resolvemos no usuário.
 */
@RestController
@RequestMapping("/api/assistente")
public class AssistenteController {

    private final AssistenteService assistenteService;
    private final UsuarioRepository usuarioRepository;

    public AssistenteController(AssistenteService assistenteService,
                                UsuarioRepository usuarioRepository) {
        this.assistenteService = assistenteService;
        this.usuarioRepository = usuarioRepository;
    }

    /** Body opcional do POST: { "params": { ... } }. */
    public record ResponderRequest(Map<String, String> params) {}

    @GetMapping("/perguntas")
    public List<PerguntaResumo> perguntas(Authentication authentication) {
        String usuarioId = usuarioAutenticado(authentication).getId();
        return assistenteService.listar(usuarioId);
    }

    @PostMapping("/perguntas/{id}")
    public RespostaAssistente responder(@PathVariable String id,
                                        @RequestBody(required = false) ResponderRequest request,
                                        Authentication authentication) {
        String usuarioId = usuarioAutenticado(authentication).getId();
        Map<String, String> params = request == null ? null : request.params();
        return assistenteService.responder(usuarioId, id, params);
    }

    private Usuario usuarioAutenticado(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuário não autenticado.");
        }
        return usuarioRepository.findByEmail(authentication.getName())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuário não encontrado."));
    }
}
