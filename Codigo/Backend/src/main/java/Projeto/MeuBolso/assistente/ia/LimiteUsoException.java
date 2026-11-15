package Projeto.MeuBolso.assistente.ia;

/**
 * Um limite de uso do chat foi atingido (por usuário/dia, global/dia ou
 * global/minuto). A mensagem já é amigável e pode ir direto ao usuário.
 */
public class LimiteUsoException extends RuntimeException {

    public LimiteUsoException(String mensagem) {
        super(mensagem);
    }
}
