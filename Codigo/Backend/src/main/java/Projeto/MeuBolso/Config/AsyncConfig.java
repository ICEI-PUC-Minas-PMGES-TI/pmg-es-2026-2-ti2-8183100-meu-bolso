package Projeto.MeuBolso.Config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Liga dois recursos do Spring que o projeto usa:
 *
 * - @EnableAsync: faz o @Async funcionar. Sem ele, o envio de e-mail roda dentro
 *   da própria requisição (fica lento e a resposta demora mais quando o e-mail
 *   existe, o que revela quais e-mails têm conta).
 * - @EnableScheduling: faz o @Scheduled funcionar. O resumo semanal depende dele
 *   para disparar sozinho toda semana.
 */
@Configuration
@EnableAsync
@EnableScheduling
public class AsyncConfig {
}
