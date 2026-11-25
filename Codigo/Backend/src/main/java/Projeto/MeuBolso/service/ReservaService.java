package Projeto.MeuBolso.service;

import Projeto.MeuBolso.assistente.FormatoBRL;
import Projeto.MeuBolso.model.Gasto;
import Projeto.MeuBolso.model.Meta;
import Projeto.MeuBolso.model.Orcamento;
import Projeto.MeuBolso.model.Recorrencia;
import Projeto.MeuBolso.repository.GastoRepository;
import Projeto.MeuBolso.repository.OrcamentoRepository;
import Projeto.MeuBolso.repository.RecorrenciaRepository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;

/**
 * Reserva de emergência (RF-03): estimativa do custo de vida, valor mínimo
 * sugerido para 3, 6 ou 12 meses e nível de alerta da reserva.
 *
 * O mínimo é uma PROSPECÇÃO dos próximos N meses (a partir do mês que vem),
 * mês a mês:
 *   gastos fixos previstos (recorrências ativas, respeitando os meses pulados)
 * + média dos gastos variáveis (não recorrentes) dos últimos 3 meses completos.
 *
 * Sem histórico, usa a primeira base disponível, nesta ordem:
 *   1. histórico (acima);
 *   2. orçamento do mês atual × N;
 *   3. só os gastos fixos previstos;
 *   4. custo mensal informado pelo usuário × N.
 * Sem nenhuma base, não há sugestão (null).
 *
 * O valor sugerido é arredondado para cima, na centena. Nada é gravado: tudo
 * é calculado na consulta, então o mínimo automático acompanha os gastos.
 */
@Service
public class ReservaService {

    public static final List<Integer> HORIZONTES = List.of(3, 6, 12);
    public static final int HORIZONTE_PADRAO = 6;

    // Bases do cálculo (devolvidas para a tela explicar de onde veio o número).
    public static final String BASE_HISTORICO = "historico";
    public static final String BASE_ORCAMENTO = "orcamento";
    public static final String BASE_RECORRENCIAS = "recorrencias";
    public static final String BASE_INFORMADO = "informado";
    public static final String BASE_SEM_DADOS = "sem_dados";

    // Níveis de alerta (valor guardado ÷ mínimo).
    public static final String NIVEL_VAZIA = "vazia";          // nada guardado
    public static final String NIVEL_CRITICA = "critica";      // menos de 50% do mínimo
    public static final String NIVEL_ATENCAO = "atencao";      // de 50% a menos de 100%
    public static final String NIVEL_PROTEGIDA = "protegida";  // mínimo atingido
    public static final String NIVEL_SEM_MINIMO = "sem_minimo"; // tem dinheiro, mas sem mínimo calculável

    private static final int MESES_HISTORICO = 3;
    // MÃªs comercial usado para converter a cobertura em dias.
    private static final int DIAS_NO_MES = 30;
    private static final BigDecimal CENTENA = BigDecimal.valueOf(100);
    private static final BigDecimal METADE = new BigDecimal("0.5");

    private final GastoRepository gastoRepository;
    private final RecorrenciaRepository recorrenciaRepository;
    private final OrcamentoRepository orcamentoRepository;
    private final Clock clock;

    public ReservaService(GastoRepository gastoRepository,
                          RecorrenciaRepository recorrenciaRepository,
                          OrcamentoRepository orcamentoRepository,
                          Clock clock) {
        this.gastoRepository = gastoRepository;
        this.recorrenciaRepository = recorrenciaRepository;
        this.orcamentoRepository = orcamentoRepository;
        this.clock = clock;
    }

    /* ========================================
       TIPOS DE RESPOSTA
       ======================================== */

    /** Valor mínimo sugerido para um horizonte (meses). */
    public record OpcaoHorizonte(int meses, BigDecimal valor) {}

    /**
     * Sugestão exibida na configuração: a base usada, o custo mensal médio
     * estimado e o mínimo para cada horizonte (3, 6, 12). Valores null quando
     * a base é "sem_dados".
     */
    public record Sugestao(String base, BigDecimal custoMensal, List<OpcaoHorizonte> opcoes) {}

    /**
     * Situação da reserva: o mínimo efetivo (automático ou manual), o nível de
     * alerta, quantos meses o valor guardado cobre e a base do cálculo.
     */
    public record Situacao(BigDecimal valorMinimo, String nivel, BigDecimal mesesCobertos,
                           BigDecimal custoMensal, String base) {}

    /** Estimativa interna: base, fixos por mês (prospecção) e média variável. */
    record Estimativa(String base, List<BigDecimal> fixosPorMes, BigDecimal variavelMensal,
                      BigDecimal custoFixoMensal) {

        static Estimativa semDados() {
            return new Estimativa(BASE_SEM_DADOS, List.of(), null, null);
        }

        boolean temDados() {
            return !BASE_SEM_DADOS.equals(base);
        }

        /** Total estimado para os próximos `meses` (sem arredondar). */
        BigDecimal total(int meses) {
            if (!temDados()) return null;
            if (custoFixoMensal != null) {
                // Bases "orcamento" e "informado": um valor fixo por mês.
                return custoFixoMensal.multiply(BigDecimal.valueOf(meses));
            }
            BigDecimal soma = BigDecimal.ZERO;
            for (int i = 0; i < meses; i++) {
                soma = soma.add(fixosPorMes.get(i));
            }
            BigDecimal variavel = variavelMensal == null ? BigDecimal.ZERO : variavelMensal;
            return soma.add(variavel.multiply(BigDecimal.valueOf(meses)));
        }
    }

    /* ========================================
       API PÚBLICA
       ======================================== */

    /** Sugestão para os três horizontes. `custoInformado` é opcional. */
    public Sugestao sugerir(String usuarioId, BigDecimal custoInformado) {
        Estimativa est = estimar(usuarioId, custoInformado);
        if (!est.temDados()) {
            return new Sugestao(BASE_SEM_DADOS, null,
                HORIZONTES.stream().map(m -> new OpcaoHorizonte(m, null)).toList());
        }
        List<OpcaoHorizonte> opcoes = HORIZONTES.stream()
            .map(m -> new OpcaoHorizonte(m, arredondarCentena(est.total(m))))
            .toList();
        return new Sugestao(est.base(), custoMensal(est, HORIZONTE_PADRAO), opcoes);
    }

    /** Situação atual da reserva (mínimo efetivo, nível e meses cobertos). */
    public Situacao situacao(String usuarioId, Meta reserva) {
        int horizonte = horizonte(reserva);
        Estimativa est = estimar(usuarioId, reserva.getCustoMensalInformado());
        BigDecimal custoMensal = est.temDados() ? custoMensal(est, horizonte) : null;

        BigDecimal minimo = Boolean.FALSE.equals(reserva.getMinimoAutomatico())
            ? reserva.getValorMinimo()
            : (est.temDados() ? arredondarCentena(est.total(horizonte)) : null);

        BigDecimal atual = valor(reserva.getValorAtual());
        BigDecimal meses = custoMensal != null && custoMensal.signum() > 0
            ? atual.divide(custoMensal, 1, RoundingMode.DOWN)
            : null;

        return new Situacao(minimo, nivel(atual, minimo), meses, custoMensal, est.base());
    }

    /**
     * Valor de referência de qualquer meta para "quanto falta" e percentuais:
     * o valor-alvo do objetivo, ou o mínimo efetivo da reserva.
     */
    public BigDecimal referencia(String usuarioId, Meta meta) {
        if (!meta.isReserva()) return valor(meta.getValorAlvo());
        return valor(situacao(usuarioId, meta).valorMinimo());
    }

    /** Horizonte válido da reserva (3, 6 ou 12); padrão 6. */
    public static int horizonte(Meta reserva) {
        Integer h = reserva.getHorizonteMeses();
        return h != null && HORIZONTES.contains(h) ? h : HORIZONTE_PADRAO;
    }

    /** Nível de alerta a partir do valor guardado e do mínimo. */
    public static String nivel(BigDecimal atual, BigDecimal minimo) {
        BigDecimal guardado = valor(atual);
        if (guardado.signum() <= 0) return NIVEL_VAZIA;
        if (minimo == null || minimo.signum() <= 0) return NIVEL_SEM_MINIMO;
        BigDecimal razao = guardado.divide(minimo, 4, RoundingMode.DOWN);
        if (razao.compareTo(METADE) < 0) return NIVEL_CRITICA;
        if (razao.compareTo(BigDecimal.ONE) < 0) return NIVEL_ATENCAO;
        return NIVEL_PROTEGIDA;
    }

    /* ========================================
       TEXTOS (WhatsApp e resumo semanal)
       Espelham components/ReservaEmergencia/reserva.js do front.
       ======================================== */

    /**
     * Quanto tempo de gastos um valor cobre: "2,4 meses" / "1 mês" (1 casa,
     * para baixo) ou, abaixo de 1 mês, em dias ("15 dias", "1 dia",
     * "menos de 1 dia"). Vazio quando o valor é zero ou não há custo mensal.
     */
    public static String textoCobertura(BigDecimal valor, BigDecimal custoMensal) {
        BigDecimal v = valor(valor);
        if (v.signum() <= 0 || custoMensal == null || custoMensal.signum() <= 0) return "";

        BigDecimal meses = v.divide(custoMensal, 4, RoundingMode.DOWN);
        if (meses.compareTo(BigDecimal.ONE) < 0) {
            int dias = meses.multiply(BigDecimal.valueOf(DIAS_NO_MES)).setScale(0, RoundingMode.DOWN).intValue();
            if (dias < 1) return "menos de 1 dia";
            return dias + (dias == 1 ? " dia" : " dias");
        }
        BigDecimal umaCasa = meses.setScale(1, RoundingMode.DOWN);
        String numero = umaCasa.stripTrailingZeros().scale() <= 0
            ? umaCasa.setScale(0, RoundingMode.DOWN).toPlainString()
            : umaCasa.toPlainString().replace('.', ',');
        return numero + (umaCasa.compareTo(BigDecimal.valueOf(2)) < 0 ? " mês" : " meses");
    }

    /** Mensagem do nível da reserva (resumo semanal e prévia do perfil). */
    public String mensagemSituacao(String usuarioId, Meta reserva) {
        Situacao s = situacao(usuarioId, reserva);
        BigDecimal atual = valor(reserva.getValorAtual());
        String cobertura = textoCobertura(atual, s.custoMensal());
        String minimo = s.valorMinimo() == null ? "" : FormatoBRL.moeda(s.valorMinimo());

        return switch (s.nivel()) {
            case NIVEL_VAZIA -> "Sua reserva de emergência está vazia. Qualquer imprevisto vira dívida.";
            case NIVEL_CRITICA -> cobertura.isEmpty()
                ? "Perigo: menos da metade do mínimo (" + minimo + ")."
                : "Perigo: sua reserva só cobre " + cobertura + " de gastos, menos da metade do mínimo (" + minimo + ").";
            case NIVEL_ATENCAO -> "Faltam " + FormatoBRL.moeda(s.valorMinimo().subtract(atual))
                + " para o mínimo de " + minimo
                + (cobertura.isEmpty() ? "." : "; hoje ela cobre " + cobertura + " de gastos.");
            case NIVEL_PROTEGIDA -> cobertura.isEmpty()
                ? "Mínimo atingido."
                : "Mínimo atingido: sua reserva cobre " + cobertura + " de gastos.";
            default -> "Ainda não há gastos para calcular o mínimo. Defina um valor na página de Metas.";
        };
    }

    /**
     * Aviso para a confirmação de uma retirada que deixa a reserva abaixo do
     * mínimo. Vazio quando a meta não é a reserva, não há mínimo ou a
     * retirada não fura o mínimo.
     */
    public Optional<String> avisoRetirada(String usuarioId, Meta meta, BigDecimal valorRetirada) {
        if (!meta.isReserva()) return Optional.empty();
        Situacao s = situacao(usuarioId, meta);
        BigDecimal minimo = s.valorMinimo();
        if (minimo == null || minimo.signum() <= 0) return Optional.empty();

        BigDecimal depois = valor(meta.getValorAtual()).subtract(valor(valorRetirada));
        if (depois.compareTo(minimo) >= 0) return Optional.empty();

        String cobertura = textoCobertura(depois, s.custoMensal());
        String complemento = !cobertura.isEmpty()
            ? " e só cobre " + cobertura + " de gastos"
            : depois.signum() <= 0 ? " e fica vazia" : "";
        return Optional.of("Atenção: depois desta retirada sua reserva de emergência fica abaixo do mínimo ("
            + FormatoBRL.moeda(minimo) + ")" + complemento + ".");
    }

    /* ========================================
       ESTIMATIVA
       ======================================== */

    Estimativa estimar(String usuarioId, BigDecimal custoInformado) {
        String mesAtual = LocalDate.now(clock).toString().substring(0, 7);

        List<Recorrencia> recorrencias = recorrenciaRepository.findByUsuarioId(usuarioId).stream()
            .filter(Recorrencia::isAtiva)
            .toList();
        List<BigDecimal> fixos = fixosProximosMeses(recorrencias, mesAtual, HORIZONTES.get(HORIZONTES.size() - 1));
        boolean temFixos = fixos.stream().anyMatch(v -> v.signum() > 0);

        // 1. Histórico: média dos variáveis nos meses completos (até 3).
        BigDecimal variavel = mediaVariaveis(gastoRepository.findByUsuarioIdOrderByDataDesc(usuarioId), mesAtual);
        if (variavel != null && (variavel.signum() > 0 || temFixos)) {
            return new Estimativa(BASE_HISTORICO, fixos, variavel, null);
        }

        // 2. Orçamento do mês atual.
        BigDecimal orcamento = orcamentoRepository.findByUsuarioIdAndMes(usuarioId, mesAtual)
            .map(Orcamento::getValorMensal)
            .orElse(null);
        if (orcamento != null && orcamento.signum() > 0) {
            return new Estimativa(BASE_ORCAMENTO, List.of(), null, orcamento);
        }

        // 3. Só os gastos fixos previstos.
        if (temFixos) {
            return new Estimativa(BASE_RECORRENCIAS, fixos, BigDecimal.ZERO, null);
        }

        // 4. Valor informado pelo usuário.
        if (custoInformado != null && custoInformado.signum() > 0) {
            return new Estimativa(BASE_INFORMADO, List.of(), null, custoInformado);
        }

        return Estimativa.semDados();
    }

    /**
     * Soma dos gastos fixos previstos em cada um dos próximos `meses` meses
     * (a partir do mês seguinte ao atual). Mês pulado não conta.
     */
    static List<BigDecimal> fixosProximosMeses(List<Recorrencia> recorrencias, String mesAtual, int meses) {
        List<BigDecimal> lista = new ArrayList<>();
        for (int i = 1; i <= meses; i++) {
            String mes = GastoRecorrenciaService.mudarMes(mesAtual, i);
            BigDecimal soma = BigDecimal.ZERO;
            for (Recorrencia r : recorrencias) {
                if (r.getMesesPulados().contains(mes)) continue;
                soma = soma.add(valor(r.getValor()));
            }
            lista.add(soma);
        }
        return lista;
    }

    /**
     * Média mensal dos gastos NÃO recorrentes nos últimos 3 meses completos
     * (o mês atual fica fora, porque está incompleto). Só entram os meses a
     * partir do primeiro mês com gasto do usuário, para uma conta nova não ter
     * a média diluída por meses em que ela nem existia.
     * Retorna null quando não há nenhum mês completo de histórico.
     */
    static BigDecimal mediaVariaveis(List<Gasto> gastos, String mesAtual) {
        String primeiroMes = null;
        for (Gasto g : gastos) {
            String mes = mesDe(g.getData());
            if (mes == null) continue;
            if (primeiroMes == null || mes.compareTo(primeiroMes) < 0) primeiroMes = mes;
        }
        if (primeiroMes == null) return null;

        List<String> mesesCompletos = new ArrayList<>();
        for (int i = 1; i <= MESES_HISTORICO; i++) {
            String mes = GastoRecorrenciaService.mudarMes(mesAtual, -i);
            if (mes.compareTo(primeiroMes) >= 0) mesesCompletos.add(mes);
        }
        if (mesesCompletos.isEmpty()) return null;

        BigDecimal soma = BigDecimal.ZERO;
        for (Gasto g : gastos) {
            if (g.getRecorrenciaId() != null) continue;
            if (mesesCompletos.contains(mesDe(g.getData()))) {
                soma = soma.add(valor(g.getValor()));
            }
        }
        return soma.divide(BigDecimal.valueOf(mesesCompletos.size()), 2, RoundingMode.HALF_UP);
    }

    /* ========================================
       UTILITÁRIOS
       ======================================== */

    // Custo médio por mês no horizonte (sem arredondar para a centena).
    private static BigDecimal custoMensal(Estimativa est, int meses) {
        return est.total(meses).divide(BigDecimal.valueOf(meses), 2, RoundingMode.HALF_UP);
    }

    static BigDecimal arredondarCentena(BigDecimal v) {
        if (v == null) return null;
        return v.divide(CENTENA, 0, RoundingMode.CEILING).multiply(CENTENA);
    }

    private static String mesDe(String data) {
        return data != null && data.length() >= 7 ? data.substring(0, 7) : null;
    }

    private static BigDecimal valor(BigDecimal v) {
        return v == null ? BigDecimal.ZERO : v;
    }
}
