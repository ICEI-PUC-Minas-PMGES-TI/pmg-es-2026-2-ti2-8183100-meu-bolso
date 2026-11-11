package Projeto.MeuBolso.model;

import java.math.BigDecimal;
import java.time.Instant;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * Movimentação (aporte/retirada) de uma meta — coleção "transacoes".
 *
 * Cada depósito ou retirada numa meta gera um registro aqui, vinculado ao
 * usuário e à meta, e referenciando a carteira de onde o dinheiro saiu/entrou.
 * É a fonte do histórico "Movimentações recentes" do painel de metas.
 *
 * Valores monetários em BigDecimal (Decimal128 no MongoDB).
 */
@Document(collection = "transacoes")
public class MovimentacaoMeta {
    @Id
    private String id;

    @Indexed
    private String usuarioId;

    @Indexed
    private String metaId;

    // Carteira (conta ou dinheiro) de origem/destino do valor.
    private String carteiraId;

    // "deposito" (entra na meta) ou "retirada" (sai da meta).
    private String tipo;

    private BigDecimal valor;

    // Título livre informado pelo usuário (ex.: "Aporte mensal"); pode ser vazio.
    private String titulo;

    private Instant data;

    public MovimentacaoMeta() {}

    public MovimentacaoMeta(String usuarioId, String metaId, String carteiraId,
                            String tipo, BigDecimal valor, String titulo) {
        this.usuarioId = usuarioId;
        this.metaId = metaId;
        this.carteiraId = carteiraId;
        this.tipo = tipo;
        this.valor = valor;
        this.titulo = titulo;
        this.data = Instant.now();
    }

    public String getId() { return id; }
    public String getUsuarioId() { return usuarioId; }
    public String getMetaId() { return metaId; }
    public String getCarteiraId() { return carteiraId; }
    public String getTipo() { return tipo; }
    public BigDecimal getValor() { return valor; }
    public String getTitulo() { return titulo; }
    public Instant getData() { return data; }

    public void setId(String id) { this.id = id; }
    public void setUsuarioId(String usuarioId) { this.usuarioId = usuarioId; }
    public void setMetaId(String metaId) { this.metaId = metaId; }
    public void setCarteiraId(String carteiraId) { this.carteiraId = carteiraId; }
    public void setTipo(String tipo) { this.tipo = tipo; }
    public void setValor(BigDecimal valor) { this.valor = valor; }
    public void setTitulo(String titulo) { this.titulo = titulo; }
    public void setData(Instant data) { this.data = data; }
}
