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
     * valor > 0 = recebeu; valor < 0 = estorno. Espelho de aplicarGasto para
     * entradas: uma receita SOMA no saldo da conta (gasto subtrai).
     * Sem efeito em dinheiro ou item inexistente.
     *
     * Para cartões: crédito abate a fatura (reduz faturaAtual); débito credita
     * a conta vinculada. Dinheiro em espécie é gerido direto na tela da carteira.
     */
    public void aplicarReceita(String usuarioId, String carteiraId, BigDecimal valor) {
        if (carteiraId == null || carteiraId.isBlank() || valor == null || valor.signum() == 0) return;

        CarteiraUsuario c = repo.findByUsuarioId(usuarioId).orElse(null);
        if (c == null) return;

        boolean mudou = false;
        Map<String, Object> conta = achar(c.getContas(), carteiraId);
        if (conta != null) {
            mudou = somar(conta, "saldo", valor);
        } else {
            Map<String, Object> cartao = achar(c.getCartoes(), carteiraId);
            if (cartao != null) {
                if ("credito".equals(cartao.get("subtipo"))) {
                    mudou = somar(cartao, "faturaAtual", valor.negate());
                } else if (cartao.get("contaId") instanceof String contaId) {
                    Map<String, Object> contaDoDebito = achar(c.getContas(), contaId);
                    if (contaDoDebito != null) mudou = somar(contaDoDebito, "saldo", valor);
                }
            }
        }

        if (mudou) {
            c.setVersao(c.getVersao() + 1);
            repo.save(c);
        }
    }

    /**
     * Saldo atual de uma conta bancária.
     * Retorna null se a conta não existir ou não tiver saldo numérico.
     * Usado para validar movimentações de meta antes de aplicá-las.
     */
    public BigDecimal saldoDe(String usuarioId, String carteiraId) {
        if (carteiraId == null || carteiraId.isBlank()) return null;
        CarteiraUsuario c = repo.findByUsuarioId(usuarioId).orElse(null);
        if (c == null) return null;

        Map<String, Object> item = achar(c.getContas(), carteiraId);
        if (item == null) return null;

        Object saldo = item.get("saldo");
        return saldo instanceof Number n ? new BigDecimal(n.toString()) : BigDecimal.ZERO;
    }

    /**
     * Ajusta o saldo de uma conta bancária.
     * `delta` positivo entra na conta; negativo sai. Retorna true se gravou.
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
        if (item == null) return false;

        somar(item, "saldo", delta);
        c.setVersao(c.getVersao() + 1);
        repo.save(c);
        return true;
    }

    /**
     * Indica se o usuário tem pelo menos uma conta cadastrada na carteira.
     * Usado para bloquear o lançamento de gastos/receitas sem conta.
     */
    public boolean possuiConta(String usuarioId) {
        CarteiraUsuario c = repo.findByUsuarioId(usuarioId).orElse(null);
        return c != null && c.getContas() != null && !c.getContas().isEmpty();
    }

    /**
     * Indica se o id informado corresponde a uma conta existente na carteira
     * do usuário. Gastos e receitas só podem ser lançados em uma conta válida.
     */
    public boolean contaExiste(String usuarioId, String carteiraId) {
        if (carteiraId == null || carteiraId.isBlank()) return false;
        CarteiraUsuario c = repo.findByUsuarioId(usuarioId).orElse(null);
        if (c == null) return false;
        return achar(c.getContas(), carteiraId) != null;
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
