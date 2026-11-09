package Projeto.MeuBolso.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Webhook do chatbot do WhatsApp (Cloud API, Meta).
 *
 * Esta é a Fase 1 (esqueleto): apenas o handshake de verificação e o
 * recebimento das mensagens, que por ora são só registradas em log. A
 * interpretação da conversa (menu, ações, máquina de estados) virá depois.
 *
 * A rota /api/whatsapp/** é pública no SecurityConfig, pois a Meta chama o
 * webhook sem o token JWT da aplicação. A autenticidade das requisições será
 * garantida depois pela validação da assinatura (X-Hub-Signature-256).
 *
 * Fluxo da Meta:
 *  - GET  /api/whatsapp/webhook  -> verificação: devolve hub.challenge se o
 *    hub.verify_token conferir com o valor configurado.
 *  - POST /api/whatsapp/webhook  -> entrega das mensagens (corpo JSON).
 */
@RestController
@RequestMapping("/api/whatsapp")
public class WhatsAppController {

    private static final Logger log = LoggerFactory.getLogger(WhatsAppController.class);

    // Token de verificação do webhook, escolhido por nós e também informado no
    // painel da Meta ao cadastrar o webhook. Vem de WHATSAPP_VERIFY_TOKEN.
    @Value("${app.whatsapp.verify-token}")
    private String verifyToken;

    /**
     * Verificação do webhook (handshake). A Meta chama uma única vez ao
     * cadastrar/validar o webhook. Se o token conferir, devolve o challenge
     * em texto puro; caso contrário, 403.
     */
    @GetMapping("/webhook")
    public ResponseEntity<String> verificar(
            @RequestParam(name = "hub.mode", required = false) String mode,
            @RequestParam(name = "hub.verify_token", required = false) String token,
            @RequestParam(name = "hub.challenge", required = false) String challenge) {

        if ("subscribe".equals(mode) && verifyToken != null && verifyToken.equals(token)) {
            log.info("Webhook do WhatsApp verificado com sucesso.");
            return ResponseEntity.ok(challenge);
        }

        log.warn("Falha na verificação do webhook do WhatsApp (mode={}).", mode);
        return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
    }

    /**
     * Recebimento de eventos/mensagens. Nesta fase só registra o corpo cru
     * para confirmar o ciclo Meta -> túnel -> backend. Responde 200 sempre,
     * rápido, como a Meta espera (ela reenvia se não receber 200 a tempo).
     */
    @PostMapping("/webhook")
    public ResponseEntity<Void> receber(@RequestBody(required = false) String corpo) {
        log.info("Evento recebido do WhatsApp: {}", corpo);
        return ResponseEntity.ok().build();
    }
}
