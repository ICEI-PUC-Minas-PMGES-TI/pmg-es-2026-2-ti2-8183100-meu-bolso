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
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

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
            SimpleMailMessage mensagem = new SimpleMailMessage();
            mensagem.setFrom(remetente);
            mensagem.setTo(para);
            mensagem.setSubject("Meu Bolso - Seu resumo semanal");
            mensagem.setText(montarTexto(nome, resumo, linkCancelar));
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
}
