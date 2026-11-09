    package Projeto.MeuBolso.controller;

    import Projeto.MeuBolso.model.Gasto;
    import Projeto.MeuBolso.model.GastoDtos.ComentarioRequest;
    import Projeto.MeuBolso.model.GastoDtos.GastoRequest;
    import Projeto.MeuBolso.model.GastoDtos.GastoResponse;
    import Projeto.MeuBolso.model.GastoDtos.PularMesRequest;
    import Projeto.MeuBolso.model.GastoDtos.RecorrenciaRequest;
    import Projeto.MeuBolso.model.GastoDtos.RecorrenciaResponse;
    import Projeto.MeuBolso.model.Recorrencia;
    import Projeto.MeuBolso.model.Usuario;
    import Projeto.MeuBolso.repository.GastoRepository;
    import Projeto.MeuBolso.repository.RecorrenciaRepository;
    import Projeto.MeuBolso.repository.UsuarioRepository;
    import Projeto.MeuBolso.service.CarteiraService;
    import Projeto.MeuBolso.service.GastoRecorrenciaService;
    import Projeto.MeuBolso.service.GastoService;

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
    import org.springframework.web.bind.annotation.ResponseStatus;
    import org.springframework.web.bind.annotation.RestController;
    import org.springframework.web.server.ResponseStatusException;

    /**
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
        private final CarteiraService carteiraService;
        private final GastoService gastoService;

        public GastoController(GastoRepository gastoRepository,
                            RecorrenciaRepository recorrenciaRepository,
                            UsuarioRepository usuarioRepository,
                            GastoRecorrenciaService recorrenciaService,
                            CarteiraService carteiraService,
                            GastoService gastoService) {
            this.gastoRepository = gastoRepository;
            this.recorrenciaRepository = recorrenciaRepository;
            this.usuarioRepository = usuarioRepository;
            this.recorrenciaService = recorrenciaService;
            this.carteiraService = carteiraService;
            this.gastoService = gastoService;
        }



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

            Gasto salvo = gastoService.criar(
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

            String carteiraAntiga = gasto.getCarteiraId();
            BigDecimal valorAntigo = gasto.getValor();

            gasto.setDescricao(request.descricao().trim());
            gasto.setCategoria(request.categoria());
            gasto.setCarteira(request.carteira());
            gasto.setData(request.data());
            gasto.setValor(request.valor());
            gasto.setComentario(comentarioLimpo(request.comentario()));
            gasto.setCarteiraId(request.carteiraId());

            // Transformar um gasto avulso em recorrente.
            if (request.recorrente() && gasto.getRecorrenciaId() == null) {
                Recorrencia recorrencia = recorrenciaRepository.save(criarRecorrenciaDe(gasto));
                gasto.setRecorrenciaId(recorrencia.getId());
            }

            Gasto salvo = gastoRepository.save(gasto);
            carteiraService.aplicarGasto(usuarioId, carteiraAntiga, valorAntigo.negate());
            carteiraService.aplicarGasto(usuarioId, salvo.getCarteiraId(), salvo.getValor());
            return paraResponse(salvo);
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
            carteiraService.aplicarGasto(usuarioId, gasto.getCarteiraId(), gasto.getValor().negate());
            return ResponseEntity.noContent().build();
        }

        /* ---------- Recorrências ---------- */

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

        // Pula um mês da recorrência ("remover só neste mês"). Marca o mês para
        // não ser gerado e, se já houver um gasto lançado nesse mês para esta
        // regra, remove-o e estorna na carteira. Não afeta meses passados nem
        // os demais meses futuros.
        @PostMapping("/recorrentes/{id}/pular")
        public RecorrenciaResponse pularMes(@PathVariable String id,
                                            @Valid @RequestBody PularMesRequest request,
                                            Authentication authentication) {
            String usuarioId = usuarioAutenticado(authentication).getId();

            Recorrencia rec = recorrenciaRepository.findByIdAndUsuarioId(id, usuarioId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Recorrência não encontrada."));

            String mes = request.mes();
            rec.pularMes(mes);
            Recorrencia salva = recorrenciaRepository.save(rec);

            // Se o mês já virou um gasto real desta recorrência, remove e estorna.
            List<Gasto> vinculados = gastoRepository.findByUsuarioIdAndRecorrenciaId(usuarioId, id);
            for (Gasto g : vinculados) {
                if (g.getData() != null && g.getData().startsWith(mes)) {
                    gastoRepository.delete(g);
                    carteiraService.aplicarGasto(usuarioId, g.getCarteiraId(), g.getValor().negate());
                }
            }

            return paraResponse(salva);
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

        private static Recorrencia criarRecorrenciaDe(Gasto gasto) {
            int diaDoMes = Integer.parseInt(gasto.getData().substring(8, 10));
            String ultimoMes = gasto.getData().substring(0, 7);
            Recorrencia r = new Recorrencia(
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
            r.setCarteiraId(gasto.getCarteiraId());
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

        private static GastoResponse paraResponse(Gasto g) {
            return new GastoResponse(
                g.getId(),
                g.getDescricao(),
                g.getCategoria(),
                g.getCarteira(),
                g.getData(),
                g.getValor(),
                g.getComentario(),
                g.getRecorrenciaId(),
                g.getCarteiraId()
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
                r.getUltimoMes(),
                r.getMesesPulados(),
                r.getCarteiraId()
            );
        }
    }
