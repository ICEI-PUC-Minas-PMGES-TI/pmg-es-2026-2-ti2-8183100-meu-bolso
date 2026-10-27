package Projeto.MeuBolso.controller;

import Projeto.MeuBolso.model.GastoDtos.OrcamentoRequest;
import Projeto.MeuBolso.model.GastoDtos.OrcamentoResponse;
import Projeto.MeuBolso.model.Orcamento;
import Projeto.MeuBolso.model.Usuario;
import Projeto.MeuBolso.repository.OrcamentoRepository;
import Projeto.MeuBolso.repository.UsuarioRepository;

import jakarta.validation.Valid;
import java.math.BigDecimal;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/**
 * API do orçamento mensal do usuário autenticado.
 *
 * Contrato espelhando o front (service/Api.js -> gastosApi):
 *   GET /api/orcamento        -> { valorMensal }
 *   PUT /api/orcamento        <- { valorMensal }
 */
@RestController
@RequestMapping("/api/orcamento")
public class OrcamentoController {

    private final OrcamentoRepository orcamentoRepository;
    private final UsuarioRepository usuarioRepository;

    public OrcamentoController(OrcamentoRepository orcamentoRepository,
                            UsuarioRepository usuarioRepository) {
        this.orcamentoRepository = orcamentoRepository;
        this.usuarioRepository = usuarioRepository;
    }

    // Devolve o orçamento do usuário (zero se ainda não definiu).
    @GetMapping
    public OrcamentoResponse obter(Authentication authentication) {
        String usuarioId = usuarioAutenticado(authentication).getId();
        BigDecimal valor = orcamentoRepository.findByUsuarioId(usuarioId)
            .map(Orcamento::getValorMensal)
            .orElse(BigDecimal.ZERO);
        return new OrcamentoResponse(valor);
    }

    // Define/atualiza o orçamento (um documento por usuário).
    @PutMapping
    public OrcamentoResponse salvar(@Valid @RequestBody OrcamentoRequest request,
                                    Authentication authentication) {
        String usuarioId = usuarioAutenticado(authentication).getId();

        Orcamento orcamento = orcamentoRepository.findByUsuarioId(usuarioId)
            .orElseGet(() -> new Orcamento(usuarioId, BigDecimal.ZERO));
        orcamento.setValorMensal(request.valorMensal());

        Orcamento salvo = orcamentoRepository.save(orcamento);
        return new OrcamentoResponse(salvo.getValorMensal());
    }

    private Usuario usuarioAutenticado(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuário não autenticado.");
        }
        return usuarioRepository.findByEmail(authentication.getName())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuário não encontrado."));
    }
}
