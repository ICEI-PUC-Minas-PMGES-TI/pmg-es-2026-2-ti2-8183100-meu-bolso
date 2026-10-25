package Projeto.MeuBolso.model;

import java.math.BigDecimal;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.mapping.FieldType;

/** Regra "repetir todo mês". Os gastos são lançados a partir dela (ver GastoService). */
@Document(collection = "GastoRecorrentes")
public class GastoRecorrente {
    @Id
    private String id;
    @Indexed
    private String usuarioId;
    private String descricao;
    private String categoria;
    private String carteira;
    @Field(targetType = FieldType.DECIMAL128)
    private BigDecimal valor;
    private int diaDoMes;          // 1 a 31 (em meses curtos vira o último dia)
    private String comentario;
    private boolean ativa = true;
    // Último mês ("AAAA-MM") que já tem lançamento; a geração continua a partir do seguinte
    private String ultimoMes;

    public GastoRecorrente() {}

    public String getId() { return id; }
    public String getUsuarioId() { return usuarioId; }
    public String getDescricao() { return descricao; }
    public String getCategoria() { return categoria; }
    public String getCarteira() { return carteira; }
    public BigDecimal getValor() { return valor; }
    public int getDiaDoMes() { return diaDoMes; }
    public String getComentario() { return comentario; }
    public boolean isAtiva() { return ativa; }
    public String getUltimoMes() { return ultimoMes; }

    public void setId(String id) { this.id = id; }
    public void setUsuarioId(String usuarioId) { this.usuarioId = usuarioId; }
    public void setDescricao(String descricao) { this.descricao = descricao; }
    public void setCategoria(String categoria) { this.categoria = categoria; }
    public void setCarteira(String carteira) { this.carteira = carteira; }
    public void setValor(BigDecimal valor) { this.valor = valor; }
    public void setDiaDoMes(int diaDoMes) { this.diaDoMes = diaDoMes; }
    public void setComentario(String comentario) { this.comentario = comentario; }
    public void setAtiva(boolean ativa) { this.ativa = ativa; }
    public void setUltimoMes(String ultimoMes) { this.ultimoMes = ultimoMes; }
}