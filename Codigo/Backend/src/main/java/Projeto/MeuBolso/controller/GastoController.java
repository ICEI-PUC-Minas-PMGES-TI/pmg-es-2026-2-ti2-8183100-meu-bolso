package Projeto.MeuBolso.controller;

<<<<<<< HEAD
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
=======
import Projeto.MeuBolso.model.Gasto;
import Projeto.MeuBolso.model.GastoDtos.ComentarioRequest;
import Projeto.MeuBolso.model.GastoDtos.GastoRequest;
import Projeto.MeuBolso.model.GastoDtos.GastoResponse;
import Projeto.MeuBolso.model.GastoDtos.RecorrenciaRequest;
import Projeto.MeuBolso.model.GastoDtos.RecorrenciaResponse;
import Projeto.MeuBolso.model.Recorrencia;
import Projeto.MeuBolso.model.Usuario;
import Projeto.MeuBolso.repository.GastoRepository;
import Projeto.MeuBolso.repository.RecorrenciaRepository;
import Projeto.MeuBolso.repository.UsuarioRepository;
import Projeto.MeuBolso.service.GastoRecorrenciaService;

import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
>>>>>>> 3af0db57f8043fc8f226b9843d3e51f60f9c7aae
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
<<<<<<< HEAD
import org.springframework.web.bind.annotation.ResponseStatus;
=======
>>>>>>> 3af0db57f8043fc8f226b9843d3e51f60f9c7aae
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/**
<<<<<<< HEAD
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
=======
 * API de gastos e recorrências do usuário autenticado.
 *
 * O contrato espelha o front (service/Api.js -> gastosApi):
 *   GET/POST   /api/gastos
 *   PUT/DELETE /api/gastos/{id}
 *   PATCH      /api/gastos/{id}/comentario
 *   GET        /api/gastos/recorrentes
 *   PUT/DELETE /api/gastos/recorrentes/{id}
 */
@RestController
@RequestMapping("/api/gastos")
public class GastoController {

    private final GastoRepository gastoRepository;
    private final RecorrenciaRepository recorrenciaRepository;
    private final UsuarioRepository usuarioRepository;
    private final GastoRecorrenciaService recorrenciaService;

    public GastoController(GastoRepository gastoRepository,
                           RecorrenciaRepository recorrenciaRepository,
                           UsuarioRepository usuarioRepository,
                           GastoRecorrenciaService recorrenciaService) {
        this.gastoRepository = gastoRepository;
        this.recorrenciaRepository = recorrenciaRepository;
        this.usuarioRepository = usuarioRepository;
        this.recorrenciaService = recorrenciaService;
>>>>>>> 3af0db57f8043fc8f226b9843d3e51f60f9c7aae
    }

    /* ---------- Gastos ---------- */

<<<<<<< HEAD
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
=======
    // Lista os gastos do usuário. Antes, gera as recorrências que já venceram
    // (mesmo comportamento do front: é a listagem que dispara a geração).
    @GetMapping
    public List<GastoResponse> listar(Authentication authentication) {
        String usuarioId = usuarioAutenticado(authentication).getId();
        recorrenciaService.processar(usuarioId);
        return gastoRepository.findByUsuarioIdOrderByDataDesc(usuarioId).stream()
            .map(GastoController::paraResponse)
            .toList();
    }

    // Cria um gasto. Se "recorrente" for true, cria também a regra de recorrência
    // e vincula o gasto a ela.
    @PostMapping
    public ResponseEntity<GastoResponse> criar(@Valid @RequestBody GastoRequest request,
                                               Authentication authentication) {
        String usuarioId = usuarioAutenticado(authentication).getId();

        Gasto gasto = new Gasto(
            usuarioId,
            request.descricao().trim(),
            request.categoria(),
            request.carteira(),
            request.data(),
            request.valor(),
            comentarioLimpo(request.comentario()),
            null
        );

        if (request.recorrente()) {
            Recorrencia recorrencia = recorrenciaRepository.save(criarRecorrenciaDe(gasto));
            gasto.setRecorrenciaId(recorrencia.getId());
        }

        Gasto salvo = gastoRepository.save(gasto);
        return ResponseEntity.status(HttpStatus.CREATED).body(paraResponse(salvo));
    }

    // Edita um gasto. Pode transformar um gasto avulso em recorrente.
    @PutMapping("/{id}")
    public GastoResponse atualizar(@PathVariable String id,
                                @Valid @RequestBody GastoRequest request,
                                Authentication authentication) {
        String usuarioId = usuarioAutenticado(authentication).getId();

        Gasto gasto = gastoRepository.findByIdAndUsuarioId(id, usuarioId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Gasto não encontrado."));

        gasto.setDescricao(request.descricao().trim());
        gasto.setCategoria(request.categoria());
        gasto.setCarteira(request.carteira());
        gasto.setData(request.data());
        gasto.setValor(request.valor());
        gasto.setComentario(comentarioLimpo(request.comentario()));

        // Transformar um gasto avulso em recorrente.
        if (request.recorrente() && gasto.getRecorrenciaId() == null) {
            Recorrencia recorrencia = recorrenciaRepository.save(criarRecorrenciaDe(gasto));
            gasto.setRecorrenciaId(recorrencia.getId());
        }

        return paraResponse(gastoRepository.save(gasto));
    }

    // Atualiza só o comentário do gasto.
    @PatchMapping("/{id}/comentario")
    public GastoResponse atualizarComentario(@PathVariable String id,
                                             @Valid @RequestBody ComentarioRequest request,
                                             Authentication authentication) {
        String usuarioId = usuarioAutenticado(authentication).getId();

        Gasto gasto = gastoRepository.findByIdAndUsuarioId(id, usuarioId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Gasto não encontrado."));

        gasto.setComentario(comentarioLimpo(request.comentario()));
        return paraResponse(gastoRepository.save(gasto));
    }

    // Exclui um gasto.
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable String id, Authentication authentication) {
        String usuarioId = usuarioAutenticado(authentication).getId();

        Gasto gasto = gastoRepository.findByIdAndUsuarioId(id, usuarioId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Gasto não encontrado."));

        gastoRepository.delete(gasto);
        return ResponseEntity.noContent().build();
>>>>>>> 3af0db57f8043fc8f226b9843d3e51f60f9c7aae
    }

    /* ---------- Recorrências ---------- */

<<<<<<< HEAD
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
=======
    @GetMapping("/recorrentes")
    public List<RecorrenciaResponse> listarRecorrentes(Authentication authentication) {
        String usuarioId = usuarioAutenticado(authentication).getId();
        return recorrenciaRepository.findByUsuarioId(usuarioId).stream()
            .map(GastoController::paraResponse)
            .toList();
    }

    // Atualiza a regra completa de uma recorrência.
    @PutMapping("/recorrentes/{id}")
    public RecorrenciaResponse atualizarRecorrente(@PathVariable String id,
                                                   @Valid @RequestBody RecorrenciaRequest request,
                                                   Authentication authentication) {
        String usuarioId = usuarioAutenticado(authentication).getId();

        Recorrencia rec = recorrenciaRepository.findByIdAndUsuarioId(id, usuarioId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Recorrência não encontrada."));

        boolean reativando = request.ativa() && !rec.isAtiva();

        rec.setDescricao(request.descricao().trim());
        rec.setCategoria(request.categoria());
        rec.setCarteira(request.carteira());
        rec.setValor(request.valor());
        rec.setComentario(comentarioLimpo(request.comentario()));
        rec.setDiaDoMes(request.diaDoMes());
        rec.setAtiva(request.ativa());

        // Ao reativar, não gera retroativamente os meses em que ficou pausada:
        // alinha o "ultimoMes" ao mês anterior (mesma regra do front).
        if (reativando) {
            String mesAnterior = GastoRecorrenciaService.mudarMes(GastoRecorrenciaService.mesAtualChave(), -1);
            if (rec.getUltimoMes() == null || rec.getUltimoMes().compareTo(mesAnterior) < 0) {
                rec.setUltimoMes(mesAnterior);
            }
        }

        return paraResponse(recorrenciaRepository.save(rec));
    }

    // Exclui a regra. Os gastos já lançados continuam, só perdem o vínculo.
    @DeleteMapping("/recorrentes/{id}")
    public ResponseEntity<Void> excluirRecorrente(@PathVariable String id, Authentication authentication) {
        String usuarioId = usuarioAutenticado(authentication).getId();

        Recorrencia rec = recorrenciaRepository.findByIdAndUsuarioId(id, usuarioId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Recorrência não encontrada."));

        List<Gasto> vinculados = gastoRepository.findByUsuarioIdAndRecorrenciaId(usuarioId, id);
        for (Gasto g : vinculados) {
            g.setRecorrenciaId(null);
        }
        if (!vinculados.isEmpty()) {
            gastoRepository.saveAll(vinculados);
        }

        recorrenciaRepository.delete(rec);
        return ResponseEntity.noContent().build();
    }

    /* ---------- Apoio ---------- */

    // A recorrência nasce a partir de um gasto: o dia do mês vem da data dele e
    // o "ultimoMes" começa no mês desse gasto (já tem o primeiro lançamento).
    private static Recorrencia criarRecorrenciaDe(Gasto gasto) {
        int diaDoMes = Integer.parseInt(gasto.getData().substring(8, 10));
        String ultimoMes = gasto.getData().substring(0, 7);
        return new Recorrencia(
            gasto.getUsuarioId(),
            gasto.getDescricao(),
            gasto.getCategoria(),
            gasto.getCarteira(),
            gasto.getValor(),
            gasto.getComentario(),
            diaDoMes,
            true,
            ultimoMes
        );
    }

    private static String comentarioLimpo(String comentario) {
        return comentario == null ? "" : comentario.trim();
    }

    private Usuario usuarioAutenticado(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuário não autenticado.");
        }
        return usuarioRepository.findByEmail(authentication.getName())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuário não encontrado."));
    }

    private static GastoResponse paraResponse(Gasto g) {
        return new GastoResponse(
            g.getId(),
            g.getDescricao(),
            g.getCategoria(),
            g.getCarteira(),
            g.getData(),
            g.getValor(),
            g.getComentario(),
            g.getRecorrenciaId()
        );
    }

    private static RecorrenciaResponse paraResponse(Recorrencia r) {
        return new RecorrenciaResponse(
            r.getId(),
            r.getDescricao(),
            r.getCategoria(),
            r.getCarteira(),
            r.getValor(),
            r.getComentario(),
            r.getDiaDoMes(),
            r.isAtiva(),
            r.getUltimoMes()
        );
    }
}
>>>>>>> 3af0db57f8043fc8f226b9843d3e51f60f9c7aae
