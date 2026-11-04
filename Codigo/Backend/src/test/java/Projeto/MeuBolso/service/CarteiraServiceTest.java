package Projeto.MeuBolso.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import Projeto.MeuBolso.model.CarteiraUsuario;
import Projeto.MeuBolso.repository.CarteiraUsuarioRepository;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class CarteiraServiceTest {

    private static final String USUARIO = "u1";

    @Mock
    CarteiraUsuarioRepository repo;

    CarteiraService service;

    CarteiraUsuario carteira;

    @BeforeEach
    void preparar() {
        service = new CarteiraService(repo);
        carteira = new CarteiraUsuario(USUARIO);
        carteira.setContas(lista(item("id", "conta-1", "tipo", "conta", "saldo", 1000.0)));
        carteira.setCartoes(lista(
            item("id", "cred-1", "tipo", "cartao", "subtipo", "credito", "faturaAtual", 200.0),
            item("id", "deb-1", "tipo", "cartao", "subtipo", "debito", "contaId", "conta-1")));
        carteira.setDinheiroEReservas(lista(
            item("id", "din-1", "tipo", "dinheiro", "saldo", 180.0)));
    }

    // ---------- aplicarGasto ----------

    @Test
    void gastoEmContaDiminuiSaldoESobeVersao() {
        carregar();
        service.aplicarGasto(USUARIO, "conta-1", new BigDecimal("100.50"));
        assertThat(numero(carteira.getContas(), "conta-1", "saldo")).isEqualTo(899.5);
        assertThat(carteira.getVersao()).isEqualTo(1);
        verify(repo).save(carteira);
    }

    @Test
    void estornoDevolveSaldoDaConta() {
        carregar();
        service.aplicarGasto(USUARIO, "conta-1", new BigDecimal("-100"));
        assertThat(numero(carteira.getContas(), "conta-1", "saldo")).isEqualTo(1100.0);
    }

    @Test
    void gastoNoCreditoAumentaFatura() {
        carregar();
        service.aplicarGasto(USUARIO, "cred-1", new BigDecimal("80"));
        assertThat(numero(carteira.getCartoes(), "cred-1", "faturaAtual")).isEqualTo(280.0);
        assertThat(numero(carteira.getContas(), "conta-1", "saldo")).isEqualTo(1000.0);
        verify(repo).save(carteira);
    }

    @Test
    void gastoNoDebitoDiminuiSaldoDaContaLigada() {
        carregar();
        service.aplicarGasto(USUARIO, "deb-1", new BigDecimal("40"));
        assertThat(numero(carteira.getContas(), "conta-1", "saldo")).isEqualTo(960.0);
    }

    @Test
    void gastoEmDinheiroNaoAlteraNada() {
        carregar();
        service.aplicarGasto(USUARIO, "din-1", new BigDecimal("50"));
        assertThat(numero(carteira.getDinheiroEReservas(), "din-1", "saldo")).isEqualTo(180.0);
        verify(repo, never()).save(any());
    }

    @Test
    void itemInexistenteNaoGrava() {
        carregar();
        service.aplicarGasto(USUARIO, "nao-existe", new BigDecimal("10"));
        verify(repo, never()).save(any());
    }

    @Test
    void usuarioSemCarteiraNaoGrava() {
        when(repo.findByUsuarioId(USUARIO)).thenReturn(Optional.empty());
        service.aplicarGasto(USUARIO, "conta-1", new BigDecimal("10"));
        verify(repo, never()).save(any());
    }

    @Test
    void entradasInvalidasNemConsultamORepositorio() {
        service.aplicarGasto(USUARIO, null, new BigDecimal("10"));
        service.aplicarGasto(USUARIO, " ", new BigDecimal("10"));
        service.aplicarGasto(USUARIO, "conta-1", BigDecimal.ZERO);
        service.aplicarGasto(USUARIO, "conta-1", null);
        verifyNoInteractions(repo);
    }

    // ---------- saldoDe ----------

    @Test
    void saldoDeContaRetornaOSaldo() {
        carregar();
        assertThat(service.saldoDe(USUARIO, "conta-1")).isEqualByComparingTo("1000");
    }

    @Test
    void saldoDeDinheiroFisicoNaoEhMovimentavel() {
        carregar();
        assertThat(service.saldoDe(USUARIO, "din-1")).isNull();
    }

    @Test
    void saldoDeCartaoRetornaNull() {
        carregar();
        assertThat(service.saldoDe(USUARIO, "cred-1")).isNull();
    }

    // ---------- ajustarSaldo ----------

    @Test
    void ajustarSaldoDaContaSomaEGrava() {
        carregar();
        boolean ok = service.ajustarSaldo(USUARIO, "conta-1", new BigDecimal("-250"));
        assertThat(ok).isTrue();
        assertThat(numero(carteira.getContas(), "conta-1", "saldo")).isEqualTo(750.0);
        assertThat(carteira.getVersao()).isEqualTo(1);
        verify(repo).save(carteira);
    }

    @Test
    void ajustarSaldoNaoMexeEmDinheiroFisico() {
        carregar();
        assertThat(service.ajustarSaldo(USUARIO, "din-1", new BigDecimal("10"))).isFalse();
        assertThat(numero(carteira.getDinheiroEReservas(), "din-1", "saldo")).isEqualTo(180.0);
        verify(repo, never()).save(any());
    }

    @Test
    void ajustarSaldoComDeltaZeroNaoFazNada() {
        assertThat(service.ajustarSaldo(USUARIO, "conta-1", BigDecimal.ZERO)).isFalse();
        verifyNoInteractions(repo);
    }

    // ---------- auxiliares ----------

    private void carregar() {
        when(repo.findByUsuarioId(USUARIO)).thenReturn(Optional.of(carteira));
    }

    private static Map<String, Object> item(Object... pares) {
        Map<String, Object> m = new HashMap<>();
        for (int i = 0; i < pares.length; i += 2) {
            m.put((String) pares[i], pares[i + 1]);
        }
        return m;
    }

    @SafeVarargs
    private static List<Map<String, Object>> lista(Map<String, Object>... itens) {
        return new ArrayList<>(List.of(itens));
    }

    private static double numero(List<Map<String, Object>> itens, String id, String campo) {
        return itens.stream()
            .filter(i -> id.equals(i.get("id")))
            .findFirst()
            .map(i -> ((Number) i.get(campo)).doubleValue())
            .orElseThrow();
    }
}
