package Projeto.MeuBolso.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.mapping.FieldType;

@Document(collection = "gastos")
@CompoundIndex(name = "usuario_data", def = "{'usuarioId': 1, 'data': -1}")
public class Gasto {
    @Id
    private String id;
    private String usuarioId;
    private String descricao;
    private String categoria;
    private String carteira;
    @Field(targetType = FieldType.DECIMAL128)
    private BigDecimal valor;
    private LocalDate data;
    private String comentario;
    // Preenchido quando o gasto foi lançado por uma recorrência
    private String recorrenciaId;

    public Gasto() {}

    public String getId() { return id; }
    public String getUsuarioId() { return usuarioId; }
    public String getDescricao() { return descricao; }
    public String getCategoria() { return categoria; }
    public String getCarteira() { return carteira; }
    public BigDecimal getValor() { return valor; }
    public LocalDate getData() { return data; }
    public String getComentario() { return comentario; }
    public String getRecorrenciaId() { return recorrenciaId; }

    public void setId(String id) { this.id = id; }
    public void setUsuarioId(String usuarioId) { this.usuarioId = usuarioId; }
    public void setDescricao(String descricao) { this.descricao = descricao; }
    public void setCategoria(String categoria) { this.categoria = categoria; }
    public void setCarteira(String carteira) { this.carteira = carteira; }
    public void setValor(BigDecimal valor) { this.valor = valor; }
    public void setData(LocalDate data) { this.data = data; }
    public void setComentario(String comentario) { this.comentario = comentario; }
    public void setRecorrenciaId(String recorrenciaId) { this.recorrenciaId = recorrenciaId; }
}