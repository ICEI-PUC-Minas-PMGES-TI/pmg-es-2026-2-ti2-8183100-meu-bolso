package Projeto.MeuBolso.service;

import Projeto.MeuBolso.model.Gasto;
import Projeto.MeuBolso.model.Orcamento;
import Projeto.MeuBolso.model.PreferenciaResumo;
import Projeto.MeuBolso.model.Recorrencia;
import Projeto.MeuBolso.model.ResumoSemanalDtos.CategoriaValor;
import Projeto.MeuBolso.model.ResumoSemanalDtos.ContaAVencer;
import Projeto.MeuBolso.model.ResumoSemanalDtos.MetaProgresso;
import Projeto.MeuBolso.model.ResumoSemanalDtos.OrcamentoUso;
import Projeto.MeuBolso.model.ResumoSemanalDtos.PreferenciaResponse;
import Projeto.MeuBolso.model.ResumoSemanalDtos.Resumo;
import Projeto.MeuBolso.model.Usuario;
import Projeto.MeuBolso.repository.GastoRepository;
import Projeto.MeuBolso.repository.MetaRepository;
import Projeto.MeuBolso.repository.OrcamentoRepository;
import Projeto.MeuBolso.repository.PreferenciaResumoRepository;
import Projeto.MeuBolso.repository.RecorrenciaRepository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneId;
import java.util.Base64;
import java.util.Comparator;
import java.util.HexFormat;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Regras do resumo semanal: monta os números, controla a preferência do usuário,
 * gera o token do link de cancelamento e dispara o envio.
 *
 * Não sabe nada de formato de e-mail: isso fica no ResumoEmailService.
 */
@Service
public class ResumoSemanalService {

    /** Fuso de Brasília: o resumo e o agendamento seguem a semana local. */
    public static final ZoneId ZONA = ZoneId.of("America/Sao_Paulo");

    private static final int DIAS_DO_RESUMO = 7;
    private static final int TOP_CATEGORIAS = 5;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final GastoRepository gastoRepository;
    private final OrcamentoRepository orcamentoRepository;
    private final MetaRepository metaRepository;
    private final RecorrenciaRepository recorrenciaRepository;
    private final PreferenciaResumoRepository preferenciaRepository;
    private final GastoRecorrenciaService gastoRecorrenciaService;
    private final ResumoEmailService resumoEmailService;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    public ResumoSemanalService(GastoRepository gastoRepository,
                                OrcamentoRepository orcamentoRepository,
                                MetaRepository metaRepository,
                                RecorrenciaRepository recorrenciaRepository,
                                PreferenciaResumoRepository preferenciaRepository,
                                GastoRecorrenciaService gastoRecorrenciaService,
                                ResumoEmailService resumoEmailService) {
        this.gastoRepository = gastoRepository;
        this.orcamentoRepository = orcamentoRepository;
        this.metaRepository = metaRepository;
        this.recorrenciaRepository = recorrenciaRepository;
        this.preferenciaRepository = preferenciaRepository;
        this.gastoRecorrenciaService = gastoRecorrenciaService;
        this.resumoEmailService = resumoEmailService;
    }

    /* ========================================
       PREFERÊNCIA (ligar e desligar)
       ======================================== */

    public PreferenciaResponse obterPreferencia(Usuario usuario) {
        return paraResponse(preferenciaDe(usuario.getId()), usuario);
    }

    public PreferenciaResponse definirAtivo(Usuario usuario, boolean ativo) {
        PreferenciaResumo preferencia = preferenciaDe(usuario.getId());
        preferencia.setAtivo(ativo);
        if (!ativo) {
            // Desligar invalida o link de cancelamento que ainda estava válido.
            preferencia.setTokenHash(null);
        }
        return paraResponse(preferenciaRepository.save(preferencia), usuario);
    }

    private PreferenciaResumo preferenciaDe(String usuarioId) {
        return preferenciaRepository.findByUsuarioId(usuarioId)
            .orElseGet(() -> preferenciaRepository.save(new PreferenciaResumo(usuarioId)));
    }

    private static PreferenciaResponse paraResponse(PreferenciaResumo p, Usuario usuario) {
        return new PreferenciaResponse(p.isAtivo(), usuario.getEmail(), p.getUltimoEnvio());
    }

    /* ========================================
       MONTAGEM DO RESUMO
       ======================================== */

    /**
     * Monta o resumo dos últimos 7 dias, com o mês até hoje para o orçamento.
     * Antes, lança as recorrências vencidas, para que entrem nas contas.
     */
    public Resumo montar(String usuarioId, LocalDate hoje) {
        gastoRecorrenciaService.processar(usuarioId);

        LocalDate inicio = hoje.minusDays(DIAS_DO_RESUMO - 1);
        List<Gasto> semana = gastoRepository.findPorPeriodo(usuarioId, inicio.toString(), hoje.toString());

        BigDecimal totalSemana = soma(semana);
        List<CategoriaValor> categorias = semana.stream()
            .collect(Collectors.groupingBy(
                ResumoSemanalService::nomeCategoria,
                Collectors.reducing(BigDecimal.ZERO, Gasto::getValor, BigDecimal::add)))
            .entrySet().stream()
            .map(e -> new CategoriaValor(e.getKey(), e.getValue()))
            .sorted(Comparator.comparing(CategoriaValor::valor).reversed())
            .limit(TOP_CATEGORIAS)
            .toList();

        BigDecimal gastoNoMes = soma(gastoRepository.findPorPeriodo(
            usuarioId, hoje.withDayOfMonth(1).toString(), hoje.toString()));
        BigDecimal limite = orcamentoRepository.findByUsuarioId(usuarioId)
            .map(Orcamento::getValorMensal)
            .orElse(BigDecimal.ZERO);
        OrcamentoUso orcamento = new OrcamentoUso(gastoNoMes, limite, percentual(gastoNoMes, limite));

        List<MetaProgresso> metas = metaRepository.findByUsuarioId(usuarioId).stream()
            .map(m -> new MetaProgresso(
                m.getNome(),
                m.getValorAtual(),
                m.getValorAlvo(),
                percentual(m.getValorAtual(), m.getValorAlvo())))
            .toList();

        LocalDate ateLimite = hoje.plusDays(DIAS_DO_RESUMO);
        List<ContaAVencer> contas = recorrenciaRepository.findByUsuarioId(usuarioId).stream()
            .filter(Recorrencia::isAtiva)
            .map(r -> new ContaAVencer(r.getDescricao(), r.getValor(), proximaOcorrencia(r.getDiaDoMes(), hoje)))
            .filter(c -> !c.vencimento().isAfter(ateLimite))
            .sorted(Comparator.comparing(ContaAVencer::vencimento))
            .toList();

        return new Resumo(inicio, hoje, totalSemana, semana.size(), categorias, orcamento, metas, contas);
    }

    /* ========================================
       ENVIO E CANCELAMENTO
       ======================================== */

    /**
     * Monta o resumo, gera um token novo para o link de cancelamento, guarda só o
     * hash, marca a data do envio e manda o e-mail (assíncrono).
     *
     * Cada envio troca o token: o link do último e-mail é o único que vale.
     */
    public void enviarResumo(Usuario usuario, LocalDate hoje) {
        Resumo resumo = montar(usuario.getId(), hoje);

        String token = gerarToken();
        PreferenciaResumo preferencia = preferenciaDe(usuario.getId());
        preferencia.setTokenHash(hash(token));
        preferencia.setUltimoEnvio(hoje);
        preferenciaRepository.save(preferencia);

        String linkCancelar = frontendUrl + "/resumo-semanal/cancelar?token=" + token;
        resumoEmailService.enviar(usuario.getEmail(), usuario.getNome(), resumo, linkCancelar);
    }

    /**
     * Cancela o resumo pelo token do e-mail. Devolve false se o token não bate
     * com nenhuma preferência (inválido, já usado ou de um e-mail antigo).
     */
    public boolean cancelar(String token) {
        return preferenciaRepository.findByTokenHash(hash(token.trim()))
            .map(p -> {
                p.setAtivo(false);
                p.setTokenHash(null);
                preferenciaRepository.save(p);
                return true;
            })
            .orElse(false);
    }

    /* ========================================
       UTILITÁRIOS
       ======================================== */

    private static String nomeCategoria(Gasto g) {
        return g.getCategoria() == null ? "Sem categoria" : g.getCategoria();
    }

    private static BigDecimal soma(List<Gasto> gastos) {
        return gastos.stream().map(Gasto::getValor).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    // Percentual inteiro de "parte" sobre "total" (0 quando não há total).
    private static int percentual(BigDecimal parte, BigDecimal total) {
        if (parte == null || total == null || total.signum() <= 0) return 0;
        return parte.multiply(BigDecimal.valueOf(100))
            .divide(total, 0, RoundingMode.HALF_UP)
            .intValue();
    }

    // Próxima data em que uma recorrência cai, a partir de hoje (dia 31 vira o último dia do mês).
    static LocalDate proximaOcorrencia(int diaDoMes, LocalDate hoje) {
        LocalDate candidata = diaNoMes(hoje.getYear(), hoje.getMonthValue(), diaDoMes);
        if (candidata.isBefore(hoje)) {
            LocalDate proximoMes = hoje.plusMonths(1);
            candidata = diaNoMes(proximoMes.getYear(), proximoMes.getMonthValue(), diaDoMes);
        }
        return candidata;
    }

    private static LocalDate diaNoMes(int ano, int mes, int dia) {
        YearMonth ym = YearMonth.of(ano, mes);
        return ym.atDay(Math.min(dia, ym.lengthOfMonth()));
    }

    // 32 bytes aleatórios, em base64 próprio para URL.
    private static String gerarToken() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    // SHA-256 em hexadecimal: é o que fica salvo no banco.
    private static String hash(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(token.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 indisponível", e);
        }
    }
}
