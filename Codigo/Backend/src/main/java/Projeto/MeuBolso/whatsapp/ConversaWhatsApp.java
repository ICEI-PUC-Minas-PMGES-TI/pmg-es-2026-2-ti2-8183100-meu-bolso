package Projeto.MeuBolso.whatsapp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * Estado da conversa de um chat do WhatsApp com o bot (coleção
 * "conversas_whatsapp"). Um documento por chat (o id é o chatId do WAHA,
 * ex.: "97199505543212@lid").
 *
 * Guarda em que etapa do fluxo o usuário está e os dados já informados
 * (valor, categoria, meta, carteira...), além da última lista numerada
 * mostrada, para interpretar a próxima resposta.
 */
@Document(collection = "conversas_whatsapp")
public class ConversaWhatsApp {

    /** Etapas do fluxo. OCIOSO = sem conversa em andamento. */
    public enum Etapa { OCIOSO, MENU, VALOR, CATEGORIA, DESCRICAO, META, CARTEIRA, DESTINO, CONFIRMACAO }

    /** Operações do menu, na ordem em que aparecem. */
    public enum Operacao { RECEITA, GASTO, META_DEPOSITO, META_RETIRADA, TRANSFERENCIA, SALDOS }

    @Id
    private String chatId;

    private String usuarioId;
    private Etapa etapa = Etapa.OCIOSO;
    private Operacao operacao;

    private BigDecimal valor;
    private String categoria;
    private String descricao;
    private Opcao meta;
    private Opcao carteira;
    private Opcao destino;

    // Última lista numerada mostrada (categorias, metas ou carteiras).
    private List<Opcao> opcoes = new ArrayList<>();

    // Id da última mensagem processada: evita processar duas vezes o mesmo
    // evento caso o WAHA reenvie o webhook.
    private String ultimaMensagemId;

    private Instant atualizadoEm;

    public ConversaWhatsApp() {}

    public ConversaWhatsApp(String chatId) {
        this.chatId = chatId;
    }

    /** Volta ao início do fluxo, descartando os dados da operação em andamento. */
    public void limparOperacao(Etapa novaEtapa) {
        this.etapa = novaEtapa;
        this.operacao = null;
        this.valor = null;
        this.categoria = null;
        this.descricao = null;
        this.meta = null;
        this.carteira = null;
        this.destino = null;
        this.opcoes = new ArrayList<>();
    }

    public String getChatId() { return chatId; }
    public String getUsuarioId() { return usuarioId; }
    public Etapa getEtapa() { return etapa; }
    public Operacao getOperacao() { return operacao; }
    public BigDecimal getValor() { return valor; }
    public String getCategoria() { return categoria; }
    public String getDescricao() { return descricao; }
    public Opcao getMeta() { return meta; }
    public Opcao getCarteira() { return carteira; }
    public Opcao getDestino() { return destino; }
    public List<Opcao> getOpcoes() { return opcoes; }
    public String getUltimaMensagemId() { return ultimaMensagemId; }
    public Instant getAtualizadoEm() { return atualizadoEm; }

    public void setChatId(String chatId) { this.chatId = chatId; }
    public void setUsuarioId(String usuarioId) { this.usuarioId = usuarioId; }
    public void setEtapa(Etapa etapa) { this.etapa = etapa; }
    public void setOperacao(Operacao operacao) { this.operacao = operacao; }
    public void setValor(BigDecimal valor) { this.valor = valor; }
    public void setCategoria(String categoria) { this.categoria = categoria; }
    public void setDescricao(String descricao) { this.descricao = descricao; }
    public void setMeta(Opcao meta) { this.meta = meta; }
    public void setCarteira(Opcao carteira) { this.carteira = carteira; }
    public void setDestino(Opcao destino) { this.destino = destino; }
    public void setOpcoes(List<Opcao> opcoes) { this.opcoes = opcoes == null ? new ArrayList<>() : new ArrayList<>(opcoes); }
    public void setUltimaMensagemId(String ultimaMensagemId) { this.ultimaMensagemId = ultimaMensagemId; }
    public void setAtualizadoEm(Instant atualizadoEm) { this.atualizadoEm = atualizadoEm; }
}
