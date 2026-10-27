package Projeto.MeuBolso.model;

import java.math.BigDecimal;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * Regra de gasto recorrente — coleção "recorrencias".
 *
 * A recorrência nasce de um gasto marcado como "repetir todo mês": guarda o
 * modelo do lançamento (descricao, categoria, carteira, valor, comentario), o
 * dia do mês em que cai e o "ultimoMes" já lançado ("AAAA-MM"), que torna a
 * geração idempotente — rodar duas vezes não duplica lançamentos.
 */
@Document(collection = "recorrencias")
public class Recorrencia {
    @Id
    private String id;

    @Indexed
    private String usuarioId;

    private String descricao;
    private String categoria;
    private String carteira;
    private BigDecimal valor;
    private String comentario = "";
    private int diaDoMes;
    private boolean ativa = true;
    // Último mês já lançado ("AAAA-MM"). A geração só avança a partir daqui.
    private String ultimoMes;

    public Recorrencia() {}

    public Recorrencia(String usuarioId, String descricao, String categoria, String carteira,
                       BigDecimal valor, String comentario, int diaDoMes, boolean ativa, String ultimoMes) {
        this.usuarioId = usuarioId;
        this.descricao = descricao;
        this.categoria = categoria;
        this.carteira = carteira;
        this.valor = valor;
        this.comentario = comentario == null ? "" : comentario;
        this.diaDoMes = diaDoMes;
        this.ativa = ativa;
        this.ultimoMes = ultimoMes;
    }

    public String getId() { return id; }
    public String getUsuarioId() { return usuarioId; }
    public String getDescricao() { return descricao; }
    public String getCategoria() { return categoria; }
    public String getCarteira() { return carteira; }
    public BigDecimal getValor() { return valor; }
    public String getComentario() { return comentario; }
    public int getDiaDoMes() { return diaDoMes; }
    public boolean isAtiva() { return ativa; }
    public String getUltimoMes() { return ultimoMes; }

    public void setId(String id) { this.id = id; }
    public void setUsuarioId(String usuarioId) { this.usuarioId = usuarioId; }
    public void setDescricao(String descricao) { this.descricao = descricao; }
    public void setCategoria(String categoria) { this.categoria = categoria; }
    public void setCarteira(String carteira) { this.carteira = carteira; }
    public void setValor(BigDecimal valor) { this.valor = valor; }
    public void setComentario(String comentario) { this.comentario = comentario == null ? "" : comentario; }
    public void setDiaDoMes(int diaDoMes) { this.diaDoMes = diaDoMes; }
    public void setAtiva(boolean ativa) { this.ativa = ativa; }
    public void setUltimoMes(String ultimoMes) { this.ultimoMes = ultimoMes; }
}
