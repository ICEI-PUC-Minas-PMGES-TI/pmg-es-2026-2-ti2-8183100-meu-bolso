package Projeto.MeuBolso.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * Meta financeira do usuário (coleção "metas" — ver Documentacao/ModeloDeDados.md).
 *
 * Dois tipos:
 *  - "objetivo" (padrão; documentos antigos sem tipo também são objetivo):
 *    tem valor-alvo e o progresso é valorAtual / valorAlvo;
 *  - "reserva": a reserva de emergência (no máximo uma por usuário). Não tem
 *    valor-alvo, só um VALOR MÍNIMO para cobrir imprevistos durante
 *    `horizonteMeses` (3, 6 ou 12). O mínimo pode ser automático (calculado
 *    na consulta pelo ReservaService, a partir dos gastos) ou manual
 *    (`valorMinimo` fixo informado pelo usuário).
 *
 * Valores monetários são BigDecimal (mapeado para Decimal128 no MongoDB),
 * evitando erros de arredondamento de ponto flutuante.
 *
 * O valorAtual só muda via movimentações (depósito/retirada); por isso nasce
 * em zero e não é alterado pelo CRUD básico.
 */
@Document(collection = "metas")
public class Meta {
    public static final String TIPO_OBJETIVO = "objetivo";
    public static final String TIPO_RESERVA = "reserva";

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

    // "objetivo" ou "reserva". Null (documentos antigos) = objetivo.
    private String tipo;

    // --- Só para a reserva de emergência ---
    // Quantos meses a reserva deve sustentar (3, 6 ou 12).
    private Integer horizonteMeses;
    // true = mínimo calculado pelos gastos; false = usa valorMinimo.
    private Boolean minimoAutomatico;
    // Mínimo fixo informado pelo usuário (usado quando minimoAutomatico = false).
    private BigDecimal valorMinimo;
    // Custo mensal informado pelo usuário, usado só quando não há dados para estimar.
    private BigDecimal custoMensalInformado;

    public Meta() {}

    public Meta(String usuarioId, String nome, BigDecimal valorAlvo, LocalDate prazo, String prioridade) {
        this.usuarioId = usuarioId;
        this.nome = nome;
        this.valorAlvo = valorAlvo;
        this.valorAtual = BigDecimal.ZERO;
        this.prazo = prazo;
        this.prioridade = prioridade;
    }

    /** Tipo efetivo: documentos antigos sem tipo são "objetivo". */
    public String tipoEfetivo() {
        return TIPO_RESERVA.equals(tipo) ? TIPO_RESERVA : TIPO_OBJETIVO;
    }

    public boolean isReserva() {
        return TIPO_RESERVA.equals(tipo);
    }

    public String getId() { return id; }
    public String getUsuarioId() { return usuarioId; }
    public String getNome() { return nome; }
    public BigDecimal getValorAlvo() { return valorAlvo; }
    public BigDecimal getValorAtual() { return valorAtual; }
    public LocalDate getPrazo() { return prazo; }
    public String getPrioridade() { return prioridade; }
    public String getTipo() { return tipo; }
    public Integer getHorizonteMeses() { return horizonteMeses; }
    public Boolean getMinimoAutomatico() { return minimoAutomatico; }
    public BigDecimal getValorMinimo() { return valorMinimo; }
    public BigDecimal getCustoMensalInformado() { return custoMensalInformado; }

    public void setId(String id) { this.id = id; }
    public void setUsuarioId(String usuarioId) { this.usuarioId = usuarioId; }
    public void setNome(String nome) { this.nome = nome; }
    public void setValorAlvo(BigDecimal valorAlvo) { this.valorAlvo = valorAlvo; }
    public void setValorAtual(BigDecimal valorAtual) { this.valorAtual = valorAtual; }
    public void setPrazo(LocalDate prazo) { this.prazo = prazo; }
    public void setPrioridade(String prioridade) { this.prioridade = prioridade; }
    public void setTipo(String tipo) { this.tipo = tipo; }
    public void setHorizonteMeses(Integer horizonteMeses) { this.horizonteMeses = horizonteMeses; }
    public void setMinimoAutomatico(Boolean minimoAutomatico) { this.minimoAutomatico = minimoAutomatico; }
    public void setValorMinimo(BigDecimal valorMinimo) { this.valorMinimo = valorMinimo; }
    public void setCustoMensalInformado(BigDecimal custoMensalInformado) { this.custoMensalInformado = custoMensalInformado; }
}
