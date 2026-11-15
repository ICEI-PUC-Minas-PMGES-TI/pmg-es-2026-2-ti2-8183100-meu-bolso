package Projeto.MeuBolso.assistente;

import Projeto.MeuBolso.model.Gasto;
import Projeto.MeuBolso.repository.GastoRepository;

import java.math.BigDecimal;
import java.time.Clock;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeSet;
import org.springframework.stereotype.Component;

/**
 * Consulta de chat: soma e detalha os gastos de um período, com filtro opcional
 * por categoria. Só existe no chat do Jarvis (não vira card das perguntas rápidas).
 *
 * A regra de "hoje"/"mês corrente" vem do {@link Clock} injetado; os valores
 * usam {@link FormatoBRL} (pt-BR).
 */
@Component
public class GastosPeriodoFerramenta implements FerramentaConsulta {

    private static final int MAX_CATEGORIAS_LISTADAS = 10;

    private final GastoRepository gastoRepository;
    private final Clock clock;

    public GastosPeriodoFerramenta(GastoRepository gastoRepository, Clock clock) {
        this.gastoRepository = gastoRepository;
        this.clock = clock;
    }

    @Override
    public String id() {
        return "gastos_periodo";
    }

    @Override
    public String descricao() {
        return "Soma e detalha os gastos do usuário em um período, podendo filtrar por uma categoria. "
            + "Use quando o usuário perguntar quanto gastou este mês, no mês passado, nos últimos 7 ou 30 dias, "
            + "ou com uma categoria específica (ex.: Alimentação).";
    }

    @Override
    public boolean disponivel(String usuarioId) {
        return !gastoRepository.findByUsuarioIdOrderByDataDesc(usuarioId).isEmpty();
    }

    @Override
    public List<ParametroPergunta> parametros(String usuarioId) {
        return List.of(
            new ParametroPergunta("periodo", "Período", "opcao", List.of(
                new OpcaoParametro("mes_atual", "Este mês"),
                new OpcaoParametro("mes_anterior", "Mês passado"),
                new OpcaoParametro("ultimos_7_dias", "Últimos 7 dias"),
                new OpcaoParametro("ultimos_30_dias", "Últimos 30 dias"))),
            new ParametroPergunta("categoria", "Categoria (opcional)", "texto", List.of()));
    }

    @Override
    public RespostaPronta executar(String usuarioId, Map<String, String> params) {
        PeriodoConsulta periodo = PeriodoConsulta.de(clock, params == null ? null : params.get("periodo"));
        String categoria = params == null ? null : params.get("categoria");
        boolean comCategoria = categoria != null && !categoria.isBlank();

        List<Gasto> doPeriodo = gastoRepository.findPorPeriodo(
            usuarioId, periodo.inicio().toString(), periodo.fim().toString());

        List<Gasto> filtrados = comCategoria
            ? doPeriodo.stream().filter(g -> TextoConsulta.mesmaCategoria(g.getCategoria(), categoria)).toList()
            : doPeriodo;

        if (filtrados.isEmpty()) {
            return new RespostaPronta(textoVazio(usuarioId, categoria, comCategoria),
                dadosVazios(periodo, comCategoria ? categoria : null));
        }

        return montarResposta(periodo, categoria, comCategoria, filtrados);
    }

    // ---------- Resposta com gastos ----------

    private RespostaPronta montarResposta(PeriodoConsulta periodo, String categoria,
                                          boolean comCategoria, List<Gasto> gastos) {
        BigDecimal total = BigDecimal.ZERO;
        for (Gasto g : gastos) {
            total = total.add(valor(g));
        }
        int n = gastos.size();

        StringBuilder texto = new StringBuilder();
        texto.append("Gastos ").append(periodo.rotulo())
            .append(" (").append(TextoConsulta.formatarData(periodo.inicio().toString()))
            .append(" a ").append(TextoConsulta.formatarData(periodo.fim().toString())).append(")");
        if (comCategoria) {
            texto.append(" em ").append(categoria);
        }
        texto.append(":");
        texto.append("\nTotal: ").append(FormatoBRL.moeda(total))
            .append(" (").append(n).append(n == 1 ? " gasto)" : " gastos)");

        // Até 3 maiores gastos (por valor desc).
        List<Gasto> maiores = gastos.stream()
            .sorted(Comparator.comparing(this::valor).reversed())
            .limit(3)
            .toList();
        texto.append("\nMaiores gastos:");
        List<Map<String, Object>> maioresDados = new ArrayList<>();
        for (Gasto g : maiores) {
            String descricao = g.getDescricao() == null ? "Sem descrição" : g.getDescricao();
            String cat = (g.getCategoria() == null || g.getCategoria().isBlank())
                ? "Sem categoria" : g.getCategoria();
            texto.append("\n• ").append(TextoConsulta.formatarData(g.getData()))
                .append(" — ").append(descricao)
                .append(" (").append(cat).append("): ")
                .append(FormatoBRL.moeda(valor(g)));

            Map<String, Object> d = new LinkedHashMap<>();
            d.put("descricao", descricao);
            d.put("categoria", cat);
            d.put("valor", valor(g));
            d.put("data", g.getData());
            maioresDados.add(d);
        }

        // Total por categoria (sempre nos dados; no texto só sem filtro e com 2+).
        Map<String, BigDecimal> porCategoria = totalPorCategoria(gastos);
        if (!comCategoria && porCategoria.size() >= 2) {
            texto.append("\nOnde mais gastou:");
            porCategoria.entrySet().stream()
                .sorted(Map.Entry.<String, BigDecimal>comparingByValue().reversed())
                .limit(3)
                .forEach(e -> texto.append("\n• ").append(e.getKey())
                    .append(": ").append(FormatoBRL.moeda(e.getValue())));
        }

        Map<String, Object> dados = new LinkedHashMap<>();
        dados.put("periodo", periodo.id());
        dados.put("inicio", periodo.inicio().toString());
        dados.put("fim", periodo.fim().toString());
        dados.put("categoria", comCategoria ? categoria : null);
        dados.put("total", total);
        dados.put("quantidade", n);
        dados.put("maiores", maioresDados);
        dados.put("porCategoria", porCategoria);
        return new RespostaPronta(texto.toString(), dados);
    }

    /** Totais por categoria, preservando a ordem de maior para menor. */
    private Map<String, BigDecimal> totalPorCategoria(List<Gasto> gastos) {
        Map<String, BigDecimal> somas = new LinkedHashMap<>();
        for (Gasto g : gastos) {
            String cat = (g.getCategoria() == null || g.getCategoria().isBlank())
                ? "Sem categoria" : g.getCategoria();
            somas.merge(cat, valor(g), BigDecimal::add);
        }
        Map<String, BigDecimal> ordenado = new LinkedHashMap<>();
        somas.entrySet().stream()
            .sorted(Map.Entry.<String, BigDecimal>comparingByValue().reversed())
            .forEach(e -> ordenado.put(e.getKey(), e.getValue()));
        return ordenado;
    }

    // ---------- Resposta sem gastos ----------

    private String textoVazio(String usuarioId, String categoria, boolean comCategoria) {
        if (!comCategoria) {
            return "Você não teve gastos neste período.";
        }
        if (categoriaExiste(usuarioId, categoria)) {
            return "Você não teve gastos em " + categoria + " neste período.";
        }
        return "Não encontrei a categoria \"" + categoria + "\". Suas categorias: "
            + categoriasDoUsuario(usuarioId) + ".";
    }

    private Map<String, Object> dadosVazios(PeriodoConsulta periodo, String categoria) {
        Map<String, Object> dados = new LinkedHashMap<>();
        dados.put("periodo", periodo.id());
        dados.put("inicio", periodo.inicio().toString());
        dados.put("fim", periodo.fim().toString());
        dados.put("categoria", categoria);
        dados.put("total", BigDecimal.ZERO);
        dados.put("quantidade", 0);
        dados.put("maiores", List.of());
        dados.put("porCategoria", Map.of());
        return dados;
    }

    /** true se a categoria existe em algum gasto do usuário (qualquer período). */
    private boolean categoriaExiste(String usuarioId, String categoria) {
        return gastoRepository.findByUsuarioIdOrderByDataDesc(usuarioId).stream()
            .anyMatch(g -> TextoConsulta.mesmaCategoria(g.getCategoria(), categoria));
    }

    /** Categorias do usuário em ordem alfabética, até MAX_CATEGORIAS_LISTADAS. */
    private String categoriasDoUsuario(String usuarioId) {
        TreeSet<String> categorias = new TreeSet<>();
        for (Gasto g : gastoRepository.findByUsuarioIdOrderByDataDesc(usuarioId)) {
            if (g.getCategoria() != null && !g.getCategoria().isBlank()) {
                categorias.add(g.getCategoria());
            }
        }
        return categorias.stream().limit(MAX_CATEGORIAS_LISTADAS).reduce((a, b) -> a + ", " + b).orElse("");
    }

    // ---------- Utilitários ----------

    private BigDecimal valor(Gasto g) {
        return g.getValor() == null ? BigDecimal.ZERO : g.getValor();
    }
}
