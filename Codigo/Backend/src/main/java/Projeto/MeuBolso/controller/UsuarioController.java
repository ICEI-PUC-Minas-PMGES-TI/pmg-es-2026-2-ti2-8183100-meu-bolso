package Projeto.MeuBolso.controller;

import Projeto.MeuBolso.model.PerfilDtos.AtualizarFotoRequest;
import Projeto.MeuBolso.model.PerfilDtos.AtualizarPerfilRequest;
import Projeto.MeuBolso.model.PerfilDtos.FotoResponse;
import Projeto.MeuBolso.model.PerfilDtos.PerfilResponse;
import Projeto.MeuBolso.model.PerfilDtos.TrocarSenhaRequest;
import Projeto.MeuBolso.model.Usuario;
import Projeto.MeuBolso.repository.UsuarioRepository;
import Projeto.MeuBolso.service.FotoPerfilService;
import Projeto.MeuBolso.service.TokenService;
import Projeto.MeuBolso.util.Telefone;

import jakarta.validation.Valid;
import java.util.Locale;
import java.util.Objects;
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
    private final FotoPerfilService fotoPerfilService;

    public UsuarioController(UsuarioRepository repository,
                             PasswordEncoder passwordEncoder,
                             TokenService tokenService,
                             FotoPerfilService fotoPerfilService) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
        this.tokenService = tokenService;
        this.fotoPerfilService = fotoPerfilService;
    }

    @GetMapping("/me")
    public UsuarioResponseDTO me(Authentication authentication) {
        Usuario u = usuarioAutenticado(authentication);
        return new UsuarioResponseDTO(u.getId(), u.getNome(), u.getEmail(), u.getTelefone(), u.getFoto());
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

        // O telefone identifica o usuário no chatbot do WhatsApp: não pode repetir.
        // Só valida se mudou, para não travar a edição de quem já tinha duplicidade antiga.
        boolean telefoneMudou = !Objects.equals(Telefone.normalizar(request.telefone()), u.getTelefone());
        if (telefoneMudou && repository.telefoneEmUsoPorOutraConta(request.telefone(), u.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Este telefone já está cadastrado em outra conta.");
        }

        u.setNome(request.nome().trim());
        u.setTelefone(request.telefone().trim());
        u.setEmail(novoEmail); // o setter já normaliza

        Usuario salvo = repository.save(u);

        // Token novo com o e-mail atual (pode ter mudado).
        String token = tokenService.gerar(salvo.getEmail());

        return new PerfilResponse(salvo.getId(), salvo.getNome(), salvo.getEmail(),
            salvo.getTelefone(), salvo.getFoto(), token);
    }

    // Atualiza (ou remove) a foto de perfil do usuário logado.
    // foto null/vazia remove; data URL inválida ou grande demais -> 400.
    @PutMapping("/me/foto")
    public FotoResponse atualizarFoto(@RequestBody AtualizarFotoRequest request,
                                      Authentication authentication) {
        Usuario u = usuarioAutenticado(authentication);
        String foto = fotoPerfilService.normalizar(request.foto());
        u.setFoto(foto);
        Usuario salvo = repository.save(u);
        return new FotoResponse(salvo.getFoto());
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
    public record UsuarioResponseDTO(String id, String nome, String email, String telefone, String foto) {}
}
