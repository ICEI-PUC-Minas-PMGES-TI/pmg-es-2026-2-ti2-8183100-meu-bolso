package Projeto.MeuBolso.model;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** DTOs da recuperação de senha. Mesmo padrão de AuthDtos. */
public final class RecuperacaoDtos {
    private RecuperacaoDtos() {}

    /** Pedido do link de recuperação. */
    public record EsqueciSenhaRequest(
        @NotBlank @Email @Size(max = 180) String email
    ) {}

    /** Definição da nova senha, com o token que veio no link do e-mail. */
    public record RedefinirSenhaRequest(
        @NotBlank @Size(max = 200) String token,
        @NotBlank @Size(min = 8, max = 100) String novaSenha
    ) {}
}
