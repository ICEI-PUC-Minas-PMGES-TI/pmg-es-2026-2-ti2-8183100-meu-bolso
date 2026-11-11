package Projeto.MeuBolso.model;

import java.time.LocalDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * Preferência do resumo semanal por e-mail — coleção "preferencias_resumo".
 *
 * Um documento por usuário. Guarda se o envio está ligado, a data do último
 * envio (para não mandar duas vezes na mesma semana) e o HASH do token do link
 * de cancelamento. O token em si nunca é salvo.
 */
@Document(collection = "preferencias_resumo")
public class PreferenciaResumo {

    @Id
    private String id;

    @Indexed(unique = true)
    private String usuarioId;

    // Desligado por padrão: o próprio usuário liga o envio.
    private boolean ativo = false;

    private LocalDate ultimoEnvio;

    // SHA-256 do token do link de cancelamento do último e-mail enviado.
    @Indexed
    private String tokenHash;

    public PreferenciaResumo() {}

    public PreferenciaResumo(String usuarioId) {
        this.usuarioId = usuarioId;
    }

    public String getId() { return id; }
    public String getUsuarioId() { return usuarioId; }
    public boolean isAtivo() { return ativo; }
    public LocalDate getUltimoEnvio() { return ultimoEnvio; }
    public String getTokenHash() { return tokenHash; }

    public void setId(String id) { this.id = id; }
    public void setUsuarioId(String usuarioId) { this.usuarioId = usuarioId; }
    public void setAtivo(boolean ativo) { this.ativo = ativo; }
    public void setUltimoEnvio(LocalDate ultimoEnvio) { this.ultimoEnvio = ultimoEnvio; }
    public void setTokenHash(String tokenHash) { this.tokenHash = tokenHash; }
}
