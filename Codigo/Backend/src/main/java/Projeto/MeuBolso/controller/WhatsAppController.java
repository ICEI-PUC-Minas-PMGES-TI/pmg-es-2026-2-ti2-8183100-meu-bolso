package Projeto.MeuBolso.controller;

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
 * chama este endpoint a cada evento recebido. Por isso não há túnel nem
 * handshake de verificação: o WAHA e o backend conversam pela rede local.
 *
 * Esqueleto: por ora o corpo recebido é apenas registrado em log. A
 * interpretação da conversa (menu, ações, máquina de estados) virá depois.
 *
 * A rota /api/whatsapp/** é pública no SecurityConfig, pois o WAHA chama o
 * webhook sem o token JWT da aplicação.
 */
@RestController
@RequestMapping("/api/whatsapp")
public class WhatsAppController {

    private static final Logger log = LoggerFactory.getLogger(WhatsAppController.class);

    /**
     * Recebimento de eventos do WAHA. Responde 200 rápido para o WAHA não
     * tentar reenviar o evento.
     */
    @PostMapping("/webhook")
    public ResponseEntity<Void> receber(@RequestBody(required = false) String corpo) {
        log.info("Evento recebido do WhatsApp: {}", corpo);
        return ResponseEntity.ok().build();
    }
}
