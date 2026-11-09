package Projeto.MeuBolso.model;

import java.math.BigDecimal;
import java.time.Instant;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * Transferência entre duas contas bancárias do usuário (coleção "transferencias").
 *
 * O saldo das contas é ajustado no documento da carteira; este registro existe
 * para o histórico: aparece como saída na conta de origem e entrada no destino.
 * Os nomes das contas são guardados no momento da transferência para o
 * histórico continuar legível mesmo se a conta for renomeada ou excluída.
 */
@Document(collection = "transferencias")
public class Transferencia {
    @Id
    private String id;

    @Indexed
    private String usuarioId;

    private String origemId;
    private String origemNome;
    private String destinoId;
    private String destinoNome;
    private BigDecimal valor;
    private Instant data;

    public Transferencia() {}

    public Transferencia(String usuarioId, String origemId, String origemNome,
                         String destinoId, String destinoNome, BigDecimal valor, Instant data) {
        this.usuarioId = usuarioId;
        this.origemId = origemId;
        this.origemNome = origemNome;
        this.destinoId = destinoId;
        this.destinoNome = destinoNome;
        this.valor = valor;
        this.data = data;
    }

    public String getId() { return id; }
    public String getUsuarioId() { return usuarioId; }
    public String getOrigemId() { return origemId; }
    public String getOrigemNome() { return origemNome; }
    public String getDestinoId() { return destinoId; }
    public String getDestinoNome() { return destinoNome; }
    public BigDecimal getValor() { return valor; }
    public Instant getData() { return data; }

    public void setId(String id) { this.id = id; }
    public void setUsuarioId(String usuarioId) { this.usuarioId = usuarioId; }
    public void setOrigemId(String origemId) { this.origemId = origemId; }
    public void setOrigemNome(String origemNome) { this.origemNome = origemNome; }
    public void setDestinoId(String destinoId) { this.destinoId = destinoId; }
    public void setDestinoNome(String destinoNome) { this.destinoNome = destinoNome; }
    public void setValor(BigDecimal valor) { this.valor = valor; }
    public void setData(Instant data) { this.data = data; }
}
