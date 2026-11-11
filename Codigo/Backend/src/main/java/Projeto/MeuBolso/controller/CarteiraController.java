package Projeto.MeuBolso.controller;

import Projeto.MeuBolso.model.CarteiraUsuario;
import Projeto.MeuBolso.model.Usuario;
import Projeto.MeuBolso.repository.CarteiraUsuarioRepository;
import Projeto.MeuBolso.repository.UsuarioRepository;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
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

    private static final int MAX_ITENS = 200;

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
        if (corpo.getVersao() != carteira.getVersao()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Sua carteira foi alterada em outra tela. Recarregue a página.");
        }
        List<Map<String, Object>> cartoes = ouVazia(corpo.getCartoes());
        List<Map<String, Object>> contas = ouVazia(corpo.getContas());
        List<Map<String, Object>> dinheiroEReservas = ouVazia(corpo.getDinheiroEReservas());
        List<Map<String, Object>> movsDinheiro = ouVazia(corpo.getMovsDinheiro());
        if (movsDinheiro.size() > MAX_ITENS * 10) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Movimentações em excesso.");
        }
        Set<String> idsVistos = new HashSet<>();
        validarLista("cartoes", cartoes, Set.of("cartao"), idsVistos);
        validarLista("contas", contas, Set.of("conta"), idsVistos);
        validarLista("dinheiroEReservas", dinheiroEReservas, Set.of("dinheiro", "reserva"), idsVistos);
        carteira.setCartoes(cartoes);
        carteira.setContas(contas);
        carteira.setDinheiroEReservas(dinheiroEReservas);
        carteira.setMovsDinheiro(movsDinheiro);
        carteira.setVersao(carteira.getVersao() + 1);
        return carteiraRepository.save(carteira);
    }

    private static void validarLista(String nome, List<Map<String, Object>> lista,
                                     Set<String> tiposValidos, Set<String> idsVistos) {
        if (lista.size() > MAX_ITENS) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Lista " + nome + " excede o limite.");
        }
        for (Map<String, Object> item : lista) {
            if (!(item.get("id") instanceof String id) || id.isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Item sem id em " + nome + ".");
            }
            if (!idsVistos.add(id)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Id repetido: " + id);
            }
            if (!(item.get("tipo") instanceof String tipo) || !tiposValidos.contains(tipo)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tipo inválido em " + nome + ".");
            }
            Object saldo = item.get("saldo");
            if (saldo != null && !(saldo instanceof Number)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Saldo inválido em " + nome + ".");
            }
        }
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
