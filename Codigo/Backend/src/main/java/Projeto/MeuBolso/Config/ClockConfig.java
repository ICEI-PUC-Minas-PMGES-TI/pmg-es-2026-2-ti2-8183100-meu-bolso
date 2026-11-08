package Projeto.MeuBolso.Config;

import java.time.Clock;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Relógio injetável. Quem precisa da "data de hoje" depende de um {@link Clock}
 * em vez de chamar LocalDate.now() direto, o que permite fixar a data nos testes.
 */
@Configuration
public class ClockConfig {

    @Bean
    public Clock clock() {
        return Clock.systemDefaultZone();
    }
}
