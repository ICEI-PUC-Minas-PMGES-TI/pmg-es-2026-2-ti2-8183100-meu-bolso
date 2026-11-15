package Projeto.MeuBolso.assistente.ia;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import org.junit.jupiter.api.Test;

class LimitadorUsoIATest {

    private static final String SP = "America/Sao_Paulo";
    private static final String LA = "America/Los_Angeles";

    // Clock controlável: começa num instante fixo e avança sob demanda no teste.
    private static final class ClockMutavel extends Clock {
        private Instant agora;
        private final ZoneId zona;

        ClockMutavel(Instant inicio, ZoneId zona) {
            this.agora = inicio;
            this.zona = zona;
        }

        void avancar(java.time.Duration d) { this.agora = this.agora.plus(d); }

        @Override public ZoneId getZone() { return zona; }
        @Override public Clock withZone(ZoneId z) {
            // Mesmo instante (por referência ao outer), mas noutra zona.
            return new Clock() {
                @Override public ZoneId getZone() { return z; }
                @Override public Clock withZone(ZoneId z2) { return this; }
                @Override public Instant instant() { return ClockMutavel.this.agora; }
            };
        }
        @Override public Instant instant() { return agora; }
    }

    private ClockMutavel clock;

    private LimitadorUsoIA limitador(int usuario, int global, int minuto) {
        // Meio-dia UTC de um dia qualquer: mesma data em SP e LA.
        clock = new ClockMutavel(Instant.parse("2026-06-15T12:00:00Z"), ZoneId.of("UTC"));
        return new LimitadorUsoIA(clock, usuario, global, minuto, SP, LA);
    }

    @Test
    void limitePorUsuarioO16Estoura() {
        LimitadorUsoIA lim = limitador(15, 450, 1000);
        for (int i = 0; i < 15; i++) {
            lim.registrarUso("u1");
        }
        assertThat(lim.restantes("u1")).isZero();
        assertThrows(LimiteUsoException.class, () -> lim.registrarUso("u1"));
        // Falha não avança o contador: segue zerado.
        assertThat(lim.restantes("u1")).isZero();
    }

    @Test
    void outroUsuarioNaoEAfetado() {
        LimitadorUsoIA lim = limitador(15, 450, 1000);
        for (int i = 0; i < 15; i++) {
            lim.registrarUso("u1");
        }
        assertThat(lim.restantes("u2")).isEqualTo(15);
        assertThat(lim.registrarUso("u2")).isEqualTo(14);
    }

    @Test
    void limiteGlobalDiario() {
        LimitadorUsoIA lim = limitador(1000, 3, 1000);
        lim.registrarUso("a");
        lim.registrarUso("b");
        lim.registrarUso("c");
        assertThrows(LimiteUsoException.class, () -> lim.registrarUso("d"));
    }

    @Test
    void novoDiaDaZonaDoUsuarioZeraOUsuario() {
        LimitadorUsoIA lim = limitador(2, 450, 1000);
        lim.registrarUso("u1");
        lim.registrarUso("u1");
        assertThat(lim.restantes("u1")).isZero();

        // Avança 24h: vira o dia em SP, o contador do usuário zera.
        clock.avancar(java.time.Duration.ofHours(24));
        assertThat(lim.restantes("u1")).isEqualTo(2);
        assertThat(lim.registrarUso("u1")).isEqualTo(1);
    }

    @Test
    void limitePorMinutoDeslizante() {
        LimitadorUsoIA lim = limitador(1000, 450, 12);
        for (int i = 0; i < 12; i++) {
            lim.registrarUso("u1");
        }
        // 13ª no mesmo minuto estoura.
        assertThrows(LimiteUsoException.class, () -> lim.registrarUso("u1"));
        // Depois de 61s a janela abre de novo.
        clock.avancar(java.time.Duration.ofSeconds(61));
        assertThat(lim.registrarUso("u1")).isPositive();
    }

    @Test
    void restantesDiminuiACadaUso() {
        LimitadorUsoIA lim = limitador(5, 450, 1000);
        assertThat(lim.registrarUso("u1")).isEqualTo(4);
        assertThat(lim.registrarUso("u1")).isEqualTo(3);
        assertThat(lim.restantes("u1")).isEqualTo(3);
    }

    @Test
    void checagemPorMinutoVenceADiariaNadaConsumido() {
        // Minuto estoura antes do dia: a falha por minuto não pode consumir
        // o contador diário do usuário.
        LimitadorUsoIA lim = limitador(1000, 450, 2);
        lim.registrarUso("u1");
        lim.registrarUso("u1");
        assertThat(lim.restantes("u1")).isEqualTo(998);

        assertThrows(LimiteUsoException.class, () -> lim.registrarUso("u1"));
        assertThat(lim.restantes("u1")).isEqualTo(998);
    }
}
