package Projeto.MeuBolso.assistente;

import Projeto.MeuBolso.model.Orcamento;
import Projeto.MeuBolso.repository.OrcamentoRepository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import org.springframework.stereotype.Component;

/**
 * "Quanto posso gastar por dia até o fim do mês?" — divide o que restou do
 * orçamento pelos dias que faltam no mês (incluindo hoje).
 */
@Component
public class GastoPorDiaPergunta implements PerguntaPronta {

    private static final Locale PT_BR = Locale.forLanguageTag("pt-BR");

    private final OrcamentoRepository orcamentoRepository;
    private final GastosDoMes gastosDoMes;
    private final Clock clock;

    public GastoPorDiaPergunta(OrcamentoRepository orcamentoRepository, GastosDoMes gastosDoMes, Clock clock) {
        this.orcamentoRepository = orcamentoRepository;
        this.gastosDoMes = gastosDoMes;
        this.clock = clock;
    }

    @Override
    public String id() {
        return "gasto_por_dia";
    }

    @Override
    public String texto() {
        return "Quanto posso gastar por dia até o fim do mês?";
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
        BigDecimal restante = orcamento.subtract(gastosDoMes.total(usuarioId));

        LocalDate hoje = LocalDate.now(clock);
        int diasRestantes = hoje.lengthOfMonth() - hoje.getDayOfMonth() + 1;

        BigDecimal porDia;
        String texto;
        if (restante.signum() <= 0) {
            porDia = BigDecimal.ZERO.setScale(2, RoundingMode.DOWN);
            texto = "Você já usou todo o orçamento deste mês: não há valor livre por dia.";
        } else {
            porDia = restante.divide(BigDecimal.valueOf(diasRestantes), 2, RoundingMode.DOWN);
            String dias = diasRestantes == 1 ? "1 dia" : diasRestantes + " dias";
            texto = String.format(PT_BR, "Restam %s do orçamento e %s neste mês: dá para gastar até %s por dia.",
                FormatoBRL.moeda(restante), dias, FormatoBRL.moeda(porDia));
        }

        Map<String, Object> dados = new LinkedHashMap<>();
        dados.put("restante", restante);
        dados.put("diasRestantes", diasRestantes);
        dados.put("porDia", porDia);
        return new RespostaPronta(texto, dados);
    }

    private Optional<Orcamento> orcamentoDefinido(String usuarioId) {
        return orcamentoRepository.findByUsuarioId(usuarioId)
            .filter(o -> o.getValorMensal() != null && o.getValorMensal().signum() > 0);
    }
}
