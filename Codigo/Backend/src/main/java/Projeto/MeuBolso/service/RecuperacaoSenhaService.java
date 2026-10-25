package Projeto.MeuBolso.service;

import Projeto.MeuBolso.model.TokenRecuperacao;
import Projeto.MeuBolso.model.Usuario;
import Projeto.MeuBolso.repository.TokenRecuperacaoRepository;
import Projeto.MeuBolso.repository.UsuarioRepository;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Locale;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class RecuperacaoSenhaService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final UsuarioRepository usuarioRepository;
    private final TokenRecuperacaoRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Value("${app.recovery.token-minutes}")
    private long validadeMinutos;

    public RecuperacaoSenhaService(UsuarioRepository usuarioRepository,
                                   TokenRecuperacaoRepository tokenRepository,
                                   PasswordEncoder passwordEncoder,
                                   EmailService emailService) {
        this.usuarioRepository = usuarioRepository;
        this.tokenRepository = tokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
    }

    /**
     * Gera o token e envia o link por e-mail. Se o e-mail não existir, não faz
     * nada (e não avisa): quem chama sempre recebe a mesma resposta.
     */
    public void solicitar(String emailInformado) {
        String email = emailInformado.toLowerCase(Locale.ROOT).trim();

        usuarioRepository.findByEmail(email).ifPresent(usuario -> {
            // Só o pedido mais recente vale.
            tokenRepository.deleteByUsuarioId(usuario.getId());

            String token = gerarToken();
            tokenRepository.save(new TokenRecuperacao(
                usuario.getId(),
                hash(token),
                Instant.now().plus(validadeMinutos, ChronoUnit.MINUTES)
            ));

            String link = frontendUrl + "/redefinir-senha?token=" + token;
            emailService.enviarLinkRecuperacao(usuario.getEmail(), usuario.getNome(), link);
        });
    }

    /** Troca a senha usando o token do e-mail. Token inválido, vencido ou usado: 400. */
    public void redefinir(String token, String novaSenha) {
        String tokenHash = hash(token.trim());

        TokenRecuperacao registro = tokenRepository.findByTokenHash(tokenHash)
            .orElseThrow(RecuperacaoSenhaService::linkInvalido);

        if (registro.getExpiraEm().isBefore(Instant.now())) {
            tokenRepository.deleteByTokenHash(tokenHash);
            throw linkInvalido();
        }

        // "Consome" o token antes de trocar a senha: se duas requisições chegarem
        // juntas, só uma consegue apagar (a outra recebe 0 e é recusada).
        if (tokenRepository.deleteByTokenHash(tokenHash) == 0) {
            throw linkInvalido();
        }

        Usuario usuario = usuarioRepository.findById(registro.getUsuarioId())
            .orElseThrow(RecuperacaoSenhaService::linkInvalido);

        usuario.setSenhaHash(passwordEncoder.encode(novaSenha));
        usuarioRepository.save(usuario);
    }

    private static ResponseStatusException linkInvalido() {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, "Link inválido ou expirado.");
    }

    // 32 bytes aleatórios, em base64 próprio para URL (sem "+", "/" ou "=").
    private static String gerarToken() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    // SHA-256 em hexadecimal: é o que fica salvo no banco.
    private static String hash(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(token.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 indisponível", e);
        }
    }
}
