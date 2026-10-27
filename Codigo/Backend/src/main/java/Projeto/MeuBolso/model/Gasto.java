package Projeto.MeuBolso.model;

import java.math.BigDecimal;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * Gasto (transação de saída) do usuário — coleção "gastos".
 *
 * Espelha o contrato que o front usa (service/gastosService.js):
 * descricao, categoria, carteira, data ("AAAA-MM-DD"), valor, comentario e,
 * quando veio de uma regra que se repete, o vínculo recorrenciaId.
 *
 * Valores monetários são BigDecimal (Decimal128 no MongoDB), evitando erros
 * de arredondamento de ponto flutuante.
 */
@Document(collection = "gastos")
public class Gasto {
    @Id
    private String id;

    // Dono do gasto. Indexado porque toda consulta filtra por usuário.
    @Indexed
    private String usuarioId;

    private String descricao;
    private String categoria;
    private String carteira;
    // Data no formato "AAAA-MM-DD" (mesmo contrato do front).
    private String data;
    private BigDecimal valor;
    private String comentario = "";

    // Preenchido quando o gasto nasceu de uma recorrência; null se for avulso.
    private String recorrenciaId;

    public Gasto() {}

    public Gasto(String usuarioId, String descricao, String categoria, String carteira,
                String data, BigDecimal valor, String comentario, String recorrenciaId) {
        this.usuarioId = usuarioId;
        this.descricao = descricao;
        this.categoria = categoria;
        this.carteira = carteira;
        this.data = data;
        this.valor = valor;
        this.comentario = comentario == null ? "" : comentario;
        this.recorrenciaId = recorrenciaId;
    }

    public String getId() { return id; }
    public String getUsuarioId() { return usuarioId; }
    public String getDescricao() { return descricao; }
    public String getCategoria() { return categoria; }
    public String getCarteira() { return carteira; }
    public String getData() { return data; }
    public BigDecimal getValor() { return valor; }
    public String getComentario() { return comentario; }
    public String getRecorrenciaId() { return recorrenciaId; }

    public void setId(String id) { this.id = id; }
    public void setUsuarioId(String usuarioId) { this.usuarioId = usuarioId; }
    public void setDescricao(String descricao) { this.descricao = descricao; }
    public void setCategoria(String categoria) { this.categoria = categoria; }
    public void setCarteira(String carteira) { this.carteira = carteira; }
    public void setData(String data) { this.data = data; }
    public void setValor(BigDecimal valor) { this.valor = valor; }
    public void setComentario(String comentario) { this.comentario = comentario == null ? "" : comentario; }
    public void setRecorrenciaId(String recorrenciaId) { this.recorrenciaId = recorrenciaId; }
}
