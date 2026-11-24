package Projeto.MeuBolso.Config;

import static org.junit.jupiter.api.Assertions.assertEquals;

import Projeto.MeuBolso.service.GastoRecorrenciaService;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import org.junit.jupiter.api.Test;

/**
 * Garante que o "hoje" do sistema é o do Brasil, mesmo com o servidor em UTC.
 */
class FusoHorarioTest {

    // 23/11/2026 às 23:30 em Brasília = 24/11/2026 às 02:30 em UTC.
    private static final Instant NOITE_NO_BRASIL = Instant.parse("2026-11-24T02:30:00Z");

    @Test
    void zonaDeReferenciaEhBrasilia() {
        assertEquals("America/Sao_Paulo", FusoHorario.ZONA.getId());
    }

    @Test
    void clockInjetadoUsaOFusoDoBrasil() {
        Clock clock = new ClockConfig().clock();
        assertEquals(FusoHorario.ZONA, clock.getZone());
    }

    @Test
    void depoisDas21hNoBrasilAindaEhOMesmoDia() {
        // Em UTC (fuso comum de servidor) já seria dia 24...
        assertEquals(LocalDate.of(2026, 11, 24), LocalDate.ofInstant(NOITE_NO_BRASIL, ZoneOffset.UTC));
        // ...mas no fuso do sistema continua sendo dia 23.
        assertEquals(LocalDate.of(2026, 11, 23), LocalDate.now(Clock.fixed(NOITE_NO_BRASIL, FusoHorario.ZONA)));
    }

    @Test
    void viradaDeMesSegueOBrasil() {
        // 30/11 às 22:00 em Brasília = 01/12 01:00 UTC: o mês atual ainda é novembro.
        Instant ultimaNoiteDoMes = Instant.parse("2026-12-01T01:00:00Z");
        LocalDate hoje = LocalDate.now(Clock.fixed(ultimaNoiteDoMes, FusoHorario.ZONA));
        assertEquals("2026-11", hoje.toString().substring(0, 7));
    }

    @Test
    void hojeIsoDasRecorrenciasUsaOFusoDoBrasil() {
        assertEquals(LocalDate.now(FusoHorario.ZONA).toString(), GastoRecorrenciaService.hojeIso());
        assertEquals(FusoHorario.hoje().toString().substring(0, 7), GastoRecorrenciaService.mesAtualChave());
    }
}
