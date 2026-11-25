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
     *
     * `tipo`: "objetivo" (padrão) ou "reserva". Só vale na criação; na edição
     * o tipo da meta não muda.
     *  - objetivo: valorAlvo obrigatório; os campos da reserva são ignorados.
     *  - reserva: sem valorAlvo nem prazo. Usa horizonteMeses (3, 6 ou 12;
     *    padrão 6), minimoAutomatico (padrão true) e, quando o mínimo é manual,
     *    valorMinimo. custoMensalInformado é opcional (base quando não há dados).
     * As regras que dependem do tipo são validadas no MetaController.
     */
    public record MetaRequest(
        @NotBlank @Size(max = 120) String nome,
        @DecimalMin(value = "0.01", message = "O valor-alvo deve ser maior que zero.") BigDecimal valorAlvo,
        LocalDate prazo,
        @NotBlank @Pattern(regexp = "alta|media|baixa", message = "Prioridade deve ser alta, media ou baixa.") String prioridade,
        @Pattern(regexp = "objetivo|reserva", message = "Tipo deve ser objetivo ou reserva.") String tipo,
        Integer horizonteMeses,
        Boolean minimoAutomatico,
        @DecimalMin(value = "0.01", message = "O valor mínimo deve ser maior que zero.") BigDecimal valorMinimo,
        @DecimalMin(value = "0.01", message = "O custo mensal deve ser maior que zero.") BigDecimal custoMensalInformado
    ) {}

    /**
     * Dados que a API devolve para o cliente.
     * Para a reserva, `valorMinimo` é o mínimo EFETIVO (automático ou manual) e
     * `nivel` é o alerta: vazia | critica | atencao | protegida | sem_minimo.
     * `mesesCobertos` = quantos meses de gastos o valor guardado cobre.
     * Nos objetivos, os campos da reserva vêm null.
     */
    public record MetaResponse(
        String id,
        String nome,
        BigDecimal valorAlvo,
        BigDecimal valorAtual,
        LocalDate prazo,
        String prioridade,
        String tipo,
        Integer horizonteMeses,
        Boolean minimoAutomatico,
        BigDecimal valorMinimo,
        BigDecimal custoMensalInformado,
        String nivel,
        BigDecimal mesesCobertos,
        BigDecimal custoMensal,
        String baseCalculo
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
