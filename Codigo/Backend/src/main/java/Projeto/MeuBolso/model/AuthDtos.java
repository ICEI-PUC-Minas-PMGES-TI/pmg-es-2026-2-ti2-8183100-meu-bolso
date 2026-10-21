package Projeto.MeuBolso.model;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class AuthDtos {
    private AuthDtos() {}

    public record CadastroRequest(
        @NotBlank @Size(max = 120) String nome,
        @NotBlank @Email @Size(max = 180) String email,
        @NotBlank @Size(max = 30) String telefone,
        @NotBlank @Size(min = 8, max = 100) String senha
    ) {}

    public record LoginRequest(
        @NotBlank @Email String email,
        @NotBlank String senha
    ) {}

    public record AuthResponse(String token, String tipo, String nome, String email) {}
    public record MensagemResponse(String mensagem) {}
}
