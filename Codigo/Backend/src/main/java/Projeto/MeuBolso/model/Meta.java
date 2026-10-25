package Projeto.MeuBolso.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * Meta financeira do usuário (coleção "metas" — ver Documentacao/ModeloDeDados.md).
 * A reserva é apenas uma meta com nome próprio. O progresso é valorAtual / valorAlvo.
 *
 * Valores monetários são BigDecimal (mapeado para Decimal128 no MongoDB),
 * evitando erros de arredondamento de ponto flutuante.
 *
 * O valorAtual só muda via aportes (transações com metaId) — fora do escopo
 * atual; por isso nasce em zero e não é alterado pelo CRUD básico.
 */
@Document(collection = "metas")
public class Meta {
    @Id
    private String id;

    // Dono da meta. Indexado porque toda consulta filtra por usuário.
    @Indexed
    private String usuarioId;

    private String nome;
    private BigDecimal valorAlvo;
    private BigDecimal valorAtual = BigDecimal.ZERO;
    private LocalDate prazo;
    private String prioridade;

    public Meta() {}

    public Meta(String usuarioId, String nome, BigDecimal valorAlvo, LocalDate prazo, String prioridade) {
        this.usuarioId = usuarioId;
        this.nome = nome;
        this.valorAlvo = valorAlvo;
        this.valorAtual = BigDecimal.ZERO;
        this.prazo = prazo;
        this.prioridade = prioridade;
    }

    public String getId() { return id; }
    public String getUsuarioId() { return usuarioId; }
    public String getNome() { return nome; }
    public BigDecimal getValorAlvo() { return valorAlvo; }
    public BigDecimal getValorAtual() { return valorAtual; }
    public LocalDate getPrazo() { return prazo; }
    public String getPrioridade() { return prioridade; }

    public void setId(String id) { this.id = id; }
    public void setUsuarioId(String usuarioId) { this.usuarioId = usuarioId; }
    public void setNome(String nome) { this.nome = nome; }
    public void setValorAlvo(BigDecimal valorAlvo) { this.valorAlvo = valorAlvo; }
    public void setValorAtual(BigDecimal valorAtual) { this.valorAtual = valorAtual; }
    public void setPrazo(LocalDate prazo) { this.prazo = prazo; }
    public void setPrioridade(String prioridade) { this.prioridade = prioridade; }
}
