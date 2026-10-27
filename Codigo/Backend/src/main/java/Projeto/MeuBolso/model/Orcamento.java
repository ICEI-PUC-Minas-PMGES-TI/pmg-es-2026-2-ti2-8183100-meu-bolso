package Projeto.MeuBolso.model;

import java.math.BigDecimal;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
<<<<<<< HEAD
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.mapping.FieldType;

/** Orçamento mensal do usuário (um por usuário, vale para todos os meses). */
=======

/**
 * Orçamento mensal do usuário — coleção "orcamentos".
 *
 * É um valor único por usuário (teto mensal de gastos). O usuarioId é único:
 * cada pessoa tem no máximo um documento de orçamento.
 */
>>>>>>> 3af0db57f8043fc8f226b9843d3e51f60f9c7aae
@Document(collection = "orcamentos")
public class Orcamento {
    @Id
    private String id;
<<<<<<< HEAD
    @Indexed(unique = true)
    private String usuarioId;
    @Field(targetType = FieldType.DECIMAL128)
    private BigDecimal valorMensal;

    public Orcamento() {}

=======

    @Indexed(unique = true)
    private String usuarioId;

    private BigDecimal valorMensal = BigDecimal.ZERO;

    public Orcamento() {}

    public Orcamento(String usuarioId, BigDecimal valorMensal) {
        this.usuarioId = usuarioId;
        this.valorMensal = valorMensal == null ? BigDecimal.ZERO : valorMensal;
    }

>>>>>>> 3af0db57f8043fc8f226b9843d3e51f60f9c7aae
    public String getId() { return id; }
    public String getUsuarioId() { return usuarioId; }
    public BigDecimal getValorMensal() { return valorMensal; }

    public void setId(String id) { this.id = id; }
    public void setUsuarioId(String usuarioId) { this.usuarioId = usuarioId; }
<<<<<<< HEAD
    public void setValorMensal(BigDecimal valorMensal) { this.valorMensal = valorMensal; }
}
=======
    public void setValorMensal(BigDecimal valorMensal) { this.valorMensal = valorMensal == null ? BigDecimal.ZERO : valorMensal; }
}
>>>>>>> 3af0db57f8043fc8f226b9843d3e51f60f9c7aae
