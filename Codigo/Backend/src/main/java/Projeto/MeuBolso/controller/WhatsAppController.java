package Projeto.MeuBolso.controller;

import Projeto.MeuBolso.whatsapp.MensagemRecebida;
import Projeto.MeuBolso.whatsapp.WahaClient;
import Projeto.MeuBolso.whatsapp.WhatsAppService;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Webhook do chatbot do WhatsApp, recebido via WAHA (WhatsApp HTTP API).
 *
 * O WAHA roda localmente (container Docker) pareado a um número de WhatsApp e
 * chama este endpoint a cada evento. Por isso não há túnel nem handshake de
 * verificação: o WAHA e o backend conversam pela rede local.
 *
 * O controller só interpreta e filtra o evento; o atendimento (identificação
 * do usuário, menu, operações) roda em segundo plano no {@link WhatsAppService},
 * e a resposta volta ao usuário pela API do WAHA.
 *
 * A rota /api/whatsapp/** é pública no SecurityConfig, pois o WAHA chama o
 * webhook sem o token JWT da aplicação.
 */
@RestController
@RequestMapping("/api/whatsapp")
public class WhatsAppController {

    private static final Logger log = LoggerFactory.getLogger(WhatsAppController.class);
    private static final TypeReference<Map<String, Object>> TIPO_EVENTO = new TypeReference<>() {};

    private final WhatsAppService whatsAppService;
    private final WahaClient waha;
    private final ObjectMapper objectMapper;

    public WhatsAppController(WhatsAppService whatsAppService, WahaClient waha, ObjectMapper objectMapper) {
        this.whatsAppService = whatsAppService;
        this.waha = waha;
        this.objectMapper = objectMapper;
    }

    /**
     * Recebimento de eventos do WAHA. Responde 200 sempre (inclusive para
     * eventos ignorados ou inválidos) para o WAHA não reenviar o evento.
     */
    @PostMapping("/webhook")
    public ResponseEntity<Void> receber(@RequestBody(required = false) String corpo) {
        // Corpo completo só em debug: eventos trazem conteúdo pessoal (ex.: status de contatos).
        log.debug("Evento recebido do WhatsApp: {}", corpo);
        if (corpo == null || corpo.isBlank()) return ResponseEntity.ok().build();

        Map<String, Object> evento;
        try {
            evento = objectMapper.readValue(corpo, TIPO_EVENTO);
        } catch (JsonProcessingException e) {
            log.warn("Evento do WhatsApp com JSON inválido ignorado.");
            return ResponseEntity.ok().build();
        }

        MensagemRecebida.doEvento(evento, waha.sessao()).ifPresent(whatsAppService::atender);
        return ResponseEntity.ok().build();
    }
}
