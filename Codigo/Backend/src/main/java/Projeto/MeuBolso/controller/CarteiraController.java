package Projeto.MeuBolso.controller;

import Projeto.MeuBolso.model.CarteiraUsuario;
import Projeto.MeuBolso.model.Usuario;
import Projeto.MeuBolso.repository.CarteiraUsuarioRepository;
import Projeto.MeuBolso.repository.UsuarioRepository;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/carteiras")
public class CarteiraController {

    private final CarteiraUsuarioRepository carteiraRepository;
    private final UsuarioRepository usuarioRepository;

    public CarteiraController(CarteiraUsuarioRepository carteiraRepository, UsuarioRepository usuarioRepository) {
        this.carteiraRepository = carteiraRepository;
        this.usuarioRepository = usuarioRepository;
    }

    // Retorna a carteira do usuário autenticado (vazia se ainda não existir).
    @GetMapping
    public CarteiraUsuario obter(Authentication authentication) {
        String usuarioId = usuarioAutenticado(authentication).getId();
        return carteiraRepository.findByUsuarioId(usuarioId)
            .orElseGet(() -> new CarteiraUsuario(usuarioId));
    }

    // Substitui as 4 listas da carteira do usuário (cria o documento se faltar).
    @PutMapping
    public CarteiraUsuario salvar(@RequestBody CarteiraUsuario corpo, Authentication authentication) {
        String usuarioId = usuarioAutenticado(authentication).getId();

        CarteiraUsuario carteira = carteiraRepository.findByUsuarioId(usuarioId)
            .orElseGet(() -> new CarteiraUsuario(usuarioId));

        carteira.setCartoes(ouVazia(corpo.getCartoes()));
        carteira.setContas(ouVazia(corpo.getContas()));
        carteira.setDinheiroEReservas(ouVazia(corpo.getDinheiroEReservas()));
        carteira.setMovsDinheiro(ouVazia(corpo.getMovsDinheiro()));

        return carteiraRepository.save(carteira);
    }

    private static List<Map<String, Object>> ouVazia(List<Map<String, Object>> lista) {
        return lista != null ? lista : new ArrayList<>();
    }

    // Resolve o usuário logado a partir do token (Authentication.getName() = e-mail).
    private Usuario usuarioAutenticado(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuário não autenticado.");
        }
        return usuarioRepository.findByEmail(authentication.getName())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuário não encontrado."));
    }
}
