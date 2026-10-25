package Projeto.MeuBolso.model;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * DTOs da API de metas. Segue o padrão de AuthDtos: classe final agrupadora
 * com records aninhados e validação Jakarta.
 */
public final class MetaDtos {
    private MetaDtos() {}

    /**
     * Dados que o cliente envia ao criar ou editar uma meta.
     * O valorAtual não entra aqui: nasce em zero e só muda via aportes.
     */
    public record MetaRequest(
        @NotBlank @Size(max = 120) String nome,
        @NotNull @DecimalMin(value = "0.01", message = "O valor-alvo deve ser maior que zero.") BigDecimal valorAlvo,
        LocalDate prazo,
        @NotBlank @Pattern(regexp = "alta|media|baixa", message = "Prioridade deve ser alta, media ou baixa.") String prioridade
    ) {}

    /** Dados que a API devolve para o cliente. */
    public record MetaResponse(
        String id,
        String nome,
        BigDecimal valorAlvo,
        BigDecimal valorAtual,
        LocalDate prazo,
        String prioridade
    ) {}
}
