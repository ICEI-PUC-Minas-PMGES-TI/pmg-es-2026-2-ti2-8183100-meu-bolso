package Projeto.MeuBolso.email;

/**
 * Transporte de e-mail do Meu Bolso.
 *
 * Abstrai "como" o e-mail sai (SMTP local ou API HTTP da Brevo), mantendo o
 * conteúdo (assunto, texto e HTML) montado nos serviços de domínio
 * ({@code EmailService}, {@code ResumoEmailService}).
 *
 * A implementação ativa é escolhida por {@code app.mail.provider}:
 *  - {@code smtp}  (padrão): {@link SmtpEnviadorEmail}, usa o JavaMailSender.
 *                  Serve o ambiente local (Mailpit) e qualquer SMTP liberado.
 *  - {@code brevo}: {@link BrevoEnviadorEmail}, usa a API HTTP da Brevo
 *                  (porta 443). Necessário no Render Free, que bloqueia SMTP.
 */
public interface EnviadorEmail {

    /** Envia um e-mail só com texto simples. */
    void enviarTexto(String para, String assunto, String texto);

    /**
     * Envia um e-mail com texto simples (fallback) e HTML. O leitor mostra o
     * HTML quando suporta; senão, cai no texto.
     */
    void enviarHtml(String para, String assunto, String texto, String html);
}
