package Projeto.MeuBolso.controller;

import Projeto.MeuBolso.model.Usuario;
import Projeto.MeuBolso.repository.UsuarioRepository;
import Projeto.MeuBolso.service.TokenService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import java.util.Locale;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
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

        String telefoneLimpo = request.telefone() != null ? request.telefone().trim() : null;

        Usuario usuario = new Usuario(
            request.nome().trim(), 
            email, 
            telefoneLimpo,
            passwordEncoder.encode(request.senha())
        );

        repository.save(usuario);

        return ResponseEntity.status(HttpStatus.CREATED)
            .body(new MensagemResponse("Cadastro realizado com sucesso. Faça login para continuar."));
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        String email = request.email().toLowerCase(Locale.ROOT).trim();

        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(email, request.senha())
        );

        Usuario usuario = repository.findByEmail(authentication.getName())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Credenciais inválidas."));

        String token = tokenService.gerar(usuario.getEmail());

        return new AuthResponse(token, "Bearer", usuario.getNome(), usuario.getEmail());
    }

    public record CadastroRequest(
    @NotBlank String nome,
    @NotBlank @Email String email,
    @NotBlank String telefone,
    @NotBlank String senha
    ) {}    

    public record LoginRequest(
        @NotBlank @Email String email, 
        @NotBlank String senha
    ) {}

    public record AuthResponse(String token, String type, String nome, String email) {}

    public record MensagemResponse(String mensagem) {}
}