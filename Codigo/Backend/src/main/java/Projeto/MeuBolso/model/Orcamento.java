package Projeto.MeuBolso.model;

import java.math.BigDecimal;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * Orçamento mensal do usuário — coleção "orcamentos".
 *
 * É um valor único por usuário (teto mensal de gastos). O usuarioId é único:
 * cada pessoa tem no máximo um documento de orçamento.
 */
@Document(collection = "orcamentos")
public class Orcamento {
    @Id
    private String id;

    @Indexed(unique = true)
    private String usuarioId;

    private BigDecimal valorMensal = BigDecimal.ZERO;

    public Orcamento() {}

    public Orcamento(String usuarioId, BigDecimal valorMensal) {
        this.usuarioId = usuarioId;
        this.valorMensal = valorMensal == null ? BigDecimal.ZERO : valorMensal;
    }

    public String getId() { return id; }
    public String getUsuarioId() { return usuarioId; }
    public BigDecimal getValorMensal() { return valorMensal; }

    public void setId(String id) { this.id = id; }
    public void setUsuarioId(String usuarioId) { this.usuarioId = usuarioId; }
    public void setValorMensal(BigDecimal valorMensal) { this.valorMensal = valorMensal == null ? BigDecimal.ZERO : valorMensal; }
}
