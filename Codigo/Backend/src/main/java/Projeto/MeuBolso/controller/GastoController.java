package Projeto.MeuBolso.controller;

import Projeto.MeuBolso.model.GastoDtos.ComentarioRequest;
import Projeto.MeuBolso.model.GastoDtos.GastoRequest;
import Projeto.MeuBolso.model.GastoDtos.GastoResponse;
import Projeto.MeuBolso.model.GastoDtos.OrcamentoRequest;
import Projeto.MeuBolso.model.GastoDtos.OrcamentoResponse;
import Projeto.MeuBolso.model.GastoDtos.RecorrenteRequest;
import Projeto.MeuBolso.model.GastoDtos.RecorrenteResponse;
import Projeto.MeuBolso.model.Usuario;
import Projeto.MeuBolso.repository.UsuarioRepository;
import Projeto.MeuBolso.service.GastoService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/**
 * Gastos, recorrências e orçamento do usuário logado.
 * Todas as rotas exigem JWT (ver SecurityConfig: anyRequest().authenticated()).
 */
@RestController
@RequestMapping("/api")
public class GastoController {

    private final GastoService service;
    private final UsuarioRepository usuarios;

    public GastoController(GastoService service, UsuarioRepository usuarios) {
        this.service = service;
        this.usuarios = usuarios;
    }

    /* ---------- Gastos ---------- */

    @GetMapping("/gastos")
    public List<GastoResponse> listar(Authentication auth) {
        return service.listar(usuarioId(auth)).stream().map(GastoResponse::de).toList();
    }

    @PostMapping("/gastos")
    @ResponseStatus(HttpStatus.CREATED)
    public GastoResponse criar(Authentication auth, @Valid @RequestBody GastoRequest req) {
        return GastoResponse.de(service.criar(usuarioId(auth), req));
    }

    @PutMapping("/gastos/{id}")
    public GastoResponse atualizar(Authentication auth, @PathVariable String id,
                                   @Valid @RequestBody GastoRequest req) {
        return GastoResponse.de(service.atualizar(usuarioId(auth), id, req));
    }

    @PatchMapping("/gastos/{id}/comentario")
    public GastoResponse atualizarComentario(Authentication auth, @PathVariable String id,
                                             @Valid @RequestBody ComentarioRequest req) {
        return GastoResponse.de(service.atualizarComentario(usuarioId(auth), id, req));
    }

    @DeleteMapping("/gastos/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(Authentication auth, @PathVariable String id) {
        service.excluir(usuarioId(auth), id);
    }

    /* ---------- Recorrências ---------- */

    @GetMapping("/gastos/recorrentes")
    public List<RecorrenteResponse> listarRecorrentes(Authentication auth) {
        return service.listarRecorrentes(usuarioId(auth)).stream().map(RecorrenteResponse::de).toList();
    }

    @PutMapping("/gastos/recorrentes/{id}")
    public RecorrenteResponse atualizarRecorrente(Authentication auth, @PathVariable String id,
                                                  @Valid @RequestBody RecorrenteRequest req) {
        return RecorrenteResponse.de(service.atualizarRecorrente(usuarioId(auth), id, req));
    }

    @DeleteMapping("/gastos/recorrentes/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluirRecorrente(Authentication auth, @PathVariable String id) {
        service.excluirRecorrente(usuarioId(auth), id);
    }

    /* ---------- Orçamento ---------- */

    @GetMapping("/orcamento")
    public OrcamentoResponse obterOrcamento(Authentication auth) {
        return new OrcamentoResponse(service.obterOrcamento(usuarioId(auth)));
    }

    @PutMapping("/orcamento")
    public OrcamentoResponse salvarOrcamento(Authentication auth, @Valid @RequestBody OrcamentoRequest req) {
        return new OrcamentoResponse(service.salvarOrcamento(usuarioId(auth), req.valorMensal()));
    }

    // O JWT guarda o e-mail; as coleções guardam o id do usuário
    private String usuarioId(Authentication auth) {
        if (auth == null || auth.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuário não autenticado.");
        }
        return usuarios.findByEmail(auth.getName())
            .map(Usuario::getId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuário não encontrado."));
    }
}