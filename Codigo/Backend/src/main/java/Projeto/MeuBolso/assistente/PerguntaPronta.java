package Projeto.MeuBolso.assistente;

import java.util.List;
import java.util.Map;

/**
 * Uma pergunta pronta do assistente (ETAPA 1: ainda sem IA).
 *
 * Cada pergunta sabe se está disponível para um usuário e como se responder,
 * usando apenas dados do próprio usuário. O {@link AssistenteService} descobre
 * todas as implementações por injeção de lista.
 */
public interface PerguntaPronta {

    String id();

    String texto();

    boolean disponivel(String usuarioId);

    RespostaPronta responder(String usuarioId, Map<String, String> params);

    /** Parâmetros exigidos para responder. Vazio por padrão (pergunta sem parâmetros). */
    default List<ParametroPergunta> parametros(String usuarioId) {
        return List.of();
    }
}
