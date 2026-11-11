package Projeto.MeuBolso.controller;

import Projeto.MeuBolso.model.MovimentacaoDtos.MovimentacaoResponse;
import Projeto.MeuBolso.model.Usuario;
import Projeto.MeuBolso.repository.UsuarioRepository;
import Projeto.MeuBolso.service.MovimentacaoService;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/**
 * Histórico unificado das carteiras do usuário autenticado
 * (gastos, receitas, movimentações de metas e transferências).
 *
 *   GET /api/movimentacoes  -> lista do mais recente para o mais antigo
 *
 * Usado pela página Carteiras ("Última movimentação" e extrato de cada conta).
 */
@RestController
@RequestMapping("/api/movimentacoes")
public class MovimentacaoController {

    private final MovimentacaoService movimentacaoService;
    private final UsuarioRepository usuarioRepository;

    public MovimentacaoController(MovimentacaoService movimentacaoService, UsuarioRepository usuarioRepository) {
        this.movimentacaoService = movimentacaoService;
        this.usuarioRepository = usuarioRepository;
    }

    @GetMapping
    public List<MovimentacaoResponse> listar(Authentication authentication) {
        return movimentacaoService.listar(usuarioAutenticado(authentication).getId());
    }

    private Usuario usuarioAutenticado(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuário não autenticado.");
        }
        return usuarioRepository.findByEmail(authentication.getName())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuário não encontrado."));
    }
}
