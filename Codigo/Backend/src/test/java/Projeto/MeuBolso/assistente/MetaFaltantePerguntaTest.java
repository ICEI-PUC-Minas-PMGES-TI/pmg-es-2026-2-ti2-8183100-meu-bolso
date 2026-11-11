package Projeto.MeuBolso.assistente;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import Projeto.MeuBolso.model.Meta;
import Projeto.MeuBolso.repository.MetaRepository;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class MetaFaltantePerguntaTest {

    private static final String USUARIO = "u1";
    private static final String META_ID = "m1";
    private static final ZoneId ZONA = ZoneId.systemDefault();
    // Hoje = 20/11/2026.
    private static final Clock CLOCK = Clock.fixed(
        LocalDate.of(2026, 11, 20).atStartOfDay(ZONA).toInstant(), ZONA);

    @Mock
    MetaRepository metaRepository;

    MetaFaltantePergunta pergunta;

    @BeforeEach
    void preparar() {
        pergunta = new MetaFaltantePergunta(metaRepository, CLOCK);
    }

    private static Meta meta(String nome, String alvo, String atual, LocalDate prazo) {
        Meta m = new Meta(USUARIO, nome, new BigDecimal(alvo), prazo, "alta");
        m.setId(META_ID);
        m.setValorAtual(new BigDecimal(atual));
        return m;
    }

    private void existe(Meta m) {
        when(metaRepository.findByIdAndUsuarioId(META_ID, USUARIO)).thenReturn(Optional.of(m));
    }

    private RespostaPronta responder() {
        return pergunta.responder(USUARIO, Map.of("metaId", META_ID));
    }

    @Test
    void emAndamentoArredondaParaCima() {
        // 100 faltando em 3 meses -> 33,34; prazo 20/02/2027 (3 meses à frente).
        existe(meta("Viagem", "100", "0", LocalDate.of(2027, 2, 20)));
        RespostaPronta r = responder();
        assertThat(r.dados().get("situacao")).isEqualTo("em_andamento");
        assertThat(r.dados().get("mesesRestantes")).isEqualTo(3);
        assertThat((BigDecimal) r.dados().get("porMes")).isEqualByComparingTo("33.34");
    }

    @Test
    void emAndamentoTextoEPlural() {
        existe(meta("Viagem", "1000", "400", LocalDate.of(2027, 2, 20)));
        RespostaPronta r = responder();
        assertThat(r.dados().get("mesesRestantes")).isEqualTo(3);
        assertThat(r.texto()).contains("3 meses").contains("faltam " + FormatoBRL.moeda(new BigDecimal("600")));
    }

    @Test
    void prazoHojeEhUmMes() {
        existe(meta("Viagem", "1000", "400", LocalDate.of(2026, 11, 20)));
        RespostaPronta r = responder();
        assertThat(r.dados().get("situacao")).isEqualTo("em_andamento");
        assertThat(r.dados().get("mesesRestantes")).isEqualTo(1);
        assertThat((BigDecimal) r.dados().get("porMes")).isEqualByComparingTo("600.00");
        assertThat(r.texto())
            .isEqualTo("Para a meta \"Viagem\" faltam " + FormatoBRL.moeda(new BigDecimal("600"))
                + " (40% já guardado: " + FormatoBRL.moeda(new BigDecimal("400")) + " de "
                + FormatoBRL.moeda(new BigDecimal("1000")) + "). Até 20/11 são 1 mês: guarde "
                + FormatoBRL.moeda(new BigDecimal("600.00")) + " por mês.");
    }

    @Test
    void semPrazo() {
        existe(meta("Viagem", "1000", "400", null));
        RespostaPronta r = responder();
        assertThat(r.dados().get("situacao")).isEqualTo("sem_prazo");
        assertThat(r.dados().get("mesesRestantes")).isNull();
        assertThat(r.dados().get("porMes")).isNull();
        assertThat(r.dados().get("prazo")).isNull();
        assertThat(r.texto())
            .isEqualTo("Para a meta \"Viagem\" faltam " + FormatoBRL.moeda(new BigDecimal("600"))
                + " (você já guardou " + FormatoBRL.moeda(new BigDecimal("400")) + " de "
                + FormatoBRL.moeda(new BigDecimal("1000")) + ", 40%). "
                + "Defina um prazo para eu calcular quanto guardar por mês.");
    }

    @Test
    void atingida() {
        existe(meta("Viagem", "1000", "1000", LocalDate.of(2027, 1, 1)));
        RespostaPronta r = responder();
        assertThat(r.dados().get("situacao")).isEqualTo("atingida");
        assertThat((BigDecimal) r.dados().get("faltante")).isEqualByComparingTo("0");
        assertThat(r.texto())
            .isEqualTo("Parabéns! Você já atingiu a meta \"Viagem\": "
                + FormatoBRL.moeda(new BigDecimal("1000")) + " de " + FormatoBRL.moeda(new BigDecimal("1000")) + ".");
    }

    @Test
    void atingidaAcimaDe100PorCento() {
        existe(meta("Viagem", "1000", "1200", null));
        RespostaPronta r = responder();
        assertThat(r.dados().get("situacao")).isEqualTo("atingida");
        assertThat(r.dados().get("percentual")).isEqualTo(120);
        assertThat((BigDecimal) r.dados().get("faltante")).isEqualByComparingTo("0");
    }

    @Test
    void vencida() {
        existe(meta("Viagem", "1000", "400", LocalDate.of(2026, 10, 15)));
        RespostaPronta r = responder();
        assertThat(r.dados().get("situacao")).isEqualTo("vencida");
        assertThat(r.texto())
            .isEqualTo("O prazo da meta \"Viagem\" já passou (15/10) e ainda faltam "
                + FormatoBRL.moeda(new BigDecimal("600")) + ".");
    }

    @Test
    void parametrosListaSoAsMetasDoUsuario() {
        Meta m1 = meta("Viagem", "1000", "400", null);
        Meta m2 = new Meta(USUARIO, "Carro", new BigDecimal("5000"), null, "media");
        m2.setId("m2");
        when(metaRepository.findByUsuarioId(USUARIO)).thenReturn(List.of(m1, m2));

        List<ParametroPergunta> params = pergunta.parametros(USUARIO);
        assertThat(params).hasSize(1);
        ParametroPergunta p = params.get(0);
        assertThat(p.nome()).isEqualTo("metaId");
        assertThat(p.tipo()).isEqualTo("opcao");
        assertThat(p.opcoes()).extracting(OpcaoParametro::valor).containsExactly(META_ID, "m2");
        assertThat(p.opcoes()).extracting(OpcaoParametro::rotulo).containsExactly("Viagem", "Carro");
    }

    @Test
    void indisponivelSemMetas() {
        when(metaRepository.findByUsuarioId(USUARIO)).thenReturn(List.of());
        assertThat(pergunta.disponivel(USUARIO)).isFalse();
    }
}
