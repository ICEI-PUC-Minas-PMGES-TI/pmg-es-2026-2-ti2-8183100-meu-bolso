package Projeto.MeuBolso.model;

import java.math.BigDecimal;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * Orçamento mensal do usuário — coleção "orcamentos".
 *
 * Cada documento é o teto de gastos de UM mês ("AAAA-MM") de um usuário. O par
 * (usuarioId, mes) é único — garantido pelo índice composto criado no startup
 * por {@code OrcamentoIndexInitializer}, não por anotação, para evitar conflito
 * com o índice único antigo (só em usuarioId) que pode existir no banco.
 */
@Document(collection = "orcamentos")
public class Orcamento {
    @Id
    private String id;

    private String usuarioId;

    // Mês a que este orçamento se refere ("AAAA-MM").
    private String mes;

    private BigDecimal valorMensal = BigDecimal.ZERO;

    public Orcamento() {}

    public Orcamento(String usuarioId, String mes, BigDecimal valorMensal) {
        this.usuarioId = usuarioId;
        this.mes = mes;
        this.valorMensal = valorMensal == null ? BigDecimal.ZERO : valorMensal;
    }

    public String getId() { return id; }
    public String getUsuarioId() { return usuarioId; }
    public String getMes() { return mes; }
    public BigDecimal getValorMensal() { return valorMensal; }

    public void setId(String id) { this.id = id; }
    public void setUsuarioId(String usuarioId) { this.usuarioId = usuarioId; }
    public void setMes(String mes) { this.mes = mes; }
    public void setValorMensal(BigDecimal valorMensal) { this.valorMensal = valorMensal == null ? BigDecimal.ZERO : valorMensal; }
}
