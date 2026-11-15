package Projeto.MeuBolso.assistente;

import Projeto.MeuBolso.model.Recorrencia;
import Projeto.MeuBolso.repository.RecorrenciaRepository;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import org.springframework.stereotype.Component;

/**
 * "Quais gastos fixos saem todo mês?" — resume as recorrências ativas do
 * usuário (quantidade, total mensal/anual, a maior) e projeta as próximas
 * cobranças a partir de hoje, respeitando os meses pulados.
 *
 * Reaproveita {@link FormatoBRL} (formatação monetária pt-BR). A regra de
 * "hoje"/"mês corrente" vem do {@link Clock} injetado.
 */
@Component
public class RecorrenciasPergunta implements PerguntaPronta {

    private static final Locale PT_BR = Locale.forLanguageTag("pt-BR");
    private static final BigDecimal DOZE = BigDecimal.valueOf(12);
    private static final DateTimeFormatter DIA_MES = DateTimeFormatter.ofPattern("dd/MM");
    private static final int MAX_PROXIMAS = 3;

    private final RecorrenciaRepository recorrenciaRepository;
    private final Clock clock;

    public RecorrenciasPergunta(RecorrenciaRepository recorrenciaRepository, Clock clock) {
        this.recorrenciaRepository = recorrenciaRepository;
        this.clock = clock;
    }

    @Override
    public String id() {
        return "recorrencias";
    }

    @Override
    public String texto() {
        return "Quais gastos fixos saem todo mês?";
    }

    @Override
    public boolean disponivel(String usuarioId) {
        return !ativas(usuarioId).isEmpty();
    }

    @Override
    public RespostaPronta responder(String usuarioId, Map<String, String> params) {
        List<Recorrencia> ativas = ativas(usuarioId);

        BigDecimal totalMensal = BigDecimal.ZERO;
        for (Recorrencia r : ativas) {
            totalMensal = totalMensal.add(valor(r));
        }
        BigDecimal totalAnual = totalMensal.multiply(DOZE);

        // Maior valor; empate pela ordem alfabética da descrição.
        Recorrencia maior = ativas.stream()
            .max(Comparator.comparing(RecorrenciasPergunta::valor)
                .thenComparing(Comparator.comparing(Recorrencia::getDescricao).reversed()))
            .orElseThrow();

        List<Map<String, Object>> proximas = proximasCobrancas(ativas);

        String texto = montarTexto(ativas.size(), totalMensal, totalAnual, maior, proximas);

        Map<String, Object> maiorDados = new LinkedHashMap<>();
        maiorDados.put("nome", maior.getDescricao());
        maiorDados.put("valor", valor(maior));

        Map<String, Object> dados = new LinkedHashMap<>();
        dados.put("quantidade", ativas.size());
        dados.put("totalMensal", totalMensal);
        dados.put("totalAnual", totalAnual);
        dados.put("maior", maiorDados);
        dados.put("proximas", proximas);

        return new RespostaPronta(texto, dados);
    }

    private String montarTexto(int quantidade, BigDecimal totalMensal, BigDecimal totalAnual,
                               Recorrencia maior, List<Map<String, Object>> proximas) {
        String plural = quantidade == 1 ? "" : "s";
        StringBuilder texto = new StringBuilder(String.format(PT_BR,
            "Você tem %d gasto%s recorrente%s ativo%s, somando %s por mês (%s por ano). O maior é %s (%s).",
            quantidade, plural, plural, plural,
            FormatoBRL.moeda(totalMensal), FormatoBRL.moeda(totalAnual),
            maior.getDescricao(), FormatoBRL.moeda(valor(maior))));

        if (!proximas.isEmpty()) {
            List<String> partes = new ArrayList<>();
            for (Map<String, Object> p : proximas) {
                LocalDate data = LocalDate.parse((String) p.get("data"));
                partes.add(String.format(PT_BR, "%s (%s, %s)",
                    p.get("nome"), data.format(DIA_MES), FormatoBRL.moeda((BigDecimal) p.get("valor"))));
            }
            texto.append(String.format(PT_BR, " Próximas cobranças: %s.", String.join(", ", partes)));
        }
        return texto.toString();
    }

    // Até 3 próximas cobranças a partir de hoje, ordenadas por data e depois descrição.
    private List<Map<String, Object>> proximasCobrancas(List<Recorrencia> ativas) {
        LocalDate hoje = LocalDate.now(clock);

        List<Map<String, Object>> proximas = new ArrayList<>();
        for (Recorrencia r : ativas) {
            LocalDate data = proximaData(r, hoje);
            if (data != null) {
                Map<String, Object> item = new LinkedHashMap<>();
                item.put("nome", r.getDescricao());
                item.put("valor", valor(r));
                item.put("data", data.toString());
                proximas.add(item);
            }
        }

        proximas.sort(Comparator
            .comparing((Map<String, Object> m) -> (String) m.get("data"))
            .thenComparing(m -> (String) m.get("nome")));

        return proximas.stream().limit(MAX_PROXIMAS).toList();
    }

    // Primeira data >= hoje cujo mês ("AAAA-MM") não esteja pulado, olhando o mês
    // atual e o seguinte. Dia = min(diaDoMes, último dia do mês). null se ambos pulados.
    private static LocalDate proximaData(Recorrencia r, LocalDate hoje) {
        List<String> pulados = r.getMesesPulados();
        YearMonth mes = YearMonth.from(hoje);
        for (int i = 0; i < 2; i++) {
            if (!pulados.contains(mes.toString())) {
                int dia = Math.min(r.getDiaDoMes(), mes.lengthOfMonth());
                LocalDate data = mes.atDay(dia);
                if (!data.isBefore(hoje)) {
                    return data;
                }
            }
            mes = mes.plusMonths(1);
        }
        return null;
    }

    private List<Recorrencia> ativas(String usuarioId) {
        return recorrenciaRepository.findByUsuarioId(usuarioId).stream()
            .filter(Recorrencia::isAtiva)
            .toList();
    }

    private static BigDecimal valor(Recorrencia r) {
        return Optional.ofNullable(r.getValor()).orElse(BigDecimal.ZERO);
    }
}
