package Projeto.MeuBolso.assistente;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import Projeto.MeuBolso.model.Recorrencia;
import Projeto.MeuBolso.repository.RecorrenciaRepository;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class RecorrenciasPerguntaTest {

    private static final String USUARIO = "u1";
    private static final ZoneId ZONA = ZoneId.of("America/Sao_Paulo");
    // 15/03/2026 -> hoje = 15/03/2026, mês atual = março/2026.
    private static final Clock CLOCK =
        Clock.fixed(Instant.parse("2026-03-15T12:00:00Z"), ZONA);

    @Mock
    RecorrenciaRepository recorrenciaRepository;

    private RecorrenciasPergunta perguntaCom(Clock clock, Recorrencia... recorrencias) {
        when(recorrenciaRepository.findByUsuarioId(USUARIO)).thenReturn(List.of(recorrencias));
        return new RecorrenciasPergunta(recorrenciaRepository, clock);
    }

    private static Recorrencia rec(String descricao, String valor, int dia, boolean ativa) {
        return new Recorrencia(USUARIO, descricao, "Cat", "c", new BigDecimal(valor), "", dia, ativa, null);
    }

    private static Recorrencia netflix() {
        return rec("Netflix", "55.90", 20, true);
    }

    private static Recorrencia academia() {
        return rec("Academia", "120.00", 10, true);
    }

    private static Recorrencia spotifyInativo() {
        return rec("Spotify", "21.90", 5, false);
    }

    @Test
    void indisponivelSemRecorrencias() {
        RecorrenciasPergunta pergunta = new RecorrenciasPergunta(recorrenciaRepository, CLOCK);
        when(recorrenciaRepository.findByUsuarioId(USUARIO)).thenReturn(List.of());
        assertThat(pergunta.disponivel(USUARIO)).isFalse();
    }

    @Test
    void indisponivelSoComInativas() {
        RecorrenciasPergunta pergunta = perguntaCom(CLOCK, spotifyInativo());
        assertThat(pergunta.disponivel(USUARIO)).isFalse();
    }

    @Test
    void disponivelComAtiva() {
        RecorrenciasPergunta pergunta = perguntaCom(CLOCK, netflix(), spotifyInativo());
        assertThat(pergunta.disponivel(USUARIO)).isTrue();
    }

    @Test
    void totaisEMaiorConsideramSoAtivas() {
        RecorrenciasPergunta pergunta = perguntaCom(CLOCK, netflix(), academia(), spotifyInativo());

        RespostaPronta r = pergunta.responder(USUARIO, Map.of());

        assertThat(r.dados().get("quantidade")).isEqualTo(2);
        assertThat((BigDecimal) r.dados().get("totalMensal")).isEqualByComparingTo("175.90");
        assertThat((BigDecimal) r.dados().get("totalAnual")).isEqualByComparingTo("2110.80");

        @SuppressWarnings("unchecked")
        Map<String, Object> maior = (Map<String, Object>) r.dados().get("maior");
        assertThat(maior.get("nome")).isEqualTo("Academia");
        assertThat((BigDecimal) maior.get("valor")).isEqualByComparingTo("120.00");

        assertThat(r.texto())
            .contains("2 gastos recorrentes ativos")
            .contains(FormatoBRL.moeda(new BigDecimal("175.90")))
            .contains(FormatoBRL.moeda(new BigDecimal("2110.80")))
            .contains("Academia");
    }

    @Test
    void proximasOrdenadasPorData() {
        RecorrenciasPergunta pergunta = perguntaCom(CLOCK, netflix(), academia(), spotifyInativo());

        RespostaPronta r = pergunta.responder(USUARIO, Map.of());

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> proximas = (List<Map<String, Object>>) r.dados().get("proximas");
        assertThat(proximas).hasSize(2);
        // Netflix cai dia 20/03 (ainda neste mês); Academia dia 10 já passou -> 10/04.
        assertThat(proximas.get(0).get("nome")).isEqualTo("Netflix");
        assertThat(proximas.get(0).get("data")).isEqualTo("2026-03-20");
        assertThat(proximas.get(1).get("nome")).isEqualTo("Academia");
        assertThat(proximas.get(1).get("data")).isEqualTo("2026-04-10");
    }

    @Test
    void mesPuladoAdiaParaOProximoMes() {
        Recorrencia netflix = netflix();
        netflix.setMesesPulados(List.of("2026-03"));
        RecorrenciasPergunta pergunta = perguntaCom(CLOCK, netflix);

        RespostaPronta r = pergunta.responder(USUARIO, Map.of());

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> proximas = (List<Map<String, Object>>) r.dados().get("proximas");
        assertThat(proximas).hasSize(1);
        assertThat(proximas.get(0).get("data")).isEqualTo("2026-04-20");
    }

    @Test
    void dia31AjustaParaUltimoDiaDoMes() {
        // Clock em 15/02/2026: fevereiro tem 28 dias, então dia 31 vira 28/02.
        Clock fevereiro = Clock.fixed(Instant.parse("2026-02-15T12:00:00Z"), ZONA);
        RecorrenciasPergunta pergunta = perguntaCom(fevereiro, rec("Conta", "100.00", 31, true));

        RespostaPronta r = pergunta.responder(USUARIO, Map.of());

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> proximas = (List<Map<String, Object>>) r.dados().get("proximas");
        assertThat(proximas.get(0).get("data")).isEqualTo("2026-02-28");
    }
}
