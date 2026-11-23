package Projeto.MeuBolso.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * DTOs da API da biblioteca de categorias.
 *
 * O contrato espelha o front (service/categoriasService.js): a tela envia nome
 * e icone; a API devolve id, tipo, nome, icone e ordem.
 */
public final class CategoriaDtos {
    private CategoriaDtos() {}

    /** Dados que o cliente envia ao criar ou renomear/reicones uma categoria. */
    public record CategoriaRequest(
        @NotBlank(message = "Informe o nome da categoria.")
        @Size(max = 40, message = "O nome deve ter no máximo 40 caracteres.") String nome,
        @Size(max = 40) String icone
    ) {}

    /** Dados que a API devolve para cada categoria. */
    public record CategoriaResponse(
        String id,
        String tipo,
        String nome,
        String icone,
        int ordem
    ) {}
}
