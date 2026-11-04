package Projeto.MeuBolso.service;

import Projeto.MeuBolso.model.CarteiraUsuario;
import Projeto.MeuBolso.repository.CarteiraUsuarioRepository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class CarteiraService {

    private final CarteiraUsuarioRepository repo;

    public CarteiraService(CarteiraUsuarioRepository repo) {
        this.repo = repo;
    }

    /** valor > 0 = gastou; valor < 0 = estorno. Sem efeito em dinheiro ou item inexistente. */
    public void aplicarGasto(String usuarioId, String carteiraId, BigDecimal valor) {
        if (carteiraId == null || carteiraId.isBlank() || valor == null || valor.signum() == 0) return;

        CarteiraUsuario c = repo.findByUsuarioId(usuarioId).orElse(null);
        if (c == null) return;

        boolean mudou = false;
        Map<String, Object> conta = achar(c.getContas(), carteiraId);
        if (conta != null) {
            mudou = somar(conta, "saldo", valor.negate());
        } else {
            Map<String, Object> cartao = achar(c.getCartoes(), carteiraId);
            if (cartao != null) {
                if ("credito".equals(cartao.get("subtipo"))) {
                    mudou = somar(cartao, "faturaAtual", valor);
                } else if (cartao.get("contaId") instanceof String contaId) {
                    Map<String, Object> contaDoDebito = achar(c.getContas(), contaId);
                    if (contaDoDebito != null) mudou = somar(contaDoDebito, "saldo", valor.negate());
                }
            }
        }

        if (mudou) {
            c.setVersao(c.getVersao() + 1);
            repo.save(c);
        }
    }

    /**
     * Saldo atual de uma carteira movimentável (conta ou dinheiro físico).
     * Retorna null se a carteira não existir ou não tiver saldo numérico.
     * Usado para validar movimentações de meta antes de aplicá-las.
     */
    public BigDecimal saldoDe(String usuarioId, String carteiraId) {
        if (carteiraId == null || carteiraId.isBlank()) return null;
        CarteiraUsuario c = repo.findByUsuarioId(usuarioId).orElse(null);
        if (c == null) return null;

        Map<String, Object> item = achar(c.getContas(), carteiraId);
        if (item == null) item = acharDinheiro(c.getDinheiroEReservas(), carteiraId);
        if (item == null) return null;

        Object saldo = item.get("saldo");
        return saldo instanceof Number n ? new BigDecimal(n.toString()) : BigDecimal.ZERO;
    }

    /**
     * Ajusta o saldo de uma carteira movimentável (conta ou dinheiro físico).
     * `delta` positivo entra na carteira; negativo sai. Retorna true se gravou.
     * Diferente de aplicarGasto: aqui o sinal do delta é aplicado direto no saldo
     * (usado pelas movimentações de meta).
     */
    public boolean ajustarSaldo(String usuarioId, String carteiraId, BigDecimal delta) {
        if (carteiraId == null || carteiraId.isBlank() || delta == null || delta.signum() == 0) {
            return false;
        }
        CarteiraUsuario c = repo.findByUsuarioId(usuarioId).orElse(null);
        if (c == null) return false;

        Map<String, Object> item = achar(c.getContas(), carteiraId);
        if (item == null) item = acharDinheiro(c.getDinheiroEReservas(), carteiraId);
        if (item == null) return false;

        somar(item, "saldo", delta);
        c.setVersao(c.getVersao() + 1);
        repo.save(c);
        return true;
    }

    // Acha um item de dinheiro físico (tipo "dinheiro") na lista dinheiroEReservas.
    private static Map<String, Object> acharDinheiro(List<Map<String, Object>> lista, String id) {
        if (lista == null) return null;
        for (Map<String, Object> item : lista) {
            if (id.equals(item.get("id")) && "dinheiro".equals(item.get("tipo"))) return item;
        }
        return null;
    }

    private static Map<String, Object> achar(List<Map<String, Object>> lista, String id) {
        if (lista == null) return null;
        for (Map<String, Object> item : lista) {
            if (id.equals(item.get("id"))) return item;
        }
        return null;
    }

    private static boolean somar(Map<String, Object> item, String campo, BigDecimal delta) {
        Object atual = item.get(campo);
        BigDecimal base = atual instanceof Number n ? new BigDecimal(n.toString()) : BigDecimal.ZERO;
        item.put(campo, base.add(delta).setScale(2, RoundingMode.HALF_UP).doubleValue());
        return true;
    }
}
