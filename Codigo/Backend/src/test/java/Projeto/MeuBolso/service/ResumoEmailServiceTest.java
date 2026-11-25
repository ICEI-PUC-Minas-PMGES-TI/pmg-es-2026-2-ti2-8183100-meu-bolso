package Projeto.MeuBolso.service;

import static org.assertj.core.api.Assertions.assertThat;

import Projeto.MeuBolso.model.ResumoSemanalDtos.OrcamentoUso;
import Projeto.MeuBolso.model.ResumoSemanalDtos.ReservaResumo;
import Projeto.MeuBolso.model.ResumoSemanalDtos.Resumo;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.web.util.HtmlUtils;

/**
 * Texto e HTML do e-mail do resumo semanal, com foco na seção da reserva de
 * emergência. As funções de montagem são estáticas: não precisam de mocks.
 */
class ResumoEmailServiceTest {

    private static final String LINK = "http://localhost:5173/resumo-semanal/cancelar?token=abc";
    // Título da seção como sai no HTML (acentos escapados).
    private static final String TITULO_HTML = HtmlUtils.htmlEscape("Reserva de emergência:");

    private static Resumo resumo(ReservaResumo reserva) {
        return new Resumo(
            LocalDate.of(2026, 11, 18), LocalDate.of(2026, 11, 24),
            BigDecimal.ZERO, 0, List.of(),
            new OrcamentoUso(BigDecimal.ZERO, BigDecimal.ZERO, 0),
            List.of(), List.of(), reserva);
    }

    @Test
    void textoMostraASecaoDaReservaComAMensagem() {
        String texto = ResumoEmailService.montarTexto("Ana", resumo(
            new ReservaResumo("Reserva", "critica", "Perigo: sua reserva só cobre 15 dias de gastos.")), LINK);

        assertThat(texto).contains("Reserva de emergência:\n- Perigo: sua reserva só cobre 15 dias de gastos.");
    }

    @Test
    void semReservaConfiguradaOTextoMostraOConvite() {
        String convite = "Você ainda não configurou sua reserva de emergência. Comece pela página de Metas.";
        String texto = ResumoEmailService.montarTexto("Ana", resumo(
            new ReservaResumo(null, "sem_reserva", convite)), LINK);
        String html = ResumoEmailService.montarHtml("Ana", resumo(
            new ReservaResumo(null, "sem_reserva", convite)), LINK);

        assertThat(texto).contains("Reserva de emergência:\n- " + convite);
        // No HTML os acentos viram entidades (ã -> &atilde;), por isso a comparação escapa igual.
        assertThat(html).contains(TITULO_HTML).contains(HtmlUtils.htmlEscape(convite));
    }

    @Test
    void resumoSemOCampoReservaNaoQuebraNemMostraASecao() {
        String texto = ResumoEmailService.montarTexto("Ana", resumo(null), LINK);
        String html = ResumoEmailService.montarHtml("Ana", resumo(null), LINK);

        assertThat(texto).doesNotContain("Reserva de emergência:");
        assertThat(html).doesNotContain(TITULO_HTML);
    }

    @Test
    void htmlUsaACorDoNivel() {
        assertThat(ResumoEmailService.caixaReserva("vazia", "x")).contains("#fdeaea").contains("#c94242");
        assertThat(ResumoEmailService.caixaReserva("critica", "x")).contains("#fdeaea");
        assertThat(ResumoEmailService.caixaReserva("atencao", "x")).contains("#fff5dc").contains("#805b13");
        assertThat(ResumoEmailService.caixaReserva("protegida", "x")).contains("#e5f5e9").contains("#328a52");
        assertThat(ResumoEmailService.caixaReserva("sem_reserva", "x")).contains("#e9f1e7");
        assertThat(ResumoEmailService.caixaReserva(null, "x")).contains("#e9f1e7");
    }

    @Test
    void htmlEscapaAMensagem() {
        // O nome da reserva vem do usuário e pode entrar na mensagem.
        assertThat(ResumoEmailService.caixaReserva("protegida", "<b>oi</b>"))
            .contains("&lt;b&gt;oi&lt;/b&gt;")
            .doesNotContain("<b>");
    }
}
