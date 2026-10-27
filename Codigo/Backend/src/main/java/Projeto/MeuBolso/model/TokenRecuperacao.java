package Projeto.MeuBolso.model;

import java.time.Instant;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * Token de recuperação de senha (coleção "tokens_recuperacao").
 *
 * Só o HASH do token é guardado: o valor puro existe apenas no link enviado
 * por e-mail. Assim, quem tiver acesso ao banco não consegue usar os tokens.
 *
 * O índice TTL em "expiraEm" faz o próprio MongoDB apagar o documento depois
 * que a data passa (a limpeza roda a cada ~60 segundos).
 */
@Document(collection = "tokens_recuperacao")
public class TokenRecuperacao {
    @Id
    private String id;

    @Indexed
    private String usuarioId;

    @Indexed(unique = true)
    private String tokenHash;

    @Indexed(expireAfterSeconds = 0)
    private Instant expiraEm;

    public TokenRecuperacao() {}

    public TokenRecuperacao(String usuarioId, String tokenHash, Instant expiraEm) {
        this.usuarioId = usuarioId;
        this.tokenHash = tokenHash;
        this.expiraEm = expiraEm;
    }

    public String getId() { return id; }
    public String getUsuarioId() { return usuarioId; }
    public String getTokenHash() { return tokenHash; }
    public Instant getExpiraEm() { return expiraEm; }
}
