package Projeto.MeuBolso.service;

import Projeto.MeuBolso.model.Gasto;
import Projeto.MeuBolso.model.Meta;
import Projeto.MeuBolso.model.MovimentacaoDtos.MovimentacaoResponse;
import Projeto.MeuBolso.model.MovimentacaoMeta;
import Projeto.MeuBolso.model.Receita;
import Projeto.MeuBolso.model.Transferencia;
import Projeto.MeuBolso.repository.GastoRepository;
import Projeto.MeuBolso.repository.MetaRepository;
import Projeto.MeuBolso.repository.MovimentacaoMetaRepository;
import Projeto.MeuBolso.repository.ReceitaRepository;
import Projeto.MeuBolso.repository.TransferenciaRepository;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;

/**
 * Histórico unificado das carteiras: junta gastos, receitas, movimentações de
 * metas e transferências numa só lista, do mais recente para o mais antigo.
 *
 * Regra de sinal (do ponto de vista da carteira):
 *  - gasto: sai (negativo);            - receita: entra (positivo);
 *  - depósito em meta: sai da conta;   - retirada de meta: entra na conta;
 *  - transferência: sai da origem e entra no destino (gera duas linhas).
 */
@Service
public class MovimentacaoService {

    private final GastoRepository gastoRepository;
    private final ReceitaRepository receitaRepository;
    private final MovimentacaoMetaRepository movimentacaoMetaRepository;
    private final MetaRepository metaRepository;
    private final TransferenciaRepository transferenciaRepository;
    private final GastoRecorrenciaService gastoRecorrenciaService;
    private final ReceitaRecorrenciaService receitaRecorrenciaService;
    private final Clock clock;

    public MovimentacaoService(GastoRepository gastoRepository,
                               ReceitaRepository receitaRepository,
                               MovimentacaoMetaRepository movimentacaoMetaRepository,
                               MetaRepository metaRepository,
                               TransferenciaRepository transferenciaRepository,
                               GastoRecorrenciaService gastoRecorrenciaService,
                               ReceitaRecorrenciaService receitaRecorrenciaService,
                               Clock clock) {
        this.gastoRepository = gastoRepository;
        this.receitaRepository = receitaRepository;
        this.movimentacaoMetaRepository = movimentacaoMetaRepository;
        this.metaRepository = metaRepository;
        this.transferenciaRepository = transferenciaRepository;
        this.gastoRecorrenciaService = gastoRecorrenciaService;
        this.receitaRecorrenciaService = receitaRecorrenciaService;
        this.clock = clock;
    }

    /** Histórico completo do usuário, mais recente primeiro. */
    public List<MovimentacaoResponse> listar(String usuarioId) {
        // Mesmo comportamento das listagens de gastos/receitas: gera antes os
        // lançamentos recorrentes já vencidos, para o histórico não ficar atrás.
        gastoRecorrenciaService.processar(usuarioId);
        receitaRecorrenciaService.processar(usuarioId);

        Map<String, String> nomesDasMetas = new HashMap<>();
        for (Meta m : metaRepository.findByUsuarioId(usuarioId)) {
            nomesDasMetas.put(m.getId(), m.getNome());
        }

        return unificar(
            gastoRepository.findByUsuarioIdOrderByDataDesc(usuarioId),
            receitaRepository.findByUsuarioIdOrderByDataDesc(usuarioId),
            movimentacaoMetaRepository.findByUsuarioId(usuarioId),
            nomesDasMetas,
            transferenciaRepository.findByUsuarioId(usuarioId),
            clock.getZone());
    }

    /**
     * Junta as quatro fontes numa lista ordenada (data desc; no mesmo dia, as
     * que têm horário — metas e transferências — vêm pelo horário desc).
     * Função pura, sem acesso a banco, para facilitar os testes.
     */
    static List<MovimentacaoResponse> unificar(List<Gasto> gastos,
                                               List<Receita> receitas,
                                               List<MovimentacaoMeta> movsMeta,
                                               Map<String, String> nomesDasMetas,
                                               List<Transferencia> transferencias,
                                               ZoneId zona) {
        List<Linha> linhas = new ArrayList<>();

        for (Gasto g : gastos) {
            linhas.add(new Linha(null, new MovimentacaoResponse(
                "gasto-" + g.getId(), "gasto", g.getDescricao(), g.getCategoria(),
                g.getData(), negativo(g.getValor()), false, g.getCarteiraId())));
        }

        for (Receita r : receitas) {
            linhas.add(new Linha(null, new MovimentacaoResponse(
                "receita-" + r.getId(), "receita", r.getDescricao(), r.getCategoria(),
                r.getData(), positivo(r.getValor()), true, r.getCarteiraId())));
        }

        for (MovimentacaoMeta m : movsMeta) {
            boolean deposito = "deposito".equals(m.getTipo());
            String nomeMeta = nomesDasMetas.getOrDefault(m.getMetaId(), "excluída");
            String descricao = deposito ? "Depósito na meta " + nomeMeta : "Retirada da meta " + nomeMeta;
            linhas.add(new Linha(m.getData(), new MovimentacaoResponse(
                "meta-" + m.getId(), "meta", descricao, "Meta", dia(m.getData(), zona),
                // Depósito tira dinheiro da conta; retirada devolve.
                deposito ? negativo(m.getValor()) : positivo(m.getValor()),
                !deposito, m.getCarteiraId())));
        }

        for (Transferencia t : transferencias) {
            String dia = dia(t.getData(), zona);
            linhas.add(new Linha(t.getData(), new MovimentacaoResponse(
                "transferencia-" + t.getId() + "-saida", "transferencia",
                "Transferência para " + nome(t.getDestinoNome()), "Transferência",
                dia, negativo(t.getValor()), false, t.getOrigemId())));
            linhas.add(new Linha(t.getData(), new MovimentacaoResponse(
                "transferencia-" + t.getId() + "-entrada", "transferencia",
                "Transferência de " + nome(t.getOrigemNome()), "Transferência",
                dia, positivo(t.getValor()), true, t.getDestinoId())));
        }

        Comparator<Linha> porData = Comparator.comparing(
            (Linha l) -> l.resposta().data() == null ? "" : l.resposta().data());
        Comparator<Linha> porHorario = Comparator.comparing(
            Linha::horario, Comparator.nullsFirst(Comparator.naturalOrder()));
        linhas.sort(porData.thenComparing(porHorario).reversed());

        return linhas.stream().map(Linha::resposta).toList();
    }

    // Linha + horário (quando existir) só para ordenar.
    private record Linha(Instant horario, MovimentacaoResponse resposta) {}

    private static String dia(Instant instante, ZoneId zona) {
        return instante == null ? "" : LocalDate.ofInstant(instante, zona).toString();
    }

    private static BigDecimal negativo(BigDecimal v) {
        return v == null ? BigDecimal.ZERO : v.abs().negate();
    }

    private static BigDecimal positivo(BigDecimal v) {
        return v == null ? BigDecimal.ZERO : v.abs();
    }

    private static String nome(String s) {
        return s == null || s.isBlank() ? "outra conta" : s;
    }
}
