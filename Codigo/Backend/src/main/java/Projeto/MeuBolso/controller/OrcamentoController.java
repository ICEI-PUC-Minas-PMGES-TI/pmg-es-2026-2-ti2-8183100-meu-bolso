package Projeto.MeuBolso.controller;

import Projeto.MeuBolso.model.GastoDtos.OrcamentoRequest;
import Projeto.MeuBolso.model.GastoDtos.OrcamentoResponse;
import Projeto.MeuBolso.model.Orcamento;
import Projeto.MeuBolso.model.Usuario;
import Projeto.MeuBolso.repository.OrcamentoRepository;
import Projeto.MeuBolso.repository.UsuarioRepository;
import Projeto.MeuBolso.service.GastoRecorrenciaService;

import jakarta.validation.Valid;
import java.math.BigDecimal;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/**
 * API do orçamento do usuário autenticado, agora POR MÊS.
 *
 * Contrato espelhando o front (service/Api.js -> gastosApi):
 *   GET /api/orcamento?mes=AAAA-MM   -> { mes, valorMensal }
 *   PUT /api/orcamento?mes=AAAA-MM   <- { valorMensal }
 *
 * O parâmetro "mes" é opcional: quando ausente, usa o mês atual. Definir o
 * orçamento de um mês não altera os demais meses.
 */
@RestController
@RequestMapping("/api/orcamento")
public class OrcamentoController {

    // Formato "AAAA-MM".
    private static final String PADRAO_MES = "\\d{4}-\\d{2}";

    private final OrcamentoRepository orcamentoRepository;
    private final UsuarioRepository usuarioRepository;

    public OrcamentoController(OrcamentoRepository orcamentoRepository,
                            UsuarioRepository usuarioRepository) {
        this.orcamentoRepository = orcamentoRepository;
        this.usuarioRepository = usuarioRepository;
    }

    // Devolve o orçamento do mês pedido (zero se ainda não definiu neste mês).
    @GetMapping
    public OrcamentoResponse obter(@RequestParam(required = false) String mes,
                                   Authentication authentication) {
        String usuarioId = usuarioAutenticado(authentication).getId();
        String mesAlvo = mesValido(mes);

        BigDecimal valor = orcamentoRepository.findByUsuarioIdAndMes(usuarioId, mesAlvo)
            .map(Orcamento::getValorMensal)
            .orElse(BigDecimal.ZERO);
        return new OrcamentoResponse(mesAlvo, valor);
    }

    // Define/atualiza o orçamento de um mês (um documento por usuário e mês).
    @PutMapping
    public OrcamentoResponse salvar(@RequestParam(required = false) String mes,
                                    @Valid @RequestBody OrcamentoRequest request,
                                    Authentication authentication) {
        String usuarioId = usuarioAutenticado(authentication).getId();
        String mesAlvo = mesValido(mes);

        Orcamento orcamento = orcamentoRepository.findByUsuarioIdAndMes(usuarioId, mesAlvo)
            .orElseGet(() -> new Orcamento(usuarioId, mesAlvo, BigDecimal.ZERO));
        orcamento.setValorMensal(request.valorMensal());

        Orcamento salvo = orcamentoRepository.save(orcamento);
        return new OrcamentoResponse(salvo.getMes(), salvo.getValorMensal());
    }

    // Normaliza o mês: usa o atual quando ausente; valida o formato "AAAA-MM".
    private static String mesValido(String mes) {
        if (mes == null || mes.isBlank()) {
            return GastoRecorrenciaService.mesAtualChave();
        }
        String limpo = mes.trim();
        if (!limpo.matches(PADRAO_MES)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mês deve estar no formato AAAA-MM.");
        }
        return limpo;
    }

    private Usuario usuarioAutenticado(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuário não autenticado.");
        }
        return usuarioRepository.findByEmail(authentication.getName())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuário não encontrado."));
    }
}
