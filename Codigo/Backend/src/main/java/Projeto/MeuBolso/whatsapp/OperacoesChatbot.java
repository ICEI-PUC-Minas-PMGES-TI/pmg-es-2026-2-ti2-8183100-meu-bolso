package Projeto.MeuBolso.whatsapp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Operações de negócio que o fluxo do chatbot precisa. Separar isso numa
 * interface deixa o {@link FluxoChatbot} independente de Mongo/Spring e
 * testável com uma implementação em memória.
 *
 * Erros de regra (saldo insuficiente, meta inexistente...) são lançados como
 * ResponseStatusException, a mesma convenção dos services do site; o fluxo
 * mostra o motivo ao usuário.
 */
public interface OperacoesChatbot {

    /** Metas do usuário. `valor` = valor guardado; `detalhe` = progresso. */
    List<Opcao> metas(String usuarioId);

    /** Contas bancárias do usuário. `valor` = saldo. */
    List<Opcao> contas(String usuarioId);

    /** Onde uma receita/gasto pode entrar/sair: contas, cartões e dinheiro (igual ao site). */
    List<Opcao> carteirasDeLancamento(String usuarioId);

    void registrarReceita(String usuarioId, BigDecimal valor, String categoria, String descricao, Opcao carteira, LocalDate data);

    void registrarGasto(String usuarioId, BigDecimal valor, String categoria, String descricao, Opcao carteira, LocalDate data);

    /** Deposita (deposito=true) ou retira da meta. Retorna o novo valor guardado. */
    BigDecimal movimentarMeta(String usuarioId, String metaId, boolean deposito, BigDecimal valor, String contaId);

    void transferir(String usuarioId, String origemId, String destinoId, BigDecimal valor);

    LocalDate hoje();
}
