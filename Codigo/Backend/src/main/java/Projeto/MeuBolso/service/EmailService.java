package Projeto.MeuBolso.service;

import Projeto.MeuBolso.email.EnviadorEmail;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final EnviadorEmail enviador;

    @Value("${app.recovery.token-minutes}")
    private long validadeMinutos;

    public EmailService(EnviadorEmail enviador) {
        this.enviador = enviador;
    }

    /**
     * Envia o e-mail com o link de recuperação. Roda em segundo plano (@Async);
     * se falhar, só registra no log (não revela nada para quem fez o pedido).
     */
    @Async
    public void enviarLinkRecuperacao(String para, String nome, String link) {
        try {
            String texto =
                "Olá, " + nome + "!\n\n"
                + "Recebemos um pedido para redefinir a senha da sua conta no Meu Bolso.\n"
                + "Para criar uma nova senha, acesse o link abaixo (vale por "
                + validadeMinutos + " minutos e só pode ser usado uma vez):\n\n"
                + link + "\n\n"
                + "Se você não fez esse pedido, ignore este e-mail: sua senha continua a mesma.\n\n"
                + "Equipe Meu Bolso";
            enviador.enviarTexto(para, "Meu Bolso - Recuperação de senha", texto);
        } catch (Exception e) {
            // Nunca logar o link (ele contém o token).
            log.error("Falha ao enviar e-mail de recuperação: {}", e.getMessage());
        }
    }
}
