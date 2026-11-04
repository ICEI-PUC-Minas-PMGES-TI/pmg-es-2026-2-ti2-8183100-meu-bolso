package Projeto.MeuBolso.controller;

import Projeto.MeuBolso.model.Meta;
import Projeto.MeuBolso.model.MetaDtos.MetaRequest;
import Projeto.MeuBolso.model.MetaDtos.MetaResponse;
import Projeto.MeuBolso.model.MetaDtos.MovimentacaoAplicadaResponse;
import Projeto.MeuBolso.model.MetaDtos.MovimentacaoRequest;
import Projeto.MeuBolso.model.MetaDtos.MovimentacaoResponse;
import Projeto.MeuBolso.model.MovimentacaoMeta;
import Projeto.MeuBolso.model.Usuario;
import Projeto.MeuBolso.repository.MetaRepository;
import Projeto.MeuBolso.repository.MovimentacaoMetaRepository;
import Projeto.MeuBolso.repository.UsuarioRepository;
import Projeto.MeuBolso.service.MetaService;

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
    private final MovimentacaoMetaRepository movimentacaoRepository;
    private final MetaService metaService;

    public MetaController(MetaRepository metaRepository,
                          UsuarioRepository usuarioRepository,
                          MovimentacaoMetaRepository movimentacaoRepository,
                          MetaService metaService) {
        this.metaRepository = metaRepository;
        this.usuarioRepository = usuarioRepository;
        this.movimentacaoRepository = movimentacaoRepository;
        this.metaService = metaService;
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

    // Exclui uma meta do usuário (e o histórico de movimentações dela).
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable String id, Authentication authentication) {
        String usuarioId = usuarioAutenticado(authentication).getId();

        Meta meta = metaRepository.findByIdAndUsuarioId(id, usuarioId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Meta não encontrada."));

        metaRepository.delete(meta);
        movimentacaoRepository.deleteByMetaIdAndUsuarioId(id, usuarioId);
        return ResponseEntity.noContent().build();
    }

    // Lista o histórico de movimentações de uma meta (mais recente primeiro).
    @GetMapping("/{id}/movimentacoes")
    public List<MovimentacaoResponse> listarMovimentacoes(@PathVariable String id,
                                                          Authentication authentication) {
        String usuarioId = usuarioAutenticado(authentication).getId();

        // Garante que a meta pertence ao usuário antes de devolver o histórico.
        metaRepository.findByIdAndUsuarioId(id, usuarioId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Meta não encontrada."));

        return movimentacaoRepository.findByMetaIdAndUsuarioIdOrderByDataDesc(id, usuarioId).stream()
            .map(MetaController::paraResponse)
            .toList();
    }

    /**
     * Registra uma movimentação (aporte/retirada) numa meta, numa única
     * operação: valida, ajusta o saldo da carteira, atualiza o valorAtual da
     * meta e grava o registro do histórico. Tudo vinculado ao usuário.
     *
     *  - deposito: sai da carteira (delta negativo) e entra na meta.
     *  - retirada: entra na carteira (delta positivo) e sai da meta.
     */
    @PostMapping("/{id}/movimentacoes")
    public ResponseEntity<MovimentacaoAplicadaResponse> movimentar(@PathVariable String id,
                                                                   @Valid @RequestBody MovimentacaoRequest request,
                                                                   Authentication authentication) {
        String usuarioId = usuarioAutenticado(authentication).getId();

        MetaService.MovimentacaoAplicada aplicada = metaService.movimentar(
            usuarioId, id, request.tipo(), request.valor(), request.carteiraId(), request.titulo());

        return ResponseEntity.status(HttpStatus.CREATED).body(
            new MovimentacaoAplicadaResponse(
                paraResponse(aplicada.meta()),
                paraResponse(aplicada.movimentacao())));
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

    private static MovimentacaoResponse paraResponse(MovimentacaoMeta m) {
        return new MovimentacaoResponse(
            m.getId(),
            m.getTipo(),
            m.getValor(),
            m.getTitulo(),
            m.getCarteiraId(),
            m.getData()
        );
    }
}
