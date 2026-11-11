package Projeto.MeuBolso.model;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.Instant;
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

    /**
     * Movimentação (aporte/retirada) de uma meta enviada pelo cliente.
     * `tipo`: "deposito" soma ao valor guardado; "retirada" subtrai.
     * `carteiraId`: conta ou dinheiro de onde o valor sai/entra.
     */
    public record MovimentacaoRequest(
        @NotBlank @Pattern(regexp = "deposito|retirada", message = "Tipo deve ser deposito ou retirada.") String tipo,
        @NotNull @DecimalMin(value = "0.01", message = "O valor deve ser maior que zero.") BigDecimal valor,
        @NotBlank String carteiraId,
        @Size(max = 120) String titulo
    ) {}

    /** Movimentação devolvida no histórico da meta. */
    public record MovimentacaoResponse(
        String id,
        String tipo,
        BigDecimal valor,
        String titulo,
        String carteiraId,
        Instant data
    ) {}

    /**
     * Resposta de uma movimentação aplicada: devolve a meta já atualizada
     * (com o novo valorAtual) e a movimentação registrada.
     */
    public record MovimentacaoAplicadaResponse(
        MetaResponse meta,
        MovimentacaoResponse movimentacao
    ) {}
}
