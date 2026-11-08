package Projeto.MeuBolso.service;

import Projeto.MeuBolso.model.ResumoSemanalDtos.CategoriaValor;
import Projeto.MeuBolso.model.ResumoSemanalDtos.ContaAVencer;
import Projeto.MeuBolso.model.ResumoSemanalDtos.MetaProgresso;
import Projeto.MeuBolso.model.ResumoSemanalDtos.Resumo;
import java.text.NumberFormat;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import jakarta.mail.internet.MimeMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.util.HtmlUtils;

/**
 * Monta e envia o e-mail do resumo semanal. Roda em segundo plano (@Async),
 * então quem chama não espera o servidor de e-mail responder.
 */
@Service
public class ResumoEmailService {

    private static final Logger log = LoggerFactory.getLogger(ResumoEmailService.class);
    private static final NumberFormat MOEDA = NumberFormat.getCurrencyInstance(Locale.of("pt", "BR"));
    private static final DateTimeFormatter DATA = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final JavaMailSender mailSender;

    @Value("${app.mail.from}")
    private String remetente;

    public ResumoEmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    /**
     * Envia o resumo. Se falhar, só registra no log, sem o link de cancelamento
     * (ele contém o token).
     */
    @Async
    public void enviar(String para, String nome, Resumo resumo, String linkCancelar) {
        try {
            MimeMessage mensagem = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mensagem, true, "UTF-8");
            helper.setFrom(remetente);
            helper.setTo(para);
            helper.setSubject("Meu Bolso - Seu resumo semanal");
            // texto simples (fallback) + HTML (o que a maioria dos leitores mostra)
            helper.setText(montarTexto(nome, resumo, linkCancelar), montarHtml(nome, resumo, linkCancelar));
            mailSender.send(mensagem);
        } catch (Exception e) {
            log.error("Falha ao enviar resumo semanal: {}", e.getMessage());
        }
    }

    static String montarTexto(String nome, Resumo r, String linkCancelar) {
        StringBuilder sb = new StringBuilder();
        sb.append("Olá, ").append(nome).append("!\n\n");
        sb.append("Seu resumo de ").append(DATA.format(r.inicio()))
          .append(" a ").append(DATA.format(r.fim())).append(":\n\n");
        sb.append("Você gastou ").append(MOEDA.format(r.totalSemana()))
          .append(" em ").append(r.quantidadeSemana()).append(" lançamento(s).\n\n");

        sb.append("Categorias que mais pesaram:\n");
        if (r.categorias().isEmpty()) sb.append("- Nenhum gasto nesta semana.\n");
        for (CategoriaValor c : r.categorias()) {
            sb.append("- ").append(c.nome()).append(": ").append(MOEDA.format(c.valor())).append("\n");
        }
        sb.append("\n");

        sb.append("Orçamento do mês: ");
        if (r.orcamento().limite().signum() <= 0) {
            sb.append("você ainda não definiu um valor mensal.\n\n");
        } else {
            sb.append(MOEDA.format(r.orcamento().gastoNoMes())).append(" de ")
              .append(MOEDA.format(r.orcamento().limite())).append(" (")
              .append(r.orcamento().percentual()).append("%).\n\n");
        }

        sb.append("Metas:\n");
        if (r.metas().isEmpty()) sb.append("- Nenhuma meta cadastrada.\n");
        for (MetaProgresso m : r.metas()) {
            sb.append("- ").append(m.nome()).append(": ").append(MOEDA.format(m.valorAtual()))
              .append(" de ").append(MOEDA.format(m.valorAlvo()))
              .append(" (").append(m.percentual()).append("%)\n");
        }
        sb.append("\n");

        sb.append("Contas a vencer nos próximos 7 dias:\n");
        if (r.contasAVencer().isEmpty()) sb.append("- Nenhuma conta recorrente a vencer.\n");
        for (ContaAVencer c : r.contasAVencer()) {
            sb.append("- ").append(c.descricao()).append(": ").append(MOEDA.format(c.valor()))
              .append(" em ").append(DATA.format(c.vencimento())).append("\n");
        }
        sb.append("\n");

        sb.append("Para parar de receber este resumo, acesse:\n").append(linkCancelar).append("\n\n");
        sb.append("Equipe Meu Bolso");
        return sb.toString();
    }

    // ---------- versão HTML (igual à prévia do perfil) ----------

    private static final String VERDE = "#7fa878";
    private static final String VERDE_ESCURO = "#476b43";
    private static final String VERDE_FUNDO = "#f4f8f3";
    private static final String PRETO = "#101817";
    private static final String CINZA_FUNDO = "#f8f9f8";
    private static final String CINZA_TEXTO = "#747c77";

    /** Todo texto vindo do usuário passa por aqui, para não virar HTML. */
    private static String esc(String texto) {
        return HtmlUtils.htmlEscape(texto == null ? "" : texto);
    }

    private static String titulo(String texto) {
        return "<p style=\"margin:18px 0 6px;font-size:14px;font-weight:700;color:" + PRETO + ";\">"
                + esc(texto) + "</p>";
    }

    private static String vazio(String texto) {
        return "<p style=\"margin:0;font-size:14px;color:" + CINZA_TEXTO + ";\">" + esc(texto) + "</p>";
    }

    private static String item(String texto) {
        return "<li style=\"margin:0 0 4px;\">" + esc(texto) + "</li>";
    }

    private static String lista(StringBuilder itens) {
        return "<ul style=\"margin:0;padding-left:18px;font-size:14px;color:#202a28;\">" + itens + "</ul>";
    }

    static String montarHtml(String nome, Resumo r, String linkCancelar) {
        StringBuilder h = new StringBuilder();
        h.append("<!DOCTYPE html><html lang=\"pt-BR\"><body style=\"margin:0;padding:0;background:")
         .append(VERDE_FUNDO).append(";font-family:Arial,Helvetica,sans-serif;\">");
        h.append("<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\"><tr>")
         .append("<td align=\"center\" style=\"padding:24px 12px;\">");
        h.append("<table role=\"presentation\" width=\"560\" cellpadding=\"0\" cellspacing=\"0\" ")
         .append("style=\"max-width:560px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;\">");

        // cabeçalho verde
        h.append("<tr><td style=\"background:").append(VERDE).append(";padding:20px 28px;\">")
         .append("<span style=\"font-size:20px;font-weight:700;color:#ffffff;\">Meu Bolso</span></td></tr>");

        h.append("<tr><td style=\"padding:28px;\">");
        h.append("<p style=\"margin:0 0 4px;font-size:18px;font-weight:700;color:").append(PRETO).append(";\">Olá, ")
         .append(esc(nome)).append("!</p>");
        h.append("<p style=\"margin:0 0 18px;font-size:14px;color:").append(CINZA_TEXTO).append(";\">Seu resumo de ")
         .append(DATA.format(r.inicio())).append(" a ").append(DATA.format(r.fim())).append("</p>");

        // cartão cinza, igual à prévia
        h.append("<div style=\"background:").append(CINZA_FUNDO)
         .append(";border-radius:12px;padding:16px 18px;color:#202a28;\">");

        h.append("<p style=\"margin:0;font-size:14px;\"><strong>Últimos 7 dias:</strong> ")
         .append(esc(MOEDA.format(r.totalSemana()))).append(" em ").append(r.quantidadeSemana())
         .append(" lançamento(s)</p>");

        h.append(titulo("Categorias que mais pesaram:"));
        if (r.categorias().isEmpty()) {
            h.append(vazio("Nenhum gasto nesta semana."));
        } else {
            StringBuilder li = new StringBuilder();
            for (CategoriaValor c : r.categorias()) li.append(item(c.nome() + ": " + MOEDA.format(c.valor())));
            h.append(lista(li));
        }

        h.append("<p style=\"margin:18px 0 0;font-size:14px;\"><strong>Orçamento do mês:</strong> ");
        if (r.orcamento().limite().signum() <= 0) {
            h.append("defina um valor mensal na página de Gastos.");
        } else {
            h.append(esc(MOEDA.format(r.orcamento().gastoNoMes()) + " de "
                    + MOEDA.format(r.orcamento().limite()) + " (" + r.orcamento().percentual() + "%)"));
        }
        h.append("</p>");

        h.append(titulo("Metas:"));
        if (r.metas().isEmpty()) {
            h.append(vazio("Nenhuma meta cadastrada."));
        } else {
            StringBuilder li = new StringBuilder();
            for (MetaProgresso m : r.metas()) {
                li.append(item(m.nome() + ": " + MOEDA.format(m.valorAtual()) + " de "
                        + MOEDA.format(m.valorAlvo()) + " (" + m.percentual() + "%)"));
            }
            h.append(lista(li));
        }

        h.append(titulo("Contas a vencer nos próximos 7 dias:"));
        if (r.contasAVencer().isEmpty()) {
            h.append(vazio("Nenhuma conta recorrente a vencer."));
        } else {
            StringBuilder li = new StringBuilder();
            for (ContaAVencer c : r.contasAVencer()) {
                li.append(item(c.descricao() + ": " + MOEDA.format(c.valor()) + " em " + DATA.format(c.vencimento())));
            }
            h.append(lista(li));
        }
        h.append("</div>");

        // rodapé com o link de cancelar (o link vem do nosso código, mas escapamos igual)
        h.append("<p style=\"margin:24px 0 0;font-size:12px;line-height:1.5;color:").append(CINZA_TEXTO)
         .append(";\">Não quer mais receber este resumo? <a href=\"").append(esc(linkCancelar))
         .append("\" style=\"color:").append(VERDE_ESCURO).append(";font-weight:700;\">Cancelar o envio</a></p>");

        h.append("</td></tr></table></td></tr></table></body></html>");
        return h.toString();
    }
}