package Projeto.MeuBolso.service;

import Projeto.MeuBolso.model.Gasto;
import Projeto.MeuBolso.model.GastoDtos.ComentarioRequest;
import Projeto.MeuBolso.model.GastoDtos.GastoRequest;
import Projeto.MeuBolso.model.GastoDtos.RecorrenteRequest;
import Projeto.MeuBolso.model.GastoRecorrente;
import Projeto.MeuBolso.model.Orcamento;
import Projeto.MeuBolso.repository.GastoRecorrenteRepository;
import Projeto.MeuBolso.repository.GastoRepository;
import Projeto.MeuBolso.repository.OrcamentoRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class GastoService {

    // Trava de segurança: nunca lança mais do que isso numa só passada por regra
    private static final int LIMITE_OCORRENCIAS = 120;

    private final GastoRepository gastos;
    private final GastoRecorrenteRepository recorrentes;
    private final OrcamentoRepository orcamentos;

    public GastoService(GastoRepository gastos, GastoRecorrenteRepository recorrentes,
                        OrcamentoRepository orcamentos) {
        this.gastos = gastos;
        this.recorrentes = recorrentes;
        this.orcamentos = orcamentos;
    }

    /* ---------- Gastos ---------- */

    public List<Gasto> listar(String usuarioId) {
        // Garante que as recorrências vencidas já estejam lançadas antes de responder
        processarRecorrencias(recorrentes.findByUsuarioIdAndAtivaTrue(usuarioId), LocalDate.now());
        return gastos.findByUsuarioIdOrderByDataDesc(usuarioId);
    }

    public Gasto criar(String usuarioId, GastoRequest req) {
        Gasto gasto = new Gasto();
        gasto.setUsuarioId(usuarioId);
        preencher(gasto, req);
        gasto = gastos.save(gasto);

        if (Boolean.TRUE.equals(req.recorrente())) {
            gasto = vincularNovaRecorrencia(usuarioId, gasto);
        }
        return gasto;
    }

    public Gasto atualizar(String usuarioId, String id, GastoRequest req) {
        Gasto gasto = buscarGasto(usuarioId, id);
        preencher(gasto, req);

        // Transformar um gasto avulso em recorrente
        if (Boolean.TRUE.equals(req.recorrente()) && gasto.getRecorrenciaId() == null) {
            return vincularNovaRecorrencia(usuarioId, gastos.save(gasto));
        }
        return gastos.save(gasto);
    }

    public Gasto atualizarComentario(String usuarioId, String id, ComentarioRequest req) {
        Gasto gasto = buscarGasto(usuarioId, id);
        gasto.setComentario(limpar(req.comentario()));
        return gastos.save(gasto);
    }

    public void excluir(String usuarioId, String id) {
        gastos.delete(buscarGasto(usuarioId, id));
    }

    /* ---------- Recorrências ---------- */

    public List<GastoRecorrente> listarRecorrentes(String usuarioId) {
        return recorrentes.findByUsuarioIdOrderByDescricaoAsc(usuarioId);
    }

    public GastoRecorrente atualizarRecorrente(String usuarioId, String id, RecorrenteRequest req) {
        GastoRecorrente rec = buscarRecorrente(usuarioId, id);
        boolean estavaPausada = !rec.isAtiva();
        boolean ficaAtiva = req.ativa() == null || req.ativa();

        rec.setDescricao(req.descricao().trim());
        rec.setCategoria(req.categoria());
        rec.setCarteira(req.carteira());
        rec.setValor(req.valor());
        rec.setDiaDoMes(req.diaDoMes());
        rec.setComentario(limpar(req.comentario()));
        rec.setAtiva(ficaAtiva);

        // Ao reativar, não lança retroativamente os meses em que ficou pausada
        if (estavaPausada && ficaAtiva) {
            YearMonth mesAnterior = YearMonth.now().minusMonths(1);
            if (YearMonth.parse(rec.getUltimoMes()).isBefore(mesAnterior)) {
                rec.setUltimoMes(mesAnterior.toString());
            }
        }
        return recorrentes.save(rec);
    }

    public void excluirRecorrente(String usuarioId, String id) {
        GastoRecorrente rec = buscarRecorrente(usuarioId, id);

        // Os gastos já lançados continuam, só perdem o vínculo com a regra
        List<Gasto> lancados = gastos.findByRecorrenciaIdAndUsuarioId(id, usuarioId);
        lancados.forEach(g -> g.setRecorrenciaId(null));
        gastos.saveAll(lancados);

        recorrentes.delete(rec);
    }

    /**
     * Lança os gastos das recorrências ativas que já venceram. É idempotente:
     * só avança a partir de "ultimoMes", então rodar duas vezes não duplica nada
     * (e um gasto apagado à mão não volta).
     */
    void processarRecorrencias(List<GastoRecorrente> regras, LocalDate hoje) {
        for (GastoRecorrente rec : regras) {
            if (!rec.isAtiva()) continue;

            List<Gasto> novos = new ArrayList<>();
            YearMonth ultimo = YearMonth.parse(rec.getUltimoMes());
            YearMonth proximo = ultimo.plusMonths(1);

            while (novos.size() < LIMITE_OCORRENCIAS) {
                LocalDate data = dataDaOcorrencia(proximo, rec.getDiaDoMes());
                if (data.isAfter(hoje)) break;

                if (!gastos.existsByRecorrenciaIdAndData(rec.getId(), data)) {
                    novos.add(gastoDaRecorrencia(rec, data));
                }
                ultimo = proximo;
                proximo = proximo.plusMonths(1);
            }

            if (!ultimo.toString().equals(rec.getUltimoMes())) {
                gastos.saveAll(novos);
                rec.setUltimoMes(ultimo.toString());
                recorrentes.save(rec);
            }
        }
    }

    /** Todo dia, logo após a meia-noite, lança as recorrências de todos os usuários. */
    @Scheduled(cron = "0 5 0 * * *")
    public void processarRecorrenciasDeTodos() {
        processarRecorrencias(recorrentes.findByAtivaTrue(), LocalDate.now());
    }

    /* ---------- Orçamento ---------- */

    public BigDecimal obterOrcamento(String usuarioId) {
        return orcamentos.findByUsuarioId(usuarioId)
            .map(Orcamento::getValorMensal)
            .orElse(BigDecimal.ZERO);
    }

    public BigDecimal salvarOrcamento(String usuarioId, BigDecimal valor) {
        Orcamento orcamento = orcamentos.findByUsuarioId(usuarioId).orElseGet(() -> {
            Orcamento novo = new Orcamento();
            novo.setUsuarioId(usuarioId);
            return novo;
        });
        orcamento.setValorMensal(valor);
        return orcamentos.save(orcamento).getValorMensal();
    }

    /* ---------- Auxiliares ---------- */

    private Gasto vincularNovaRecorrencia(String usuarioId, Gasto gasto) {
        GastoRecorrente rec = new GastoRecorrente();
        rec.setUsuarioId(usuarioId);
        rec.setDescricao(gasto.getDescricao());
        rec.setCategoria(gasto.getCategoria());
        rec.setCarteira(gasto.getCarteira());
        rec.setValor(gasto.getValor());
        rec.setComentario(gasto.getComentario());
        rec.setDiaDoMes(gasto.getData().getDayOfMonth());
        rec.setAtiva(true);
        rec.setUltimoMes(YearMonth.from(gasto.getData()).toString());
        rec = recorrentes.save(rec);

        gasto.setRecorrenciaId(rec.getId());
        return gastos.save(gasto);
    }

    private Gasto gastoDaRecorrencia(GastoRecorrente rec, LocalDate data) {
        Gasto g = new Gasto();
        g.setUsuarioId(rec.getUsuarioId());
        g.setDescricao(rec.getDescricao());
        g.setCategoria(rec.getCategoria());
        g.setCarteira(rec.getCarteira());
        g.setValor(rec.getValor());
        g.setData(data);
        g.setComentario(rec.getComentario());
        g.setRecorrenciaId(rec.getId());
        return g;
    }

    /** Dia 31 vira 28/29/30 nos meses mais curtos. */
    static LocalDate dataDaOcorrencia(YearMonth mes, int dia) {
        return mes.atDay(Math.min(dia, mes.lengthOfMonth()));
    }

    private void preencher(Gasto gasto, GastoRequest req) {
        gasto.setDescricao(req.descricao().trim());
        gasto.setCategoria(req.categoria());
        gasto.setCarteira(req.carteira());
        gasto.setValor(req.valor());
        gasto.setData(req.data());
        gasto.setComentario(limpar(req.comentario()));
    }

    private String limpar(String texto) {
        return texto == null ? "" : texto.trim();
    }

    // Sempre filtra por usuarioId: um usuário nunca enxerga dados de outro
    private Gasto buscarGasto(String usuarioId, String id) {
        return gastos.findByIdAndUsuarioId(id, usuarioId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Gasto não encontrado."));
    }

    private GastoRecorrente buscarRecorrente(String usuarioId, String id) {
        return recorrentes.findByIdAndUsuarioId(id, usuarioId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Recorrência não encontrada."));
    }
}