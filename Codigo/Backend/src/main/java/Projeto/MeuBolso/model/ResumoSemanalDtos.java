package Projeto.MeuBolso.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * DTOs do resumo semanal por e-mail. Segue o padrão de MetaDtos e AuthDtos:
 * classe final agrupadora com records aninhados.
 */
public final class ResumoSemanalDtos {
    private ResumoSemanalDtos() {}

    /** Liga ou desliga o envio semanal. */
    public record PreferenciaRequest(@NotNull Boolean ativo) {}

    /** Estado atual da preferência, para a tela. */
    public record PreferenciaResponse(boolean ativo, String email, LocalDate ultimoEnvio) {}

    /** Token do link de cancelamento, enviado pela tela pública. */
    public record CancelamentoRequest(@NotBlank String token) {}

    /** Uma categoria e quanto foi gasto nela no período. */
    public record CategoriaValor(String nome, BigDecimal valor) {}

    /** Gasto do mês até hoje contra o orçamento mensal (percentual arredondado). */
    public record OrcamentoUso(BigDecimal gastoNoMes, BigDecimal limite, int percentual) {}

    /** Progresso de uma meta (percentual arredondado). */
    public record MetaProgresso(String nome, BigDecimal valorAtual, BigDecimal valorAlvo, int percentual) {}

    /** Conta recorrente com vencimento nos próximos 7 dias. */
    public record ContaAVencer(String descricao, BigDecimal valor, LocalDate vencimento) {}

    /** O resumo completo: o que vai no e-mail e o que aparece na prévia. */
    public record Resumo(
        LocalDate inicio,
        LocalDate fim,
        BigDecimal totalSemana,
        int quantidadeSemana,
        List<CategoriaValor> categorias,
        OrcamentoUso orcamento,
        List<MetaProgresso> metas,
        List<ContaAVencer> contasAVencer
    ) {}
}
