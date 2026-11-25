package Projeto.MeuBolso.whatsapp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

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

    /**
     * Contas bancárias do usuário. `valor` = saldo. São as únicas carteiras
     * aceitas em receitas, gastos, metas e transferências (mesma regra do site).
     */
    List<Opcao> contas(String usuarioId);

    void registrarReceita(String usuarioId, BigDecimal valor, String categoria, String descricao, Opcao carteira, LocalDate data);

    void registrarGasto(String usuarioId, BigDecimal valor, String categoria, String descricao, Opcao carteira, LocalDate data);

    /** Deposita (deposito=true) ou retira da meta. Retorna o novo valor guardado. */
    BigDecimal movimentarMeta(String usuarioId, String metaId, boolean deposito, BigDecimal valor, String contaId);

    /**
     * Aviso para a tela de confirmação quando a retirada deixa a reserva de
     * emergência abaixo do mínimo (mesma regra da confirmação do site).
     * Vazio para as demais metas ou quando o mínimo não é furado.
     */
    default Optional<String> avisoRetirada(String usuarioId, String metaId, BigDecimal valor) {
        return Optional.empty();
    }

    void transferir(String usuarioId, String origemId, String destinoId, BigDecimal valor);

    LocalDate hoje();
}
