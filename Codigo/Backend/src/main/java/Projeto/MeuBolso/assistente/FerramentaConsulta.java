package Projeto.MeuBolso.assistente;

import java.util.List;
import java.util.Map;

/**
 * Uma ferramenta de consulta exclusiva do chat do Jarvis.
 *
 * Diferente de {@link PerguntaPronta}, não vira card das perguntas rápidas:
 * só é oferecida ao modelo (function calling) e executada quando ele a escolhe.
 * O {@link ChatService} descobre todas as implementações por injeção de lista.
 */
public interface FerramentaConsulta {

    String id();

    String descricao();

    boolean disponivel(String usuarioId);

    /** Parâmetros exigidos para executar. Vazio por padrão (consulta sem parâmetros). */
    default List<ParametroPergunta> parametros(String usuarioId) {
        return List.of();
    }

    RespostaPronta executar(String usuarioId, Map<String, String> params);
}
