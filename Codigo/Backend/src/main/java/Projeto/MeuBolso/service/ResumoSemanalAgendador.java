package Projeto.MeuBolso.service;

import Projeto.MeuBolso.model.PreferenciaResumo;
import Projeto.MeuBolso.repository.PreferenciaResumoRepository;
import Projeto.MeuBolso.repository.UsuarioRepository;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Envia o resumo semanal para quem ligou a opção. Roda toda segunda-feira às 8h
 * (horário de Brasília).
 */
@Component
public class ResumoSemanalAgendador {

    private static final Logger log = LoggerFactory.getLogger(ResumoSemanalAgendador.class);

    private final PreferenciaResumoRepository preferenciaRepository;
    private final UsuarioRepository usuarioRepository;
    private final ResumoSemanalService resumoService;

    public ResumoSemanalAgendador(PreferenciaResumoRepository preferenciaRepository,
                                  UsuarioRepository usuarioRepository,
                                  ResumoSemanalService resumoService) {
        this.preferenciaRepository = preferenciaRepository;
        this.usuarioRepository = usuarioRepository;
        this.resumoService = resumoService;
    }

    @Scheduled(cron = "0 0 8 * * MON", zone = "America/Sao_Paulo")
    public void enviarResumosDaSemana() {
        LocalDate hoje = LocalDate.now(ResumoSemanalService.ZONA);
        LocalDate inicioDaSemana = hoje.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));

        for (PreferenciaResumo preferencia : preferenciaRepository.findByAtivoTrue()) {
            // Já recebeu nesta semana (por exemplo, pelo "enviar agora"): pula.
            if (preferencia.getUltimoEnvio() != null && !preferencia.getUltimoEnvio().isBefore(inicioDaSemana)) {
                continue;
            }
            usuarioRepository.findById(preferencia.getUsuarioId()).ifPresent(usuario -> {
                try {
                    resumoService.enviarResumo(usuario, hoje);
                } catch (Exception e) {
                    // Um usuário com erro não pode impedir o envio dos demais.
                    log.error("Falha no resumo semanal do usuário {}: {}", usuario.getId(), e.getMessage());
                }
            });
        }
    }
}
