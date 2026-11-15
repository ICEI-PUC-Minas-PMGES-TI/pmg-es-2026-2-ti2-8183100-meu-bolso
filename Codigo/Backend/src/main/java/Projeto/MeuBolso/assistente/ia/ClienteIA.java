package Projeto.MeuBolso.assistente.ia;

import java.util.List;

/**
 * Abstração do provedor de IA (hoje o Gemini).
 *
 * Implementações lançam {@link IaIndisponivelException} quando não conseguem
 * produzir uma resposta.
 */
public interface ClienteIA {

    /**
     * Gera uma resposta a partir de uma instrução de sistema, do histórico da
     * conversa e das ferramentas disponíveis. O modelo pode responder em texto
     * ou escolher chamar uma das ferramentas (ver {@link ResultadoIA}).
     */
    ResultadoIA gerarComFerramentas(String instrucaoSistema,
                                    List<MensagemChat> historico,
                                    List<FerramentaIA> ferramentas);
}
