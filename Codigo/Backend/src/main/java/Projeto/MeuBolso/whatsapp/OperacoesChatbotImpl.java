package Projeto.MeuBolso.whatsapp;

import Projeto.MeuBolso.assistente.FormatoBRL;
import Projeto.MeuBolso.model.CarteiraUsuario;
import Projeto.MeuBolso.model.Meta;
import Projeto.MeuBolso.repository.CarteiraUsuarioRepository;
import Projeto.MeuBolso.repository.MetaRepository;
import Projeto.MeuBolso.service.CarteiraService;
import Projeto.MeuBolso.service.GastoService;
import Projeto.MeuBolso.service.MetaService;
import Projeto.MeuBolso.service.ReceitaService;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;

/**
 * Implementação das operações do chatbot sobre os services do site, para que
 * WhatsApp e site sigam exatamente as mesmas regras de negócio.
 */
@Component
public class OperacoesChatbotImpl implements OperacoesChatbot {

    // Gravado no campo "comentario" para identificar a origem do lançamento.
    private static final String COMENTARIO = "Registrado pelo WhatsApp";

    private final MetaRepository metaRepository;
    private final CarteiraUsuarioRepository carteiraRepository;
    private final MetaService metaService;
    private final GastoService gastoService;
    private final ReceitaService receitaService;
    private final CarteiraService carteiraService;
    private final Clock clock;

    public OperacoesChatbotImpl(MetaRepository metaRepository,
                                CarteiraUsuarioRepository carteiraRepository,
                                MetaService metaService,
                                GastoService gastoService,
                                ReceitaService receitaService,
                                CarteiraService carteiraService,
                                Clock clock) {
        this.metaRepository = metaRepository;
        this.carteiraRepository = carteiraRepository;
        this.metaService = metaService;
        this.gastoService = gastoService;
        this.receitaService = receitaService;
        this.carteiraService = carteiraService;
        this.clock = clock;
    }

    @Override
    public List<Opcao> metas(String usuarioId) {
        return metaRepository.findByUsuarioId(usuarioId).stream()
            .sorted(Comparator.comparing(m -> nulo(m.getNome()), String.CASE_INSENSITIVE_ORDER))
            .map(OperacoesChatbotImpl::opcaoDaMeta)
            .toList();
    }

    @Override
    public List<Opcao> contas(String usuarioId) {
        CarteiraUsuario c = carteiraRepository.findByUsuarioId(usuarioId).orElse(null);
        if (c == null) return List.of();
        List<Opcao> lista = new ArrayList<>();
        for (Map<String, Object> conta : c.getContas()) {
            BigDecimal saldo = numero(conta.get("saldo"));
            lista.add(new Opcao(texto(conta.get("id")), apelido(conta), "saldo " + FormatoBRL.moeda(saldo), saldo));
        }
        return lista;
    }

    @Override
    public void registrarReceita(String usuarioId, BigDecimal valor, String categoria, String descricao,
                                 Opcao carteira, LocalDate data) {
        receitaService.criar(usuarioId, descricao, categoria, carteira.nome(), data.toString(),
            valor, COMENTARIO, false, carteira.id());
    }

    @Override
    public void registrarGasto(String usuarioId, BigDecimal valor, String categoria, String descricao,
                               Opcao carteira, LocalDate data) {
        gastoService.criar(usuarioId, descricao, categoria, carteira.nome(), data.toString(),
            valor, COMENTARIO, false, carteira.id());
    }

    @Override
    public BigDecimal movimentarMeta(String usuarioId, String metaId, boolean deposito, BigDecimal valor, String contaId) {
        MetaService.MovimentacaoAplicada r = metaService.movimentar(
            usuarioId, metaId, deposito ? "deposito" : "retirada", valor, contaId, COMENTARIO);
        return r.meta().getValorAtual();
    }

    @Override
    public void transferir(String usuarioId, String origemId, String destinoId, BigDecimal valor) {
        carteiraService.transferir(usuarioId, origemId, destinoId, valor);
    }

    @Override
    public LocalDate hoje() {
        return LocalDate.now(clock);
    }

    private static Opcao opcaoDaMeta(Meta m) {
        BigDecimal atual = m.getValorAtual() == null ? BigDecimal.ZERO : m.getValorAtual();
        BigDecimal alvo = m.getValorAlvo() == null ? BigDecimal.ZERO : m.getValorAlvo();
        String detalhe = "guardado " + FormatoBRL.moeda(atual) + " de " + FormatoBRL.moeda(alvo);
        return new Opcao(m.getId(), nulo(m.getNome()), detalhe, atual);
    }

    private static String apelido(Map<String, Object> item) {
        String a = texto(item.get("apelido"));
        return a.isBlank() ? "Sem nome" : a;
    }

    private static String texto(Object o) {
        return o == null ? "" : o.toString();
    }

    private static String nulo(String s) {
        return s == null ? "" : s;
    }

    private static BigDecimal numero(Object o) {
        return o instanceof Number n ? new BigDecimal(n.toString()) : BigDecimal.ZERO;
    }
}
