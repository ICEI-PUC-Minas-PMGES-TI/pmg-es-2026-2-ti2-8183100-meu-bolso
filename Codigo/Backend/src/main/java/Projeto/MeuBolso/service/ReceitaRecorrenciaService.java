package Projeto.MeuBolso.service;

import static Projeto.MeuBolso.service.GastoRecorrenciaService.dataDaOcorrencia;
import static Projeto.MeuBolso.service.GastoRecorrenciaService.hojeIso;
import static Projeto.MeuBolso.service.GastoRecorrenciaService.mudarMes;

import Projeto.MeuBolso.model.Receita;
import Projeto.MeuBolso.model.ReceitaRecorrencia;
import Projeto.MeuBolso.repository.ReceitaRecorrenciaRepository;
import Projeto.MeuBolso.repository.ReceitaRepository;

import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;

/**
 * Gera as receitas das recorrências que já venceram.
 *
 * Espelho de {@link GastoRecorrenciaService}: mesma regra idempotente — só
 * avança a partir do "ultimoMes" de cada recorrência, então rodar duas vezes
 * não duplica lançamentos e uma receita apagada à mão não volta. Reaproveita
 * os utilitários de data de GastoRecorrenciaService.
 *
 * A diferença essencial é que ao lançar, a receita SOMA na carteira
 * (carteiraService.aplicarReceita), enquanto o gasto subtrai.
 */
@Service
public class ReceitaRecorrenciaService {

    // Trava de segurança: nunca gera mais do que isso numa só passada.
    private static final int LIMITE_OCORRENCIAS = 120;

    private final ReceitaRepository receitaRepository;
    private final ReceitaRecorrenciaRepository recorrenciaRepository;
    private final CarteiraService carteiraService;

    public ReceitaRecorrenciaService(ReceitaRepository receitaRepository,
                                   ReceitaRecorrenciaRepository recorrenciaRepository,
                                   CarteiraService carteiraService) {
        this.receitaRepository = receitaRepository;
        this.recorrenciaRepository = recorrenciaRepository;
        this.carteiraService = carteiraService;
    }

    /**
     * Lança as receitas pendentes das recorrências ativas do usuário e persiste
     * tanto as novas receitas quanto o avanço do "ultimoMes" de cada regra.
     */
    public void processar(String usuarioId) {
        processar(usuarioId, hojeIso());
    }

    // Variante com "mês de referência" explícito (facilita testes).
    public void processar(String usuarioId, String hojeIso) {
        List<ReceitaRecorrencia> recorrencias = recorrenciaRepository.findByUsuarioId(usuarioId);
        List<Receita> novas = new ArrayList<>();

        for (ReceitaRecorrencia rec : recorrencias) {
            if (!rec.isAtiva()) continue;

            String ultimoMes = rec.getUltimoMes();
            String proximo = mudarMes(ultimoMes, 1);

            boolean avancou = false;
            while (dataDaOcorrencia(proximo, rec.getDiaDoMes()).compareTo(hojeIso) <= 0
                    && novas.size() < LIMITE_OCORRENCIAS) {
                Receita r = new Receita(
                    usuarioId,
                    rec.getDescricao(),
                    rec.getCategoria(),
                    rec.getCarteira(),
                    dataDaOcorrencia(proximo, rec.getDiaDoMes()),
                    rec.getValor(),
                    rec.getComentario(),
                    rec.getId()
                );
                r.setCarteiraId(rec.getCarteiraId());
                novas.add(r);
                ultimoMes = proximo;
                proximo = mudarMes(proximo, 1);
                avancou = true;
            }

            if (avancou) {
                rec.setUltimoMes(ultimoMes);
                recorrenciaRepository.save(rec);
            }
        }

        if (!novas.isEmpty()) {
            receitaRepository.saveAll(novas);
            for (Receita r : novas) {
                carteiraService.aplicarReceita(usuarioId, r.getCarteiraId(), r.getValor());
            }
        }
    }
}
