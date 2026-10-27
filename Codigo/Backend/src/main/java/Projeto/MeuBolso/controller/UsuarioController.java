package Projeto.MeuBolso.controller;

import Projeto.MeuBolso.model.PerfilDtos.AtualizarPerfilRequest;
import Projeto.MeuBolso.model.PerfilDtos.PerfilResponse;
import Projeto.MeuBolso.model.PerfilDtos.TrocarSenhaRequest;
import Projeto.MeuBolso.model.Usuario;
import Projeto.MeuBolso.repository.UsuarioRepository;
import Projeto.MeuBolso.service.TokenService;

import jakarta.validation.Valid;
import java.util.Locale;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    private final UsuarioRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final TokenService tokenService;

    public UsuarioController(UsuarioRepository repository,
                             PasswordEncoder passwordEncoder,
                             TokenService tokenService) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
        this.tokenService = tokenService;
    }

    @GetMapping("/me")
    public UsuarioResponseDTO me(Authentication authentication) {
        Usuario u = usuarioAutenticado(authentication);
        return new UsuarioResponseDTO(u.getId(), u.getNome(), u.getEmail(), u.getTelefone());
    }

    // Atualiza nome, telefone e e-mail do usuário logado.
    // Como o e-mail é a identidade no JWT, reemitimos um token com o e-mail
    // atualizado para a sessão não quebrar.
    @PutMapping("/me")
    public PerfilResponse atualizar(@Valid @RequestBody AtualizarPerfilRequest request,
                                    Authentication authentication) {
        Usuario u = usuarioAutenticado(authentication);

        String novoEmail = request.email().toLowerCase(Locale.ROOT).trim();

        // Só valida duplicidade se o e-mail mudou (ignorando o próprio usuário).
        if (!novoEmail.equals(u.getEmail()) && repository.existsByEmailAndIdNot(novoEmail, u.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Este e-mail já está cadastrado.");
        }

        u.setNome(request.nome().trim());
        u.setTelefone(request.telefone().trim());
        u.setEmail(novoEmail); // o setter já normaliza

        Usuario salvo = repository.save(u);

        // Token novo com o e-mail atual (pode ter mudado).
        String token = tokenService.gerar(salvo.getEmail());

        return new PerfilResponse(salvo.getId(), salvo.getNome(), salvo.getEmail(), salvo.getTelefone(), token);
    }

    // Troca a senha do usuário logado, exigindo a senha atual.
    @PutMapping("/me/senha")
    public void trocarSenha(@Valid @RequestBody TrocarSenhaRequest request,
                            Authentication authentication) {
        Usuario u = usuarioAutenticado(authentication);

        if (!passwordEncoder.matches(request.senhaAtual(), u.getSenhaHash())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Senha atual incorreta.");
        }

        u.setSenhaHash(passwordEncoder.encode(request.novaSenha()));
        repository.save(u);
    }

    // Resolve o usuário logado (Authentication.getName() = e-mail).
    private Usuario usuarioAutenticado(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuário não autenticado.");
        }
        return repository.findByEmail(authentication.getName())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuário não encontrado."));
    }

    // DTO seguro contra valores nulos
    public record UsuarioResponseDTO(String id, String nome, String email, String telefone) {}
}
