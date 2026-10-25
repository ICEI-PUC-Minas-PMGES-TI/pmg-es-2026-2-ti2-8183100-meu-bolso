package Projeto.MeuBolso.model;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * DTOs da edição de perfil do usuário. Segue o padrão de AuthDtos:
 * classe final agrupadora com records aninhados e validação Jakarta.
 */
public final class PerfilDtos {
    private PerfilDtos() {}

    /** Edição dos dados básicos do perfil (nome, email, telefone). */
    public record AtualizarPerfilRequest(
        @NotBlank @Size(max = 120) String nome,
        @NotBlank @Email @Size(max = 180) String email,
        @NotBlank @Size(max = 30) String telefone
    ) {}

    /** Troca de senha: exige a senha atual e a nova. */
    public record TrocarSenhaRequest(
        @NotBlank String senhaAtual,
        @NotBlank @Size(min = 8, max = 100) String novaSenha
    ) {}

    /**
     * Resposta da atualização de perfil. Devolve os dados atualizados e um
     * token novo: como o e-mail é a identidade no JWT, trocar o e-mail
     * invalidaria o token antigo — então reemitimos um aqui.
     */
    public record PerfilResponse(
        String id,
        String nome,
        String email,
        String telefone,
        String token
    ) {}
}
