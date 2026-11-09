package Projeto.MeuBolso.whatsapp;

import static org.assertj.core.api.Assertions.assertThat;

import Projeto.MeuBolso.whatsapp.ConversaWhatsApp.Etapa;
import Projeto.MeuBolso.whatsapp.ConversaWhatsApp.Operacao;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

/**
 * Fluxo completo do chatbot com uma implementação em memória das operações
 * (sem Mockito, que não consegue gerar mocks de classes no JDK 26).
 */
class FluxoChatbotTest {

    private static final String USUARIO = "u1";

    OperacoesFalsas ops;
    FluxoChatbot fluxo;
    ConversaWhatsApp c;

    @BeforeEach
    void preparar() {
        ops = new OperacoesFalsas();
        fluxo = new FluxoChatbot(ops);
        c = new ConversaWhatsApp("123@lid");
        c.setUsuarioId(USUARIO);
    }

    // ---------- entrada e menu ----------

    @Test
    void qualquerMensagemInicialMostraSaudacaoEMenu() {
        String r = enviar("boa tarde");
        assertThat(r).startsWith("Olá, Gabriel!").contains("1 - Registrar depósito (receita)").contains("6 - Ver saldos e metas");
        assertThat(c.getEtapa()).isEqualTo(Etapa.MENU);
    }

    @Test
    void opcaoInvalidaNoMenuRepeteOMenu() {
        enviar("oi");
        assertThat(enviar("9")).startsWith("Não entendi").contains("O que você deseja fazer?");
        assertThat(enviar("abc")).startsWith("Não entendi");
        assertThat(c.getEtapa()).isEqualTo(Etapa.MENU);
    }

    @Test
    void zeroCancelaEmQualquerEtapa() {
        enviar("oi");
        enviar("2");
        enviar("50");
        assertThat(c.getEtapa()).isEqualTo(Etapa.CATEGORIA);
        assertThat(enviar("0")).startsWith("Operação cancelada.");
        assertThat(c.getEtapa()).isEqualTo(Etapa.MENU);
        assertThat(c.getOperacao()).isNull();
        assertThat(c.getValor()).isNull();
    }

    // ---------- 1 receita / 2 gasto ----------

    @Test
    void registraGastoComTodasAsEtapas() {
        enviar("oi");
        assertThat(enviar("2")).contains("valor do gasto");
        assertThat(enviar("25,90")).contains("Qual a categoria?").contains("1 - Alimentação");
        assertThat(enviar("1")).contains("descrição");
        assertThat(enviar("Mercado")).contains("De qual carteira o dinheiro saiu?")
            .contains("1 - Nubank (saldo").contains("3 - Itaú (Crédito)").contains("4 - Carteira");

        String resumo = enviar("3");
        assertThat(resumo).contains("Confirma o gasto?").contains("R$").contains("25,90")
            .contains("Alimentação").contains("Mercado").contains("Itaú (Crédito)").contains("21/10/2026");

        String fim = enviar("1");
        assertThat(fim).startsWith("✅ Gasto de").contains("Itaú (Crédito)").contains("O que você deseja fazer?");
        assertThat(ops.registros).containsExactly("gasto 25.90 Alimentação Mercado cred-1 2026-10-21");
        assertThat(c.getEtapa()).isEqualTo(Etapa.MENU);
    }

    @Test
    void registraReceitaUsandoACategoriaComoDescricao() {
        enviar("oi");
        enviar("1");
        assertThat(enviar("1.500")).contains("1 - Salário");
        enviar("1");
        enviar("-");
        enviar("1");
        assertThat(c.getDescricao()).isEqualTo("Salário");
        enviar("1");
        assertThat(ops.registros).containsExactly("receita 1500.00 Salário Salário conta-1 2026-10-21");
    }

    @Test
    void valorInvalidoPedeDeNovoSemSairDaEtapa() {
        enviar("oi");
        enviar("2");
        assertThat(enviar("cinquenta")).startsWith("Valor inválido");
        assertThat(enviar("-5")).startsWith("Valor inválido");
        assertThat(c.getEtapa()).isEqualTo(Etapa.VALOR);
    }

    @Test
    void numeroForaDaListaPedeDeNovo() {
        enviar("oi");
        enviar("2");
        enviar("10");
        assertThat(enviar("99")).startsWith("Opção inválida").contains("1 - Alimentação");
        assertThat(c.getEtapa()).isEqualTo(Etapa.CATEGORIA);
    }

    @Test
    void cancelarNaConfirmacaoNaoGrava() {
        enviar("oi");
        enviar("2");
        enviar("10");
        enviar("1");
        enviar("-");
        enviar("1");
        assertThat(enviar("x")).isEqualTo("Responda 1 para confirmar ou 2 para cancelar.");
        assertThat(enviar("2")).startsWith("Operação cancelada.");
        assertThat(ops.registros).isEmpty();
    }

    // ---------- 3/4 metas ----------

    @Test
    void depositaNaMeta() {
        enviar("oi");
        enviar("3");
        assertThat(enviar("100")).contains("Em qual meta").contains("1 - Viagem (guardado");
        assertThat(enviar("1")).contains("De qual conta vai sair").contains("1 - Nubank").doesNotContain("Crédito");
        assertThat(enviar("1")).contains("Confirma o depósito na meta?").contains("Viagem").contains("Nubank");
        assertThat(enviar("1")).contains("Agora a meta tem");
        assertThat(ops.registros).containsExactly("meta deposito m1 100.00 conta-1");
    }

    @Test
    void depositoMaiorQueOSaldoDaContaPedeOutraConta() {
        enviar("oi");
        enviar("3");
        enviar("400");
        enviar("1");
        assertThat(enviar("2")).startsWith("Saldo insuficiente em Inter");
        assertThat(c.getEtapa()).isEqualTo(Etapa.CARTEIRA);
        assertThat(enviar("1")).contains("Confirma o depósito na meta?");
    }

    @Test
    void retiradaMaiorQueOGuardadoPedeOutraMeta() {
        enviar("oi");
        enviar("4");
        enviar("300");
        assertThat(enviar("1")).startsWith("A meta Viagem tem só");
        assertThat(c.getEtapa()).isEqualTo(Etapa.META);
    }

    @Test
    void semMetasAvisaLogoNoMenu() {
        ops.metas.clear();
        enviar("oi");
        assertThat(enviar("3")).contains("cadastre antes uma meta na página Metas");
        assertThat(c.getEtapa()).isEqualTo(Etapa.MENU);
    }

    @Test
    void erroDeRegraNaConfirmacaoMostraOMotivoEVoltaAoMenu() {
        ops.falhaComMotivo = "Meta não encontrada.";
        enviar("oi");
        enviar("3");
        enviar("10");
        enviar("1");
        enviar("1");
        assertThat(enviar("1")).startsWith("❌ Não foi possível concluir: Meta não encontrada.");
        assertThat(c.getEtapa()).isEqualTo(Etapa.MENU);
    }

    // ---------- 5 transferência ----------

    @Test
    void transfereEntreContasSemOferecerAOrigemComoDestino() {
        enviar("oi");
        enviar("5");
        enviar("50");
        enviar("1");
        String destinos = enviar("x");
        assertThat(destinos).startsWith("Opção inválida");
        assertThat(c.getEtapa()).isEqualTo(Etapa.DESTINO);
        assertThat(c.getOpcoes()).extracting(Opcao::id).containsExactly("conta-2");
        enviar("1");
        assertThat(enviar("1")).startsWith("✅ Transferência de");
        assertThat(ops.registros).containsExactly("transferencia conta-1 conta-2 50.00");
    }

    @Test
    void transferenciaExigeDuasContas() {
        ops.contas.remove(1);
        enviar("oi");
        assertThat(enviar("5")).contains("pelo menos duas contas bancárias");
    }

    // ---------- 6 saldos ----------

    @Test
    void mostraSaldosEMetasEFicaNoMenu() {
        enviar("oi");
        String r = enviar("6");
        assertThat(r).contains("Seus saldos").contains("Nubank").contains("Total em contas")
            .contains("Suas metas").contains("Viagem").contains("O que você deseja fazer?");
        assertThat(c.getEtapa()).isEqualTo(Etapa.MENU);
        assertThat(c.getOperacao()).isNull();
    }

    @Test
    void opcoesDoMenuSeguemAOrdemDoEnum() {
        assertThat(Operacao.values()).containsExactly(
            Operacao.RECEITA, Operacao.GASTO, Operacao.META_DEPOSITO,
            Operacao.META_RETIRADA, Operacao.TRANSFERENCIA, Operacao.SALDOS);
    }

    // ---------- auxiliares ----------

    private String enviar(String texto) {
        return fluxo.processar(c, texto, "Gabriel Hermont");
    }

    /** Operações em memória: 2 contas, 1 cartão, 1 dinheiro e 1 meta. */
    static class OperacoesFalsas implements OperacoesChatbot {
        final List<Opcao> contas = new ArrayList<>(List.of(
            new Opcao("conta-1", "Nubank", "saldo R$ 500,00", new BigDecimal("500")),
            new Opcao("conta-2", "Inter", "saldo R$ 50,00", new BigDecimal("50"))));
        final List<Opcao> metas = new ArrayList<>(List.of(
            new Opcao("m1", "Viagem", "guardado R$ 200,00 de R$ 1.000,00", new BigDecimal("200"))));
        final List<String> registros = new ArrayList<>();
        String falhaComMotivo;

        @Override public List<Opcao> metas(String usuarioId) { return metas; }
        @Override public List<Opcao> contas(String usuarioId) { return contas; }

        @Override
        public List<Opcao> carteirasDeLancamento(String usuarioId) {
            List<Opcao> l = new ArrayList<>(contas);
            l.add(new Opcao("cred-1", "Itaú (Crédito)", "cartão de crédito", null));
            l.add(new Opcao("din-1", "Carteira", "dinheiro em espécie", null));
            return l;
        }

        @Override
        public void registrarReceita(String u, BigDecimal valor, String categoria, String descricao, Opcao carteira, LocalDate data) {
            registros.add("receita " + valor + " " + categoria + " " + descricao + " " + carteira.id() + " " + data);
        }

        @Override
        public void registrarGasto(String u, BigDecimal valor, String categoria, String descricao, Opcao carteira, LocalDate data) {
            registros.add("gasto " + valor + " " + categoria + " " + descricao + " " + carteira.id() + " " + data);
        }

        @Override
        public BigDecimal movimentarMeta(String u, String metaId, boolean deposito, BigDecimal valor, String contaId) {
            if (falhaComMotivo != null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, falhaComMotivo);
            registros.add("meta " + (deposito ? "deposito" : "retirada") + " " + metaId + " " + valor + " " + contaId);
            return new BigDecimal("300");
        }

        @Override
        public void transferir(String u, String origemId, String destinoId, BigDecimal valor) {
            registros.add("transferencia " + origemId + " " + destinoId + " " + valor);
        }

        @Override public LocalDate hoje() { return LocalDate.of(2026, 10, 21); }
    }
}
