package Projeto.MeuBolso.assistente;

import Projeto.MeuBolso.model.Receita;
import Projeto.MeuBolso.repository.ReceitaRepository;

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
 * Consulta de chat: soma e detalha as receitas de um período, com filtro opcional
 * por categoria. Espelho simétrico da {@link GastosPeriodoFerramenta} para entradas.
 *
 * Compartilha o cálculo de intervalos ({@link PeriodoConsulta}) e as utilidades
 * de texto ({@link TextoConsulta}); usa {@link FormatoBRL} (pt-BR).
 */
@Component
public class ReceitasPeriodoFerramenta implements FerramentaConsulta {

    private static final int MAX_CATEGORIAS_LISTADAS = 10;

    private final ReceitaRepository receitaRepository;
    private final Clock clock;

    public ReceitasPeriodoFerramenta(ReceitaRepository receitaRepository, Clock clock) {
        this.receitaRepository = receitaRepository;
        this.clock = clock;
    }

    @Override
    public String id() {
        return "receitas_periodo";
    }

    @Override
    public String descricao() {
        return "Soma e detalha as receitas (entradas de dinheiro, salário, rendimentos) do usuário em um período, "
            + "podendo filtrar por categoria. Use quando o usuário perguntar quanto recebeu, quanto entrou ou "
            + "quais receitas teve este mês, no mês passado, nos últimos 7 ou 30 dias.";
    }

    @Override
    public boolean disponivel(String usuarioId) {
        return !receitaRepository.findByUsuarioIdOrderByDataDesc(usuarioId).isEmpty();
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

        List<Receita> doPeriodo = receitaRepository.findPorPeriodo(
            usuarioId, periodo.inicio().toString(), periodo.fim().toString());

        List<Receita> filtradas = comCategoria
            ? doPeriodo.stream().filter(r -> TextoConsulta.mesmaCategoria(r.getCategoria(), categoria)).toList()
            : doPeriodo;

        if (filtradas.isEmpty()) {
            return new RespostaPronta(textoVazio(usuarioId, categoria, comCategoria),
                dadosVazios(periodo, comCategoria ? categoria : null));
        }

        return montarResposta(periodo, categoria, comCategoria, filtradas);
    }

    // ---------- Resposta com receitas ----------

    private RespostaPronta montarResposta(PeriodoConsulta periodo, String categoria,
                                          boolean comCategoria, List<Receita> receitas) {
        BigDecimal total = BigDecimal.ZERO;
        for (Receita r : receitas) {
            total = total.add(valor(r));
        }
        int n = receitas.size();

        StringBuilder texto = new StringBuilder();
        texto.append("Receitas ").append(periodo.rotulo())
            .append(" (").append(TextoConsulta.formatarData(periodo.inicio().toString()))
            .append(" a ").append(TextoConsulta.formatarData(periodo.fim().toString())).append(")");
        if (comCategoria) {
            texto.append(" em ").append(categoria);
        }
        texto.append(":");
        texto.append("\nTotal: ").append(FormatoBRL.moeda(total))
            .append(" (").append(n).append(n == 1 ? " receita)" : " receitas)");

        // Até 3 maiores entradas (por valor desc).
        List<Receita> maiores = receitas.stream()
            .sorted(Comparator.comparing(this::valor).reversed())
            .limit(3)
            .toList();
        texto.append("\nMaiores entradas:");
        List<Map<String, Object>> maioresDados = new ArrayList<>();
        for (Receita r : maiores) {
            String descricao = r.getDescricao() == null ? "Sem descrição" : r.getDescricao();
            String cat = (r.getCategoria() == null || r.getCategoria().isBlank())
                ? "Sem categoria" : r.getCategoria();
            texto.append("\n• ").append(TextoConsulta.formatarData(r.getData()))
                .append(" — ").append(descricao)
                .append(" (").append(cat).append("): ")
                .append(FormatoBRL.moeda(valor(r)));

            Map<String, Object> d = new LinkedHashMap<>();
            d.put("descricao", descricao);
            d.put("categoria", cat);
            d.put("valor", valor(r));
            d.put("data", r.getData());
            maioresDados.add(d);
        }

        // Total por categoria (sempre nos dados; no texto só sem filtro e com 2+).
        Map<String, BigDecimal> porCategoria = totalPorCategoria(receitas);
        if (!comCategoria && porCategoria.size() >= 2) {
            texto.append("\nDe onde veio:");
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
    private Map<String, BigDecimal> totalPorCategoria(List<Receita> receitas) {
        Map<String, BigDecimal> somas = new LinkedHashMap<>();
        for (Receita r : receitas) {
            String cat = (r.getCategoria() == null || r.getCategoria().isBlank())
                ? "Sem categoria" : r.getCategoria();
            somas.merge(cat, valor(r), BigDecimal::add);
        }
        Map<String, BigDecimal> ordenado = new LinkedHashMap<>();
        somas.entrySet().stream()
            .sorted(Map.Entry.<String, BigDecimal>comparingByValue().reversed())
            .forEach(e -> ordenado.put(e.getKey(), e.getValue()));
        return ordenado;
    }

    // ---------- Resposta sem receitas ----------

    private String textoVazio(String usuarioId, String categoria, boolean comCategoria) {
        if (!comCategoria) {
            return "Você não teve receitas neste período.";
        }
        if (categoriaExiste(usuarioId, categoria)) {
            return "Você não teve receitas em " + categoria + " neste período.";
        }
        return "Não encontrei a categoria \"" + categoria + "\". Suas categorias de receita: "
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

    /** true se a categoria existe em alguma receita do usuário (qualquer período). */
    private boolean categoriaExiste(String usuarioId, String categoria) {
        return receitaRepository.findByUsuarioIdOrderByDataDesc(usuarioId).stream()
            .anyMatch(r -> TextoConsulta.mesmaCategoria(r.getCategoria(), categoria));
    }

    /** Categorias de receita do usuário em ordem alfabética, até MAX_CATEGORIAS_LISTADAS. */
    private String categoriasDoUsuario(String usuarioId) {
        TreeSet<String> categorias = new TreeSet<>();
        for (Receita r : receitaRepository.findByUsuarioIdOrderByDataDesc(usuarioId)) {
            if (r.getCategoria() != null && !r.getCategoria().isBlank()) {
                categorias.add(r.getCategoria());
            }
        }
        return categorias.stream().limit(MAX_CATEGORIAS_LISTADAS).reduce((a, b) -> a + ", " + b).orElse("");
    }

    private BigDecimal valor(Receita r) {
        return r.getValor() == null ? BigDecimal.ZERO : r.getValor();
    }
}
