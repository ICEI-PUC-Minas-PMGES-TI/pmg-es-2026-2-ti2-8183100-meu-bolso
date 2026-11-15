package Projeto.MeuBolso.assistente;

import Projeto.MeuBolso.model.Gasto;
import Projeto.MeuBolso.repository.GastoRepository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;

/**
 * Consulta de chat: lista os gastos mais recentes do usuário.
 *
 * Só existe no chat livre do Jarvis (não vira card das perguntas rápidas).
 * Reaproveita {@link FormatoBRL} para a formatação monetária pt-BR.
 */
@Component
public class GastosRecentesFerramenta implements FerramentaConsulta {

    private static final int QUANTIDADE_PADRAO = 5;
    private static final DateTimeFormatter DIA_MES = DateTimeFormatter.ofPattern("dd/MM");

    private final GastoRepository gastoRepository;

    public GastosRecentesFerramenta(GastoRepository gastoRepository) {
        this.gastoRepository = gastoRepository;
    }

    @Override
    public String id() {
        return "gastos_recentes";
    }

    @Override
    public String descricao() {
        return "Lista os gastos mais recentes lançados pelo usuário, com descrição, categoria, "
            + "valor e data. Use quando o usuário pedir seus últimos gastos, compras ou despesas recentes.";
    }

    @Override
    public boolean disponivel(String usuarioId) {
        return !gastoRepository.findByUsuarioIdOrderByDataDesc(usuarioId).isEmpty();
    }

    @Override
    public List<ParametroPergunta> parametros(String usuarioId) {
        return List.of(new ParametroPergunta("quantidade", "Quantos gastos listar", "opcao",
            List.of(new OpcaoParametro("5", "5 gastos"), new OpcaoParametro("10", "10 gastos"))));
    }

    @Override
    public RespostaPronta executar(String usuarioId, Map<String, String> params) {
        int quantidade = quantidadeDe(params);

        List<Gasto> recentes = gastoRepository.findByUsuarioIdOrderByDataDesc(usuarioId);
        if (recentes.size() > quantidade) {
            recentes = recentes.subList(0, quantidade);
        }

        int n = recentes.size();
        StringBuilder texto = new StringBuilder(
            n == 1 ? "Seu último gasto:" : "Seus últimos " + n + " gastos:");

        List<Map<String, Object>> linhasDados = new ArrayList<>();
        BigDecimal total = BigDecimal.ZERO;
        for (Gasto g : recentes) {
            BigDecimal valor = g.getValor() == null ? BigDecimal.ZERO : g.getValor();
            total = total.add(valor);

            String descricao = g.getDescricao() == null ? "Sem descrição" : g.getDescricao();
            String categoria = (g.getCategoria() == null || g.getCategoria().isBlank())
                ? "Sem categoria" : g.getCategoria();

            texto.append("\n• ").append(formatarData(g.getData()))
                .append(" — ").append(descricao)
                .append(" (").append(categoria).append("): ")
                .append(FormatoBRL.moeda(valor));

            Map<String, Object> dado = new LinkedHashMap<>();
            dado.put("descricao", descricao);
            dado.put("categoria", categoria);
            dado.put("valor", valor);
            dado.put("data", g.getData());
            linhasDados.add(dado);
        }
        texto.append("\nTotal listado: ").append(FormatoBRL.moeda(total));

        Map<String, Object> dados = new LinkedHashMap<>();
        dados.put("gastos", linhasDados);
        dados.put("total", total);
        return new RespostaPronta(texto.toString(), dados);
    }

    /** "5" ou "10" vindos do parâmetro; qualquer outra coisa cai no padrão. */
    private int quantidadeDe(Map<String, String> params) {
        String valor = params == null ? null : params.get("quantidade");
        if ("10".equals(valor)) return 10;
        if ("5".equals(valor)) return 5;
        return QUANTIDADE_PADRAO;
    }

    /** "AAAA-MM-DD" -> "dd/MM"; se a data não casar o formato, mostra o texto original. */
    private String formatarData(String data) {
        if (data == null) return "";
        try {
            return LocalDate.parse(data).format(DIA_MES);
        } catch (DateTimeParseException e) {
            return data;
        }
    }
}
