package Projeto.MeuBolso.model;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "carteiras")
public class CarteiraUsuario {

    @Id
    private String id;

    @Indexed(unique = true)
    private String usuarioId;

    private List<Map<String, Object>> cartoes = new ArrayList<>();
    private List<Map<String, Object>> contas = new ArrayList<>();
    private List<Map<String, Object>> dinheiroEReservas = new ArrayList<>();
    private List<Map<String, Object>> movsDinheiro = new ArrayList<>();

    public CarteiraUsuario() {
    }

    public CarteiraUsuario(String usuarioId) {
        this.usuarioId = usuarioId;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUsuarioId() {
        return usuarioId;
    }

    public void setUsuarioId(String usuarioId) {
        this.usuarioId = usuarioId;
    }

    public List<Map<String, Object>> getCartoes() {
        return cartoes;
    }

    public void setCartoes(List<Map<String, Object>> cartoes) {
        this.cartoes = cartoes;
    }

    public List<Map<String, Object>> getContas() {
        return contas;
    }

    public void setContas(List<Map<String, Object>> contas) {
        this.contas = contas;
    }

    public List<Map<String, Object>> getDinheiroEReservas() {
        return dinheiroEReservas;
    }

    public void setDinheiroEReservas(List<Map<String, Object>> dinheiroEReservas) {
        this.dinheiroEReservas = dinheiroEReservas;
    }

    public List<Map<String, Object>> getMovsDinheiro() {
        return movsDinheiro;
    }

    public void setMovsDinheiro(List<Map<String, Object>> movsDinheiro) {
        this.movsDinheiro = movsDinheiro;
    }
}
