package Projeto.MeuBolso.controller;

import Projeto.MeuBolso.model.AuthDtos.MensagemResponse;
import Projeto.MeuBolso.model.ResumoSemanalDtos.CancelamentoRequest;
import Projeto.MeuBolso.model.ResumoSemanalDtos.PreferenciaRequest;
import Projeto.MeuBolso.model.ResumoSemanalDtos.PreferenciaResponse;
import Projeto.MeuBolso.model.ResumoSemanalDtos.Resumo;
import Projeto.MeuBolso.model.Usuario;
import Projeto.MeuBolso.repository.UsuarioRepository;
import Projeto.MeuBolso.service.ResumoSemanalService;

import jakarta.validation.Valid;
import java.time.LocalDate;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/**
 * API do resumo semanal por e-mail.
 *
 *   GET  /api/resumo-semanal/preferencia   -> estado atual (ativo, e-mail, último envio)
 *   PUT  /api/resumo-semanal/preferencia   <- { ativo }
 *   GET  /api/resumo-semanal/previa        -> resumo dos últimos 7 dias
 *   POST /api/resumo-semanal/enviar-agora  -> envia o resumo agora
 *   POST /api/resumo-semanal/cancelar      <- { token } (pública: o link do e-mail não tem login)
 */
@RestController
@RequestMapping("/api/resumo-semanal")
public class ResumoSemanalController {

    private final ResumoSemanalService service;
    private final UsuarioRepository usuarioRepository;

    public ResumoSemanalController(ResumoSemanalService service, UsuarioRepository usuarioRepository) {
        this.service = service;
        this.usuarioRepository = usuarioRepository;
    }

    @GetMapping("/preferencia")
    public PreferenciaResponse obterPreferencia(Authentication authentication) {
        return service.obterPreferencia(usuarioAutenticado(authentication));
    }

    @PutMapping("/preferencia")
    public PreferenciaResponse definirPreferencia(@Valid @RequestBody PreferenciaRequest request,
                                                  Authentication authentication) {
        return service.definirAtivo(usuarioAutenticado(authentication), request.ativo());
    }

    @GetMapping("/previa")
    public Resumo previa(Authentication authentication) {
        String usuarioId = usuarioAutenticado(authentication).getId();
        return service.montar(usuarioId, LocalDate.now(ResumoSemanalService.ZONA));
    }

    // O envio sai em segundo plano: a resposta só confirma que foi agendado.
    @PostMapping("/enviar-agora")
    public MensagemResponse enviarAgora(Authentication authentication) {
        Usuario usuario = usuarioAutenticado(authentication);
        service.enviarResumo(usuario, LocalDate.now(ResumoSemanalService.ZONA));
        return new MensagemResponse("Estamos enviando o resumo para o seu e-mail.");
    }

    @PostMapping("/cancelar")
    public MensagemResponse cancelar(@Valid @RequestBody CancelamentoRequest request) {
        if (!service.cancelar(request.token())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Link inválido ou expirado.");
        }
        return new MensagemResponse("Resumo semanal cancelado. Você não receberá mais esses e-mails.");
    }

    private Usuario usuarioAutenticado(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuário não autenticado.");
        }
        return usuarioRepository.findByEmail(authentication.getName())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuário não encontrado."));
    }
}
