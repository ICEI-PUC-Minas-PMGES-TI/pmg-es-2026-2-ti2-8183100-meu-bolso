package Projeto.MeuBolso.assistente;

import Projeto.MeuBolso.model.Meta;
import Projeto.MeuBolso.repository.MetaRepository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

/**
 * "Quanto falta para minha meta?" — mostra o quanto falta para a meta escolhida
 * (parâmetro metaId) e, quando há prazo futuro, quanto guardar por mês.
 */
@Component
public class MetaFaltantePergunta implements PerguntaPronta {

    private static final BigDecimal CEM = BigDecimal.valueOf(100);
    private static final DateTimeFormatter DIA_MES = DateTimeFormatter.ofPattern("dd/MM");

    private final MetaRepository metaRepository;
    private final Clock clock;

    public MetaFaltantePergunta(MetaRepository metaRepository, Clock clock) {
        this.metaRepository = metaRepository;
        this.clock = clock;
    }

    @Override
    public String id() {
        return "meta_faltante";
    }

    @Override
    public String texto() {
        return "Quanto falta para minha meta?";
    }

    @Override
    public boolean disponivel(String usuarioId) {
        return !metaRepository.findByUsuarioId(usuarioId).isEmpty();
    }

    @Override
    public List<ParametroPergunta> parametros(String usuarioId) {
        List<OpcaoParametro> opcoes = metaRepository.findByUsuarioId(usuarioId).stream()
            .map(m -> new OpcaoParametro(m.getId(), m.getNome()))
            .toList();
        return List.of(new ParametroPergunta("metaId", "Qual meta?", "opcao", opcoes));
    }

    @Override
    public RespostaPronta responder(String usuarioId, Map<String, String> params) {
        String metaId = params.get("metaId");
        Meta meta = metaRepository.findByIdAndUsuarioId(metaId, usuarioId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Parâmetro inválido: metaId"));

        BigDecimal alvo = valor(meta.getValorAlvo());
        BigDecimal atual = valor(meta.getValorAtual());
        BigDecimal faltante = alvo.subtract(atual).max(BigDecimal.ZERO);
        int percentual = alvo.signum() > 0
            ? atual.multiply(CEM).divide(alvo, 0, RoundingMode.HALF_UP).intValueExact()
            : 0;

        LocalDate hoje = LocalDate.now(clock);
        LocalDate prazo = meta.getPrazo();

        String situacao;
        String texto;
        Integer mesesRestantes = null;
        BigDecimal porMes = null;

        if (atual.compareTo(alvo) >= 0) {
            situacao = "atingida";
            texto = String.format("Parabéns! Você já atingiu a meta \"%s\": %s de %s.",
                meta.getNome(), FormatoBRL.moeda(atual), FormatoBRL.moeda(alvo));
        } else if (prazo == null) {
            situacao = "sem_prazo";
            texto = String.format(
                "Para a meta \"%s\" faltam %s (você já guardou %s de %s, %d%%). "
                    + "Defina um prazo para eu calcular quanto guardar por mês.",
                meta.getNome(), FormatoBRL.moeda(faltante), FormatoBRL.moeda(atual),
                FormatoBRL.moeda(alvo), percentual);
        } else if (prazo.isBefore(hoje)) {
            situacao = "vencida";
            texto = String.format("O prazo da meta \"%s\" já passou (%s) e ainda faltam %s.",
                meta.getNome(), prazo.format(DIA_MES), FormatoBRL.moeda(faltante));
        } else {
            situacao = "em_andamento";
            mesesRestantes = (int) Math.max(1, ChronoUnit.MONTHS.between(hoje, prazo));
            porMes = faltante.divide(BigDecimal.valueOf(mesesRestantes), 2, RoundingMode.UP);
            String meses = mesesRestantes == 1 ? "1 mês" : mesesRestantes + " meses";
            texto = String.format(
                "Para a meta \"%s\" faltam %s (%d%% já guardado: %s de %s). Até %s são %s: guarde %s por mês.",
                meta.getNome(), FormatoBRL.moeda(faltante), percentual, FormatoBRL.moeda(atual),
                FormatoBRL.moeda(alvo), prazo.format(DIA_MES), meses, FormatoBRL.moeda(porMes));
        }

        Map<String, Object> dados = new LinkedHashMap<>();
        dados.put("nome", meta.getNome());
        dados.put("valorAlvo", alvo);
        dados.put("valorAtual", atual);
        dados.put("faltante", faltante);
        dados.put("percentual", percentual);
        dados.put("prazo", prazo == null ? null : prazo.toString());
        dados.put("mesesRestantes", mesesRestantes);
        dados.put("porMes", porMes);
        dados.put("situacao", situacao);
        return new RespostaPronta(texto, dados);
    }

    private static BigDecimal valor(BigDecimal v) {
        return Optional.ofNullable(v).orElse(BigDecimal.ZERO);
    }
}
