package Projeto.MeuBolso.service;

import static org.assertj.core.api.Assertions.assertThat;

import Projeto.MeuBolso.model.Gasto;
import Projeto.MeuBolso.model.MovimentacaoDtos.MovimentacaoResponse;
import Projeto.MeuBolso.model.MovimentacaoMeta;
import Projeto.MeuBolso.model.Receita;
import Projeto.MeuBolso.model.Transferencia;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

/** Junção das quatro fontes do histórico (função pura, sem banco nem mocks). */
class MovimentacaoServiceTest {

    private static final ZoneId SP = ZoneId.of("America/Sao_Paulo");

    @Test
    void gastoSaiEReceitaEntra() {
        List<MovimentacaoResponse> r = MovimentacaoService.unificar(
            List.of(gasto("g1", "Mercado", "2026-11-05", "50", "inter")),
            List.of(receita("r1", "Salário", "2026-11-06", "3000", "inter")),
            List.of(), Map.of(), List.of(), SP);

        assertThat(r).extracting(MovimentacaoResponse::id).containsExactly("receita-r1", "gasto-g1");
        MovimentacaoResponse receita = r.get(0);
        assertThat(receita.entrada()).isTrue();
        assertThat(receita.valor()).isEqualByComparingTo("3000");
        assertThat(receita.categoria()).isEqualTo("Salário");
        MovimentacaoResponse gasto = r.get(1);
        assertThat(gasto.entrada()).isFalse();
        assertThat(gasto.valor()).isEqualByComparingTo("-50");
        assertThat(gasto.carteiraId()).isEqualTo("inter");
    }

    @Test
    void depositoNaMetaSaiDaContaERetiradaEntra() {
        // 2026-11-07T15:00Z = 12h em São Paulo (mesmo dia).
        MovimentacaoMeta deposito = movMeta("m1", "meta-1", "deposito", "100", "inter", "2026-11-07T15:00:00Z");
        MovimentacaoMeta retirada = movMeta("m2", "meta-1", "retirada", "40", "inter", "2026-11-08T15:00:00Z");

        List<MovimentacaoResponse> r = MovimentacaoService.unificar(
            List.of(), List.of(), List.of(deposito, retirada), Map.of("meta-1", "Viagem"), List.of(), SP);

        assertThat(r).extracting(MovimentacaoResponse::descricao)
            .containsExactly("Retirada da meta Viagem", "Depósito na meta Viagem");
        assertThat(r.get(0).entrada()).isTrue();
        assertThat(r.get(0).valor()).isEqualByComparingTo("40");
        assertThat(r.get(1).entrada()).isFalse();
        assertThat(r.get(1).valor()).isEqualByComparingTo("-100");
        assertThat(r.get(1).data()).isEqualTo("2026-11-07");
        assertThat(r.get(1).categoria()).isEqualTo("Meta");
    }

    @Test
    void metaExcluidaContinuaNoHistorico() {
        List<MovimentacaoResponse> r = MovimentacaoService.unificar(
            List.of(), List.of(),
            List.of(movMeta("m1", "sumiu", "deposito", "10", "inter", "2026-11-07T15:00:00Z")),
            Map.of(), List.of(), SP);
        assertThat(r.get(0).descricao()).isEqualTo("Depósito na meta excluída");
    }

    @Test
    void transferenciaGeraSaidaNaOrigemEEntradaNoDestino() {
        Transferencia t = new Transferencia("u1", "inter", "Inter", "nubank", "Nubank",
            new BigDecimal("200"), Instant.parse("2026-11-09T18:00:00Z"));
        t.setId("t1");

        List<MovimentacaoResponse> r = MovimentacaoService.unificar(
            List.of(), List.of(), List.of(), Map.of(), List.of(t), SP);

        assertThat(r).hasSize(2);
        MovimentacaoResponse saida = r.stream().filter(m -> m.carteiraId().equals("inter")).findFirst().orElseThrow();
        MovimentacaoResponse entrada = r.stream().filter(m -> m.carteiraId().equals("nubank")).findFirst().orElseThrow();
        assertThat(saida.descricao()).isEqualTo("Transferência para Nubank");
        assertThat(saida.valor()).isEqualByComparingTo("-200");
        assertThat(saida.entrada()).isFalse();
        assertThat(entrada.descricao()).isEqualTo("Transferência de Inter");
        assertThat(entrada.valor()).isEqualByComparingTo("200");
        assertThat(entrada.entrada()).isTrue();
        assertThat(saida.data()).isEqualTo("2026-11-09");
        assertThat(saida.id()).isNotEqualTo(entrada.id());
    }

    @Test
    void ordenaPorDataDoMaisRecenteParaOMaisAntigo() {
        List<MovimentacaoResponse> r = MovimentacaoService.unificar(
            List.of(gasto("g1", "Antigo", "2026-10-01", "1", "inter"),
                    gasto("g2", "Novo", "2026-11-09", "1", "inter")),
            List.of(receita("r1", "Meio", "2026-11-01", "1", "inter")),
            List.of(movMeta("m1", "meta-1", "deposito", "1", "inter", "2026-11-05T15:00:00Z")),
            Map.of("meta-1", "Viagem"), List.of(), SP);

        assertThat(r).extracting(MovimentacaoResponse::data)
            .containsExactly("2026-11-09", "2026-11-05", "2026-11-01", "2026-10-01");
    }

    @Test
    void dataDaMetaUsaOFusoDoUsuario() {
        // 2026-11-08T01:30Z ainda é dia 07 em São Paulo (UTC-3).
        List<MovimentacaoResponse> r = MovimentacaoService.unificar(
            List.of(), List.of(),
            List.of(movMeta("m1", "meta-1", "deposito", "10", "inter", "2026-11-08T01:30:00Z")),
            Map.of("meta-1", "Viagem"), List.of(), SP);
        assertThat(r.get(0).data()).isEqualTo("2026-11-07");
    }

    // ---------- auxiliares ----------

    private static Gasto gasto(String id, String descricao, String data, String valor, String carteiraId) {
        Gasto g = new Gasto("u1", descricao, "Alimentação", "Inter", data, new BigDecimal(valor), "", null);
        g.setId(id);
        g.setCarteiraId(carteiraId);
        return g;
    }

    private static Receita receita(String id, String descricao, String data, String valor, String carteiraId) {
        Receita r = new Receita("u1", descricao, "Salário", "Inter", data, new BigDecimal(valor), "", null);
        r.setId(id);
        r.setCarteiraId(carteiraId);
        return r;
    }

    private static MovimentacaoMeta movMeta(String id, String metaId, String tipo, String valor,
                                            String carteiraId, String instante) {
        MovimentacaoMeta m = new MovimentacaoMeta("u1", metaId, carteiraId, tipo, new BigDecimal(valor), "");
        m.setId(id);
        m.setData(Instant.parse(instante));
        return m;
    }
}
