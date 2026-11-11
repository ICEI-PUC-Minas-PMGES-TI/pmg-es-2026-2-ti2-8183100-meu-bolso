package Projeto.MeuBolso.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import Projeto.MeuBolso.model.Meta;
import Projeto.MeuBolso.model.MovimentacaoMeta;
import Projeto.MeuBolso.repository.MetaRepository;
import Projeto.MeuBolso.repository.MovimentacaoMetaRepository;
import java.math.BigDecimal;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class MetaServiceTest {

    private static final String USUARIO = "u1";
    private static final String META_ID = "m1";
    private static final String CONTA = "conta-1";

    @Mock
    MetaRepository metaRepository;

    @Mock
    MovimentacaoMetaRepository movimentacaoRepository;

    @Mock
    CarteiraService carteiraService;

    MetaService service;

    Meta meta;

    @BeforeEach
    void preparar() {
        service = new MetaService(metaRepository, movimentacaoRepository, carteiraService);
        meta = new Meta(USUARIO, "Viagem", new BigDecimal("1000"), null, "alta");
        meta.setId(META_ID);
        meta.setValorAtual(new BigDecimal("100"));
    }

    @Test
    void depositoDebitaAContaECreditaAMeta() {
        metaExiste();
        gravacaoOk();
        BigDecimal valor = new BigDecimal("50");
        when(carteiraService.saldoDe(USUARIO, CONTA)).thenReturn(new BigDecimal("500"));
        when(carteiraService.ajustarSaldo(USUARIO, CONTA, valor.negate())).thenReturn(true);
        var r = service.movimentar(USUARIO, META_ID, "deposito", valor, CONTA, "  Aporte  ");
        assertThat(r.meta().getValorAtual()).isEqualByComparingTo("150");
        assertThat(r.movimentacao().getTipo()).isEqualTo("deposito");
        assertThat(r.movimentacao().getTitulo()).isEqualTo("Aporte");
        verify(carteiraService).ajustarSaldo(USUARIO, CONTA, valor.negate());
    }

    @Test
    void retiradaCreditaAContaEDebitaAMeta() {
        metaExiste();
        gravacaoOk();
        BigDecimal valor = new BigDecimal("40");
        lenient().when(carteiraService.saldoDe(USUARIO, CONTA)).thenReturn(new BigDecimal("500"));
        when(carteiraService.ajustarSaldo(USUARIO, CONTA, valor)).thenReturn(true);
        var r = service.movimentar(USUARIO, META_ID, "retirada", valor, CONTA, null);
        assertThat(r.meta().getValorAtual()).isEqualByComparingTo("60");
        assertThat(r.movimentacao().getTipo()).isEqualTo("retirada");
    }

    @Test
    void tituloNuloViraTextoVazio() {
        metaExiste();
        gravacaoOk();
        BigDecimal valor = new BigDecimal("10");
        when(carteiraService.saldoDe(USUARIO, CONTA)).thenReturn(new BigDecimal("500"));
        when(carteiraService.ajustarSaldo(USUARIO, CONTA, valor.negate())).thenReturn(true);
        var r = service.movimentar(USUARIO, META_ID, "deposito", valor, CONTA, null);
        assertThat(r.movimentacao().getTitulo()).isEmpty();
    }

    @Test
    void depositoMaiorQueOSaldoFalhaSemEfeitos() {
        metaExiste();
        when(carteiraService.saldoDe(USUARIO, CONTA)).thenReturn(new BigDecimal("30"));
        assertThat(falha("deposito", "50", CONTA).getStatusCode().value()).isEqualTo(400);
        semEfeitos();
    }

    @Test
    void retiradaMaiorQueOValorDaMetaFalhaSemEfeitos() {
        metaExiste();
        lenient().when(carteiraService.saldoDe(USUARIO, CONTA)).thenReturn(new BigDecimal("500"));
        assertThat(falha("retirada", "150", CONTA).getStatusCode().value()).isEqualTo(400);
        semEfeitos();
    }

    @Test
    void carteiraInvalidaOuDinheiroFisicoFalhaSemEfeitos() {
        metaExiste();
        // saldoDe devolve null (padrão do mock): não é uma conta bancária.
        assertThat(falha("deposito", "10", "din-1").getStatusCode().value()).isEqualTo(400);
        semEfeitos();
    }

    @Test
    void falhaAoAjustarACarteiraNaoGravaNada() {
        metaExiste();
        when(carteiraService.saldoDe(USUARIO, CONTA)).thenReturn(new BigDecimal("500"));
        when(carteiraService.ajustarSaldo(any(), any(), any())).thenReturn(false);
        assertThat(falha("deposito", "10", CONTA).getStatusCode().value()).isEqualTo(400);
        verify(metaRepository, never()).save(any());
        verifyNoInteractions(movimentacaoRepository);
    }

    @Test
    void metaDeOutroUsuarioOuInexistenteRetorna404() {
        when(metaRepository.findByIdAndUsuarioId(META_ID, USUARIO)).thenReturn(Optional.empty());
        assertThat(falha("deposito", "10", CONTA).getStatusCode().value()).isEqualTo(404);
        verifyNoInteractions(carteiraService);
        verifyNoInteractions(movimentacaoRepository);
    }

    // ---------- auxiliares ----------

    private void metaExiste() {
        when(metaRepository.findByIdAndUsuarioId(META_ID, USUARIO)).thenReturn(Optional.of(meta));
    }

    private void gravacaoOk() {
        when(metaRepository.save(any(Meta.class))).thenAnswer(i -> i.getArgument(0));
        when(movimentacaoRepository.save(any(MovimentacaoMeta.class))).thenAnswer(i -> i.getArgument(0));
    }

    private ResponseStatusException falha(String tipo, String valor, String carteiraId) {
        return assertThrows(ResponseStatusException.class,
            () -> service.movimentar(USUARIO, META_ID, tipo, new BigDecimal(valor), carteiraId, null));
    }

    private void semEfeitos() {
        assertThat(meta.getValorAtual()).isEqualByComparingTo("100");
        verify(carteiraService, never()).ajustarSaldo(any(), any(), any());
        verify(metaRepository, never()).save(any());
        verifyNoInteractions(movimentacaoRepository);
    }
}
