package Projeto.MeuBolso.assistente.ia;

/**
 * A IA não respondeu (não configurada, erro HTTP, timeout ou resposta sem texto).
 *
 * {@code limiteAtingido} indica o caso específico de cota/limite (HTTP 429),
 * tratado com uma mensagem própria para o usuário.
 */
public class IaIndisponivelException extends RuntimeException {

    private final boolean limiteAtingido;

    public IaIndisponivelException(String mensagem) {
        this(mensagem, false);
    }

    public IaIndisponivelException(String mensagem, boolean limiteAtingido) {
        super(mensagem);
        this.limiteAtingido = limiteAtingido;
    }

    public boolean isLimiteAtingido() {
        return limiteAtingido;
    }
}
