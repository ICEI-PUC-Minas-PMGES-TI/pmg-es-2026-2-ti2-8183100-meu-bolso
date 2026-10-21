package Projeto.MeuBolso.controller;

import Projeto.MeuBolso.model.AuthDtos.AuthResponse;
import Projeto.MeuBolso.model.AuthDtos.CadastroRequest;
import Projeto.MeuBolso.model.AuthDtos.LoginRequest;
import Projeto.MeuBolso.model.AuthDtos.MensagemResponse;
import Projeto.MeuBolso.model.Usuario;
import Projeto.MeuBolso.repository.UsuarioRepository;
import Projeto.MeuBolso.service.TokenService;

import jakarta.validation.Valid;
import java.util.Locale;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UsuarioRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final TokenService tokenService;

    public AuthController(UsuarioRepository repository,
                          PasswordEncoder passwordEncoder,
                          AuthenticationManager authenticationManager,
                          TokenService tokenService) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.tokenService = tokenService;
    }

    @PostMapping("/register")
    public ResponseEntity<MensagemResponse> cadastrar(@Valid @RequestBody CadastroRequest request) {
        String email = request.email().toLowerCase(Locale.ROOT).trim();

        if (repository.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Este e-mail já está cadastrado.");
        }

        Usuario usuario = new Usuario(
            request.nome().trim(),
            email,
            request.telefone().trim(),
            passwordEncoder.encode(request.senha())
        );

        repository.save(usuario);

        return ResponseEntity.status(HttpStatus.CREATED)
            .body(new MensagemResponse("Cadastro realizado com sucesso. Faça login para continuar."));
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        String email = request.email().toLowerCase(Locale.ROOT).trim();

        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, request.senha()));
        } catch (AuthenticationException e) {
            // Mesma mensagem para e-mail inexistente e senha errada
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "E-mail ou senha inválidos.");
        }

        Usuario usuario = repository.findByEmail(authentication.getName())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "E-mail ou senha inválidos."));

        String token = tokenService.gerar(usuario.getEmail());

        return new AuthResponse(token, "Bearer", usuario.getNome(), usuario.getEmail());
    }
}
