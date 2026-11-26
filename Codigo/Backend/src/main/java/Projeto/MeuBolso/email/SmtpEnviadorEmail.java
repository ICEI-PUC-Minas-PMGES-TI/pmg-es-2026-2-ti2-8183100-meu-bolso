package Projeto.MeuBolso.email;

import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;

/**
 * Transporte via SMTP, usando o {@link JavaMailSender} do Spring.
 *
 * Ativo quando {@code app.mail.provider=smtp} ou quando a propriedade não está
 * definida ({@code matchIfMissing = true}). É o padrão para o ambiente local
 * (Mailpit) e para qualquer host SMTP liberado.
 *
 * No Render Free as portas SMTP (25/465/587) são bloqueadas, então em produção
 * usa-se a implementação Brevo (API HTTP). Ver {@link BrevoEnviadorEmail}.
 */
@Component
@ConditionalOnProperty(name = "app.mail.provider", havingValue = "smtp", matchIfMissing = true)
public class SmtpEnviadorEmail implements EnviadorEmail {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from}")
    private String remetente;

    public SmtpEnviadorEmail(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Override
    public void enviarTexto(String para, String assunto, String texto) {
        SimpleMailMessage mensagem = new SimpleMailMessage();
        mensagem.setFrom(remetente);
        mensagem.setTo(para);
        mensagem.setSubject(assunto);
        mensagem.setText(texto);
        mailSender.send(mensagem);
    }

    @Override
    public void enviarHtml(String para, String assunto, String texto, String html) {
        try {
            MimeMessage mensagem = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mensagem, true, "UTF-8");
            helper.setFrom(remetente);
            helper.setTo(para);
            helper.setSubject(assunto);
            helper.setText(texto, html); // (fallback texto, HTML)
            mailSender.send(mensagem);
        } catch (Exception e) {
            // Normaliza para runtime; quem chama (serviços @Async) já captura e loga.
            throw new RuntimeException("Falha ao montar o e-mail HTML (SMTP).", e);
        }
    }
}
