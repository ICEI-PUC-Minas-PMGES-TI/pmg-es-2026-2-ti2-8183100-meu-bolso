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
import Projeto.MeuBolso.service.ReservaService;

import jakarta.validation.Valid;
import java.math.BigDecimal;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/metas")
public class MetaController {

    private final MetaRepository metaRepository;
    private final UsuarioRepository usuarioRepository;
    private final MovimentacaoMetaRepository movimentacaoRepository;
    private final MetaService metaService;
    private final ReservaService reservaService;

    public MetaController(MetaRepository metaRepository,
                          UsuarioRepository usuarioRepository,
                          MovimentacaoMetaRepository movimentacaoRepository,
                          MetaService metaService,
                          ReservaService reservaService) {
        this.metaRepository = metaRepository;
        this.usuarioRepository = usuarioRepository;
        this.movimentacaoRepository = movimentacaoRepository;
        this.metaService = metaService;
        this.reservaService = reservaService;
    }

    // Lista todas as metas do usuário autenticado.
    // A reserva de emergência vem com mínimo, nível e meses cobertos já calculados.
    @GetMapping
    public List<MetaResponse> listar(Authentication authentication) {
        String usuarioId = usuarioAutenticado(authentication).getId();
        return metaRepository.findByUsuarioId(usuarioId).stream()
            .map(m -> paraResponse(usuarioId, m))
            .toList();
    }

    /**
     * Sugestão de valor mínimo da reserva para 3, 6 e 12 meses, com a base do
     * cálculo (historico | orcamento | recorrencias | informado | sem_dados).
     * `custoInformado` é opcional: só é usado quando não há dados para estimar.
     */
    @GetMapping("/reserva/sugestao")
    public ReservaService.Sugestao sugestaoReserva(@RequestParam(required = false) BigDecimal custoInformado,
                                                   Authentication authentication) {
        String usuarioId = usuarioAutenticado(authentication).getId();
        if (custoInformado != null && custoInformado.signum() <= 0) custoInformado = null;
        return reservaService.sugerir(usuarioId, custoInformado);
    }

    // Cria uma meta nova para o usuário autenticado (valorAtual nasce em zero).
    @PostMapping
    public ResponseEntity<MetaResponse> criar(@Valid @RequestBody MetaRequest request,
                                              Authentication authentication) {
        String usuarioId = usuarioAutenticado(authentication).getId();
        boolean reserva = Meta.TIPO_RESERVA.equals(request.tipo());

        if (reserva && metaRepository.existsByUsuarioIdAndTipo(usuarioId, Meta.TIPO_RESERVA)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Você já tem uma reserva de emergência.");
        }

        Meta meta = new Meta(usuarioId, request.nome().trim(), null, null, request.prioridade());
        meta.setTipo(reserva ? Meta.TIPO_RESERVA : Meta.TIPO_OBJETIVO);
        aplicarDados(meta, request);

        Meta salva = metaRepository.save(meta);
        return ResponseEntity.status(HttpStatus.CREATED).body(paraResponse(usuarioId, salva));
    }

    // Edita os dados básicos de uma meta do usuário (não altera o valorAtual nem o tipo).
    @PutMapping("/{id}")
    public MetaResponse atualizar(@PathVariable String id,
                                  @Valid @RequestBody MetaRequest request,
                                  Authentication authentication) {
        String usuarioId = usuarioAutenticado(authentication).getId();

        Meta meta = metaRepository.findByIdAndUsuarioId(id, usuarioId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Meta não encontrada."));

        meta.setNome(request.nome().trim());
        meta.setPrioridade(request.prioridade());
        aplicarDados(meta, request);

        return paraResponse(usuarioId, metaRepository.save(meta));
    }

    // Exclui uma meta do usuário (e o histórico de movimentações dela).
    // Meta com dinheiro guardado não pode ser excluída: o valor não volta para
    // nenhuma conta, então ele sumiria. O usuário precisa retirar antes.
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable String id, Authentication authentication) {
        String usuarioId = usuarioAutenticado(authentication).getId();

        Meta meta = metaRepository.findByIdAndUsuarioId(id, usuarioId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Meta não encontrada."));

        if (meta.getValorAtual() != null && meta.getValorAtual().signum() > 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Retire o dinheiro guardado nesta meta antes de excluí-la.");
        }

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
                paraResponse(usuarioId, aplicada.meta()),
                paraResponse(aplicada.movimentacao())));
    }

    /**
     * Copia os dados do formulário para a meta conforme o tipo dela.
     *  - objetivo: exige valorAlvo; limpa os campos da reserva.
     *  - reserva: sem valorAlvo e sem prazo; horizonte 3/6/12 (padrão 6);
     *    mínimo automático por padrão; mínimo manual exige valorMinimo.
     * Erros de regra usam 422 para a mensagem chegar à tela (o 400 do front
     * mostra só um texto genérico).
     */
    private static void aplicarDados(Meta meta, MetaRequest request) {
        if (!meta.isReserva()) {
            if (request.valorAlvo() == null) {
                throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "Informe o valor-alvo da meta.");
            }
            meta.setValorAlvo(request.valorAlvo());
            meta.setPrazo(request.prazo());
            meta.setHorizonteMeses(null);
            meta.setMinimoAutomatico(null);
            meta.setValorMinimo(null);
            meta.setCustoMensalInformado(null);
            return;
        }

        Integer horizonte = request.horizonteMeses() == null
            ? ReservaService.HORIZONTE_PADRAO
            : request.horizonteMeses();
        if (!ReservaService.HORIZONTES.contains(horizonte)) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                "O período da reserva deve ser de 3, 6 ou 12 meses.");
        }
        boolean automatico = !Boolean.FALSE.equals(request.minimoAutomatico());
        if (!automatico && request.valorMinimo() == null) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                "Informe o valor mínimo da reserva.");
        }

        meta.setValorAlvo(null);
        meta.setPrazo(null);
        meta.setPrioridade("alta");
        meta.setHorizonteMeses(horizonte);
        meta.setMinimoAutomatico(automatico);
        meta.setValorMinimo(automatico ? null : request.valorMinimo());
        meta.setCustoMensalInformado(request.custoMensalInformado());
    }

    // Resolve o usuário logado a partir do token (Authentication.getName() = e-mail).
    private Usuario usuarioAutenticado(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuário não autenticado.");
        }
        return usuarioRepository.findByEmail(authentication.getName())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuário não encontrado."));
    }

    private MetaResponse paraResponse(String usuarioId, Meta m) {
        if (!m.isReserva()) {
            return new MetaResponse(
                m.getId(), m.getNome(), m.getValorAlvo(), m.getValorAtual(), m.getPrazo(), m.getPrioridade(),
                Meta.TIPO_OBJETIVO, null, null, null, null, null, null, null, null);
        }
        ReservaService.Situacao s = reservaService.situacao(usuarioId, m);
        return new MetaResponse(
            m.getId(), m.getNome(), null, m.getValorAtual(), null, m.getPrioridade(),
            Meta.TIPO_RESERVA,
            ReservaService.horizonte(m),
            !Boolean.FALSE.equals(m.getMinimoAutomatico()),
            s.valorMinimo(),
            m.getCustoMensalInformado(),
            s.nivel(),
            s.mesesCobertos(),
            s.custoMensal(),
            s.base());
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
