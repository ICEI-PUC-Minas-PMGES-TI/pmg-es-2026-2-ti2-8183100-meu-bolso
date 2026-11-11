package Projeto.MeuBolso.assistente;

import Projeto.MeuBolso.model.Meta;
import Projeto.MeuBolso.repository.MetaRepository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.stereotype.Component;

/**
 * "Quanto já guardei nas metas?" — soma o guardado em todas as metas e aponta
 * a meta mais avançada (maior percentual individual).
 */
@Component
public class MetasTotalGuardadoPergunta implements PerguntaPronta {

    private static final BigDecimal CEM = BigDecimal.valueOf(100);

    private final MetaRepository metaRepository;

    public MetasTotalGuardadoPergunta(MetaRepository metaRepository) {
        this.metaRepository = metaRepository;
    }

    @Override
    public String id() {
        return "metas_total_guardado";
    }

    @Override
    public String texto() {
        return "Quanto já guardei nas metas?";
    }

    @Override
    public boolean disponivel(String usuarioId) {
        return !metaRepository.findByUsuarioId(usuarioId).isEmpty();
    }

    @Override
    public RespostaPronta responder(String usuarioId, Map<String, String> params) {
        List<Meta> metas = metaRepository.findByUsuarioId(usuarioId);

        BigDecimal totalGuardado = BigDecimal.ZERO;
        BigDecimal totalAlvo = BigDecimal.ZERO;
        for (Meta m : metas) {
            totalGuardado = totalGuardado.add(valor(m.getValorAtual()));
            totalAlvo = totalAlvo.add(valor(m.getValorAlvo()));
        }

        int percentual = percentual(totalGuardado, totalAlvo);
        int quantidade = metas.size();

        // Mais avançada: maior percentual individual; empate = ordem alfabética do nome.
        Meta maisAvancada = metas.stream()
            .max(Comparator.<Meta>comparingInt(m -> percentual(valor(m.getValorAtual()), valor(m.getValorAlvo())))
                .thenComparing(Comparator.comparing(Meta::getNome).reversed()))
            .orElseThrow();
        int percMaisAvancada = percentual(valor(maisAvancada.getValorAtual()), valor(maisAvancada.getValorAlvo()));

        String metasPalavra = quantidade == 1 ? "1 meta" : quantidade + " metas";
        String texto = String.format(
            "Você já guardou %s em %s, %d%% do total de %s. A mais avançada é \"%s\" (%d%%).",
            FormatoBRL.moeda(totalGuardado), metasPalavra, percentual, FormatoBRL.moeda(totalAlvo),
            maisAvancada.getNome(), percMaisAvancada);

        Map<String, Object> avancada = new LinkedHashMap<>();
        avancada.put("nome", maisAvancada.getNome());
        avancada.put("percentual", percMaisAvancada);

        Map<String, Object> dados = new LinkedHashMap<>();
        dados.put("totalGuardado", totalGuardado);
        dados.put("totalAlvo", totalAlvo);
        dados.put("percentual", percentual);
        dados.put("quantidade", quantidade);
        dados.put("maisAvancada", avancada);
        return new RespostaPronta(texto, dados);
    }

    private static int percentual(BigDecimal guardado, BigDecimal alvo) {
        if (alvo.signum() <= 0) {
            return 0;
        }
        return guardado.multiply(CEM).divide(alvo, 0, RoundingMode.HALF_UP).intValueExact();
    }

    private static BigDecimal valor(BigDecimal v) {
        return Optional.ofNullable(v).orElse(BigDecimal.ZERO);
    }
}
