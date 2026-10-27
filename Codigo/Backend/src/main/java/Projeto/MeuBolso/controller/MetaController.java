package Projeto.MeuBolso.controller;

import Projeto.MeuBolso.model.Meta;
import Projeto.MeuBolso.model.MetaDtos.MetaRequest;
import Projeto.MeuBolso.model.MetaDtos.MetaResponse;
import Projeto.MeuBolso.model.Usuario;
import Projeto.MeuBolso.repository.MetaRepository;
import Projeto.MeuBolso.repository.UsuarioRepository;

import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/metas")
public class MetaController {

    private final MetaRepository metaRepository;
    private final UsuarioRepository usuarioRepository;

    public MetaController(MetaRepository metaRepository, UsuarioRepository usuarioRepository) {
        this.metaRepository = metaRepository;
        this.usuarioRepository = usuarioRepository;
    }

    // Lista todas as metas do usuário autenticado.
    @GetMapping
    public List<MetaResponse> listar(Authentication authentication) {
        String usuarioId = usuarioAutenticado(authentication).getId();
        return metaRepository.findByUsuarioId(usuarioId).stream()
            .map(MetaController::paraResponse)
            .toList();
    }

    // Cria uma meta nova para o usuário autenticado (valorAtual nasce em zero).
    @PostMapping
    public ResponseEntity<MetaResponse> criar(@Valid @RequestBody MetaRequest request,
                                              Authentication authentication) {
        String usuarioId = usuarioAutenticado(authentication).getId();

        Meta meta = new Meta(
            usuarioId,
            request.nome().trim(),
            request.valorAlvo(),
            request.prazo(),
            request.prioridade()
        );

        Meta salva = metaRepository.save(meta);
        return ResponseEntity.status(HttpStatus.CREATED).body(paraResponse(salva));
    }

    // Edita os dados básicos de uma meta do usuário (não altera o valorAtual).
    @PutMapping("/{id}")
    public MetaResponse atualizar(@PathVariable String id,
                                  @Valid @RequestBody MetaRequest request,
                                  Authentication authentication) {
        String usuarioId = usuarioAutenticado(authentication).getId();

        Meta meta = metaRepository.findByIdAndUsuarioId(id, usuarioId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Meta não encontrada."));

        meta.setNome(request.nome().trim());
        meta.setValorAlvo(request.valorAlvo());
        meta.setPrazo(request.prazo());
        meta.setPrioridade(request.prioridade());

        return paraResponse(metaRepository.save(meta));
    }

    // Exclui uma meta do usuário.
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable String id, Authentication authentication) {
        String usuarioId = usuarioAutenticado(authentication).getId();

        Meta meta = metaRepository.findByIdAndUsuarioId(id, usuarioId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Meta não encontrada."));

        metaRepository.delete(meta);
        return ResponseEntity.noContent().build();
    }

    // Resolve o usuário logado a partir do token (Authentication.getName() = e-mail).
    private Usuario usuarioAutenticado(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuário não autenticado.");
        }
        return usuarioRepository.findByEmail(authentication.getName())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuário não encontrado."));
    }

    private static MetaResponse paraResponse(Meta m) {
        return new MetaResponse(
            m.getId(),
            m.getNome(),
            m.getValorAlvo(),
            m.getValorAtual(),
            m.getPrazo(),
            m.getPrioridade()
        );
    }
}
