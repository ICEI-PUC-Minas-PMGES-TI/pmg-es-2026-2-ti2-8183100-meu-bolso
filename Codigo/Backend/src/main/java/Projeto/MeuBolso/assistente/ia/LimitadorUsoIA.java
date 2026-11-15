package Projeto.MeuBolso.assistente.ia;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Limites de uso do chat do Jarvis, para caber na cota do Gemine (free tier).
 *
 * Três janelas, checadas nesta ordem a cada mensagem: por minuto (global),
 * por dia (global) e por dia (do usuário). A primeira que estourar lança
 * {@link LimiteUsoException} sem consumir nada; se todas passarem, consome nos
 * três contadores.
 *
 * Estado só em memória (ConcurrentHashMap + métodos synchronized): o contador
 * zera ao reiniciar o back, o que é aceitável para o protótipo. O dia do
 * usuário segue a zona America/Sao_Paulo; o dia global segue America/Los_Angeles
 * (onde a cota diária do Gemini vira à meia-noite).
 */
@Component
public class LimitadorUsoIA {

    private static final String MSG_USUARIO =
        "Você atingiu o limite de %d mensagens do Jarvis hoje. Use as perguntas rápidas ou volte amanhã.";
    private static final String MSG_GLOBAL_DIA =
        "O Jarvis atingiu o limite de uso de hoje. Use as perguntas rápidas e tente novamente amanhã.";
    private static final String MSG_GLOBAL_MINUTO =
        "O Jarvis está com muitas mensagens agora. Tente de novo em alguns instantes.";

    private final Clock clock;
    private final int limiteDiarioUsuario;
    private final int limiteDiarioGlobal;
    private final int limitePorMinutoGlobal;
    private final ZoneId zonaUsuario;
    private final ZoneId zonaGlobal;

    // Contador por usuário no dia corrente (da zona do usuário).
    private final ConcurrentHashMap<String, ContadorDia> porUsuario = new ConcurrentHashMap<>();
    // Contador global do dia corrente (da zona global).
    private final ContadorDia global = new ContadorDia();
    // Instantes das mensagens recentes, para a janela deslizante de 60s.
    private final Deque<Instant> janelaMinuto = new ArrayDeque<>();

    public LimitadorUsoIA(Clock clock,
                          @Value("${app.ia.limite-diario-usuario:15}") int limiteDiarioUsuario,
                          @Value("${app.ia.limite-diario-global:450}") int limiteDiarioGlobal,
                          @Value("${app.ia.limite-por-minuto-global:12}") int limitePorMinutoGlobal,
                          @Value("${app.ia.zona-usuario:America/Sao_Paulo}") String zonaUsuario,
                          @Value("${app.ia.zona-global:America/Los_Angeles}") String zonaGlobal) {
        this.clock = clock;
        this.limiteDiarioUsuario = limiteDiarioUsuario;
        this.limiteDiarioGlobal = limiteDiarioGlobal;
        this.limitePorMinutoGlobal = limitePorMinutoGlobal;
        this.zonaUsuario = ZoneId.of(zonaUsuario);
        this.zonaGlobal = ZoneId.of(zonaGlobal);
    }

    /** Contador de um dia: guarda a data de referência e quantos usos houve nela. */
    private static final class ContadorDia {
        private LocalDate dia;
        private int usos;
    }

    /**
     * Registra uma mensagem e devolve quantas ainda restam ao usuário hoje.
     * Lança {@link LimiteUsoException} (sem consumir) quando algum limite estoura.
     */
    public synchronized int registrarUso(String usuarioId) {
        Instant agora = clock.instant();
        LocalDate hojeUsuario = LocalDate.now(clock.withZone(zonaUsuario));
        LocalDate hojeGlobal = LocalDate.now(clock.withZone(zonaGlobal));

        // 1) Por minuto (global): janela deslizante de 60s.
        limparJanela(agora);
        if (janelaMinuto.size() >= limitePorMinutoGlobal) {
            throw new LimiteUsoException(MSG_GLOBAL_MINUTO);
        }

        // 2) Por dia (global).
        int usosGlobal = usosNoDia(global, hojeGlobal);
        if (usosGlobal >= limiteDiarioGlobal) {
            throw new LimiteUsoException(MSG_GLOBAL_DIA);
        }

        // 3) Por dia (do usuário).
        ContadorDia contador = porUsuario.computeIfAbsent(usuarioId, k -> new ContadorDia());
        int usosUsuario = usosNoDia(contador, hojeUsuario);
        if (usosUsuario >= limiteDiarioUsuario) {
            throw new LimiteUsoException(String.format(MSG_USUARIO, limiteDiarioUsuario));
        }

        // Passou nas três: consome nos três contadores.
        janelaMinuto.addLast(agora);
        global.usos = usosGlobal + 1;
        contador.usos = usosUsuario + 1;
        return limiteDiarioUsuario - contador.usos;
    }

    /** Quantas mensagens ainda restam ao usuário hoje, sem consumir. */
    public synchronized int restantes(String usuarioId) {
        LocalDate hojeUsuario = LocalDate.now(clock.withZone(zonaUsuario));
        ContadorDia contador = porUsuario.get(usuarioId);
        if (contador == null) {
            return limiteDiarioUsuario;
        }
        int usos = hojeUsuario.equals(contador.dia) ? contador.usos : 0;
        return limiteDiarioUsuario - usos;
    }

    /** Usos de um contador no dia informado, zerando se for de um dia anterior. */
    private int usosNoDia(ContadorDia contador, LocalDate hoje) {
        if (!hoje.equals(contador.dia)) {
            contador.dia = hoje;
            contador.usos = 0;
        }
        return contador.usos;
    }

    /** Remove da janela os instantes com mais de 60s. */
    private void limparJanela(Instant agora) {
        Instant corte = agora.minusSeconds(60);
        while (!janelaMinuto.isEmpty() && !janelaMinuto.peekFirst().isAfter(corte)) {
            janelaMinuto.pollFirst();
        }
    }
}
