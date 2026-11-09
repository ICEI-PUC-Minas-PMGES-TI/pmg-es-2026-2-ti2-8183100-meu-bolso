package Projeto.MeuBolso.assistente;

import Projeto.MeuBolso.model.Orcamento;
import Projeto.MeuBolso.repository.OrcamentoRepository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import org.springframework.stereotype.Component;

/**
 * "Estou dentro do orçamento?" — compara o gasto do mês com o teto mensal.
 *
 * A situação (dentro/atencao/estourou) é decidida por comparação exata entre
 * gasto e orçamento (gasto*100 vs 80*orçamento), não pelo percentual arredondado.
 */
@Component
public class OrcamentoStatusPergunta implements PerguntaPronta {

    private static final Locale PT_BR = Locale.forLanguageTag("pt-BR");
    private static final BigDecimal CEM = BigDecimal.valueOf(100);
    private static final BigDecimal OITENTA = BigDecimal.valueOf(80);

    private final OrcamentoRepository orcamentoRepository;
    private final GastosDoMes gastosDoMes;

    public OrcamentoStatusPergunta(OrcamentoRepository orcamentoRepository, GastosDoMes gastosDoMes) {
        this.orcamentoRepository = orcamentoRepository;
        this.gastosDoMes = gastosDoMes;
    }

    @Override
    public String id() {
        return "orcamento_status";
    }

    @Override
    public String texto() {
        return "Estou dentro do orçamento?";
    }

    @Override
    public boolean disponivel(String usuarioId) {
        return orcamentoDefinido(usuarioId).isPresent();
    }

    @Override
    public RespostaPronta responder(String usuarioId, Map<String, String> params) {
        BigDecimal orcamento = orcamentoDefinido(usuarioId)
            .map(Orcamento::getValorMensal)
            .orElse(BigDecimal.ZERO);
        BigDecimal gasto = gastosDoMes.total(usuarioId);
        BigDecimal restante = orcamento.subtract(gasto);

        int percentual = gasto.multiply(CEM)
            .divide(orcamento, 0, RoundingMode.HALF_UP)
            .intValueExact();

        // Comparação exata: gasto*100 vs 80*orçamento e gasto vs orçamento.
        BigDecimal gastoX100 = gasto.multiply(CEM);
        BigDecimal limiteAtencao = OITENTA.multiply(orcamento);
        String situacao;
        String texto;
        if (gasto.compareTo(orcamento) > 0) {
            situacao = "estourou";
            texto = String.format(PT_BR, "Você passou do orçamento em %s (%s de %s).",
                FormatoBRL.moeda(restante.negate()), FormatoBRL.moeda(gasto), FormatoBRL.moeda(orcamento));
        } else if (gastoX100.compareTo(limiteAtencao) < 0) {
            situacao = "dentro";
            texto = String.format(PT_BR, "Você está dentro do orçamento: usou %d%% (%s de %s). Restam %s.",
                percentual, FormatoBRL.moeda(gasto), FormatoBRL.moeda(orcamento), FormatoBRL.moeda(restante));
        } else {
            situacao = "atencao";
            texto = String.format(PT_BR, "Atenção: você já usou %d%% do orçamento (%s de %s). Restam %s.",
                percentual, FormatoBRL.moeda(gasto), FormatoBRL.moeda(orcamento), FormatoBRL.moeda(restante));
        }

        Map<String, Object> dados = new LinkedHashMap<>();
        dados.put("orcamento", orcamento);
        dados.put("gasto", gasto);
        dados.put("restante", restante);
        dados.put("percentual", percentual);
        dados.put("situacao", situacao);
        return new RespostaPronta(texto, dados);
    }

    private Optional<Orcamento> orcamentoDefinido(String usuarioId) {
        // Orçamento do mês corrente (casa com o mês dos gastos de GastosDoMes).
        return orcamentoRepository.findByUsuarioIdAndMes(usuarioId, gastosDoMes.mesAtualChave())
            .filter(o -> o.getValorMensal() != null && o.getValorMensal().signum() > 0);
    }
}
