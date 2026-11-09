package Projeto.MeuBolso.controller;

import Projeto.MeuBolso.model.Receita;
import Projeto.MeuBolso.model.ReceitaDtos.ComentarioRequest;
import Projeto.MeuBolso.model.ReceitaDtos.PularMesRequest;
import Projeto.MeuBolso.model.ReceitaDtos.ReceitaRequest;
import Projeto.MeuBolso.model.ReceitaDtos.ReceitaResponse;
import Projeto.MeuBolso.model.ReceitaDtos.RecorrenciaRequest;
import Projeto.MeuBolso.model.ReceitaDtos.RecorrenciaResponse;
import Projeto.MeuBolso.model.ReceitaRecorrencia;
import Projeto.MeuBolso.model.Usuario;
import Projeto.MeuBolso.repository.ReceitaRecorrenciaRepository;
import Projeto.MeuBolso.repository.ReceitaRepository;
import Projeto.MeuBolso.repository.UsuarioRepository;
import Projeto.MeuBolso.service.CarteiraService;
import Projeto.MeuBolso.service.GastoRecorrenciaService;
import Projeto.MeuBolso.service.ReceitaRecorrenciaService;
import Projeto.MeuBolso.service.ReceitaService;

import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/**
 * API de receitas e recorrências do usuário autenticado.
 *
 * Espelho de {@link GastoController}. O contrato espelha o front
 * (service/Api.js -> receitasApi):
 *   GET/POST   /api/receitas
 *   PUT/DELETE /api/receitas/{id}
 *   PATCH      /api/receitas/{id}/comentario
 *   GET        /api/receitas/recorrentes
 *   PUT/DELETE /api/receitas/recorrentes/{id}
 *
 * Ao criar/editar/excluir uma receita, a carteira é ajustada no sentido oposto
 * ao de um gasto: criar soma no saldo, excluir estorna.
 */
@RestController
@RequestMapping("/api/receitas")
public class ReceitaController {

    private final ReceitaRepository receitaRepository;
    private final ReceitaRecorrenciaRepository recorrenciaRepository;
    private final UsuarioRepository usuarioRepository;
    private final ReceitaRecorrenciaService recorrenciaService;
    private final CarteiraService carteiraService;
    private final ReceitaService receitaService;

    public ReceitaController(ReceitaRepository receitaRepository,
                        ReceitaRecorrenciaRepository recorrenciaRepository,
                        UsuarioRepository usuarioRepository,
                        ReceitaRecorrenciaService recorrenciaService,
                        CarteiraService carteiraService,
                        ReceitaService receitaService) {
        this.receitaRepository = receitaRepository;
        this.recorrenciaRepository = recorrenciaRepository;
        this.usuarioRepository = usuarioRepository;
        this.recorrenciaService = recorrenciaService;
        this.carteiraService = carteiraService;
        this.receitaService = receitaService;
    }

    @GetMapping
    public List<ReceitaResponse> listar(Authentication authentication) {
        String usuarioId = usuarioAutenticado(authentication).getId();
        recorrenciaService.processar(usuarioId);
        return receitaRepository.findByUsuarioIdOrderByDataDesc(usuarioId).stream()
            .map(ReceitaController::paraResponse)
            .toList();
    }

    // Cria uma receita. Se "recorrente" for true, cria também a regra de recorrência
    // e vincula a receita a ela.
    @PostMapping
    public ResponseEntity<ReceitaResponse> criar(@Valid @RequestBody ReceitaRequest request,
                                            Authentication authentication) {
        String usuarioId = usuarioAutenticado(authentication).getId();

        // A regra de criação fica no ReceitaService (reutilizada pelo chatbot).
        Receita salva = receitaService.criar(
            usuarioId,
            request.descricao(),
            request.categoria(),
            request.carteira(),
            request.data(),
            request.valor(),
            request.comentario(),
            request.recorrente(),
            request.carteiraId()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(paraResponse(salva));
    }

    // Edita uma receita. Pode transformar uma receita avulsa em recorrente.
    @PutMapping("/{id}")
    public ReceitaResponse atualizar(@PathVariable String id,
                                @Valid @RequestBody ReceitaRequest request,
                                Authentication authentication) {
        String usuarioId = usuarioAutenticado(authentication).getId();

        Receita receita = receitaRepository.findByIdAndUsuarioId(id, usuarioId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Receita não encontrada."));

        String carteiraAntiga = receita.getCarteiraId();
        BigDecimal valorAntigo = receita.getValor();

        receita.setDescricao(request.descricao().trim());
        receita.setCategoria(request.categoria());
        receita.setCarteira(request.carteira());
        receita.setData(request.data());
        receita.setValor(request.valor());
        receita.setComentario(comentarioLimpo(request.comentario()));
        receita.setCarteiraId(request.carteiraId());

        // Transformar uma receita avulsa em recorrente.
        if (request.recorrente() && receita.getRecorrenciaId() == null) {
            ReceitaRecorrencia recorrencia = recorrenciaRepository.save(criarRecorrenciaDe(receita));
            receita.setRecorrenciaId(recorrencia.getId());
        }

        Receita salva = receitaRepository.save(receita);
        // Desfaz a entrada antiga e aplica a nova (ambas no sentido de receita).
        carteiraService.aplicarReceita(usuarioId, carteiraAntiga, valorAntigo.negate());
        carteiraService.aplicarReceita(usuarioId, salva.getCarteiraId(), salva.getValor());
        return paraResponse(salva);
    }

    // Atualiza só o comentário da receita.
    @PatchMapping("/{id}/comentario")
    public ReceitaResponse atualizarComentario(@PathVariable String id,
                                            @Valid @RequestBody ComentarioRequest request,
                                            Authentication authentication) {
        String usuarioId = usuarioAutenticado(authentication).getId();

        Receita receita = receitaRepository.findByIdAndUsuarioId(id, usuarioId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Receita não encontrada."));

        receita.setComentario(comentarioLimpo(request.comentario()));
        return paraResponse(receitaRepository.save(receita));
    }

    // Exclui uma receita.
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable String id, Authentication authentication) {
        String usuarioId = usuarioAutenticado(authentication).getId();

        Receita receita = receitaRepository.findByIdAndUsuarioId(id, usuarioId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Receita não encontrada."));

        receitaRepository.delete(receita);
        // Estorna a entrada que esta receita havia somado.
        carteiraService.aplicarReceita(usuarioId, receita.getCarteiraId(), receita.getValor().negate());
        return ResponseEntity.noContent().build();
    }

    /* ---------- Recorrências ---------- */

    @GetMapping("/recorrentes")
    public List<RecorrenciaResponse> listarRecorrentes(Authentication authentication) {
        String usuarioId = usuarioAutenticado(authentication).getId();
        return recorrenciaRepository.findByUsuarioId(usuarioId).stream()
            .map(ReceitaController::paraResponse)
            .toList();
    }

    // Atualiza a regra completa de uma recorrência.
    @PutMapping("/recorrentes/{id}")
    public RecorrenciaResponse atualizarRecorrente(@PathVariable String id,
                                                @Valid @RequestBody RecorrenciaRequest request,
                                                Authentication authentication) {
        String usuarioId = usuarioAutenticado(authentication).getId();

        ReceitaRecorrencia rec = recorrenciaRepository.findByIdAndUsuarioId(id, usuarioId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Recorrência não encontrada."));

        boolean reativando = request.ativa() && !rec.isAtiva();

        rec.setDescricao(request.descricao().trim());
        rec.setCategoria(request.categoria());
        rec.setCarteira(request.carteira());
        rec.setValor(request.valor());
        rec.setComentario(comentarioLimpo(request.comentario()));
        rec.setDiaDoMes(request.diaDoMes());
        rec.setAtiva(request.ativa());
        rec.setCarteiraId(request.carteiraId());

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

    // Pula um mês da recorrência ("remover só neste mês"). Marca o mês para não
    // ser gerado e, se já houver uma receita lançada nesse mês para esta regra,
    // remove-a e estorna na carteira. Não afeta meses passados nem os demais
    // meses futuros.
    @PostMapping("/recorrentes/{id}/pular")
    public RecorrenciaResponse pularMes(@PathVariable String id,
                                        @Valid @RequestBody PularMesRequest request,
                                        Authentication authentication) {
        String usuarioId = usuarioAutenticado(authentication).getId();

        ReceitaRecorrencia rec = recorrenciaRepository.findByIdAndUsuarioId(id, usuarioId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Recorrência não encontrada."));

        String mes = request.mes();
        rec.pularMes(mes);
        ReceitaRecorrencia salva = recorrenciaRepository.save(rec);

        // Se o mês já virou uma receita real desta recorrência, remove e estorna.
        List<Receita> vinculadas = receitaRepository.findByUsuarioIdAndRecorrenciaId(usuarioId, id);
        for (Receita r : vinculadas) {
            if (r.getData() != null && r.getData().startsWith(mes)) {
                receitaRepository.delete(r);
                carteiraService.aplicarReceita(usuarioId, r.getCarteiraId(), r.getValor().negate());
            }
        }

        return paraResponse(salva);
    }

    // Exclui a regra. As receitas já lançadas continuam, só perdem o vínculo.
    @DeleteMapping("/recorrentes/{id}")
    public ResponseEntity<Void> excluirRecorrente(@PathVariable String id, Authentication authentication) {
        String usuarioId = usuarioAutenticado(authentication).getId();

        ReceitaRecorrencia rec = recorrenciaRepository.findByIdAndUsuarioId(id, usuarioId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Recorrência não encontrada."));

        List<Receita> vinculadas = receitaRepository.findByUsuarioIdAndRecorrenciaId(usuarioId, id);
        for (Receita r : vinculadas) {
            r.setRecorrenciaId(null);
        }
        if (!vinculadas.isEmpty()) {
            receitaRepository.saveAll(vinculadas);
        }

        recorrenciaRepository.delete(rec);
        return ResponseEntity.noContent().build();
    }

    private static ReceitaRecorrencia criarRecorrenciaDe(Receita receita) {
        int diaDoMes = Integer.parseInt(receita.getData().substring(8, 10));
        String ultimoMes = receita.getData().substring(0, 7);
        ReceitaRecorrencia r = new ReceitaRecorrencia(
            receita.getUsuarioId(),
            receita.getDescricao(),
            receita.getCategoria(),
            receita.getCarteira(),
            receita.getValor(),
            receita.getComentario(),
            diaDoMes,
            true,
            ultimoMes
        );
        r.setCarteiraId(receita.getCarteiraId());
        return r;
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

    private static ReceitaResponse paraResponse(Receita r) {
        return new ReceitaResponse(
            r.getId(),
            r.getDescricao(),
            r.getCategoria(),
            r.getCarteira(),
            r.getData(),
            r.getValor(),
            r.getComentario(),
            r.getRecorrenciaId(),
            r.getCarteiraId()
        );
    }

    private static RecorrenciaResponse paraResponse(ReceitaRecorrencia r) {
        return new RecorrenciaResponse(
            r.getId(),
            r.getDescricao(),
            r.getCategoria(),
            r.getCarteira(),
            r.getValor(),
            r.getComentario(),
            r.getDiaDoMes(),
            r.isAtiva(),
            r.getUltimoMes(),
            r.getMesesPulados(),
            r.getCarteiraId()
        );
    }
}
