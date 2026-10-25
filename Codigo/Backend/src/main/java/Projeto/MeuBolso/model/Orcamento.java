package Projeto.MeuBolso.model;

import java.math.BigDecimal;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.mapping.FieldType;

/** Orçamento mensal do usuário (um por usuário, vale para todos os meses). */
@Document(collection = "orcamentos")
public class Orcamento {
    @Id
    private String id;
    @Indexed(unique = true)
    private String usuarioId;
    @Field(targetType = FieldType.DECIMAL128)
    private BigDecimal valorMensal;

    public Orcamento() {}

    public String getId() { return id; }
    public String getUsuarioId() { return usuarioId; }
    public BigDecimal getValorMensal() { return valorMensal; }

    public void setId(String id) { this.id = id; }
    public void setUsuarioId(String usuarioId) { this.usuarioId = usuarioId; }
    public void setValorMensal(BigDecimal valorMensal) { this.valorMensal = valorMensal; }
}