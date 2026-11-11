package Projeto.MeuBolso.model;

import java.math.BigDecimal;

/** DTOs do histórico unificado de movimentações das carteiras. */
public final class MovimentacaoDtos {

    private MovimentacaoDtos() {}

    /**
     * Uma linha do histórico de uma carteira.
     *
     * @param id         único na lista (prefixado pela origem, ex.: "gasto-...")
     * @param origem     "gasto", "receita", "meta" ou "transferencia"
     * @param descricao  texto principal da linha
     * @param categoria  categoria do lançamento, "Meta" ou "Transferência"
     * @param data       dia no formato "AAAA-MM-DD"
     * @param valor      com sinal: negativo = saiu da carteira, positivo = entrou
     * @param entrada    true quando o dinheiro entrou na carteira
     * @param carteiraId carteira afetada (conta ou cartão)
     */
    public record MovimentacaoResponse(
        String id,
        String origem,
        String descricao,
        String categoria,
        String data,
        BigDecimal valor,
        boolean entrada,
        String carteiraId
    ) {}
}
