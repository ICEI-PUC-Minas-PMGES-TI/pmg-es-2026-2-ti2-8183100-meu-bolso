package Projeto.MeuBolso.service;

import Projeto.MeuBolso.model.Gasto;
import Projeto.MeuBolso.model.Recorrencia;
import Projeto.MeuBolso.repository.GastoRepository;
import Projeto.MeuBolso.repository.RecorrenciaRepository;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;

/**
 * Gera os gastos das recorrências que já venceram.
 *
 * Porta a mesma regra do front (service/gastosService.js -> processarRecorrencias):
 * é idempotente — só avança a partir do "ultimoMes" de cada recorrência, então
 * rodar duas vezes não duplica lançamentos e um gasto apagado à mão não volta.
 *
 * Datas viajam como texto "AAAA-MM-DD" e meses como "AAAA-MM", igual ao front.
 */
@Service
public class GastoRecorrenciaService {

    // Trava de segurança: nunca gera mais do que isso numa só passada.
    private static final int LIMITE_OCORRENCIAS = 120;

    private final GastoRepository gastoRepository;
    private final RecorrenciaRepository recorrenciaRepository;

    public GastoRecorrenciaService(GastoRepository gastoRepository,
                                   RecorrenciaRepository recorrenciaRepository) {
        this.gastoRepository = gastoRepository;
        this.recorrenciaRepository = recorrenciaRepository;
    }

    /**
     * Lança os gastos pendentes das recorrências ativas do usuário e persiste
     * tanto os novos gastos quanto o avanço do "ultimoMes" de cada regra.
     */
    public void processar(String usuarioId) {
        processar(usuarioId, mesAtualChave());
    }

    // Variante com "mês de referência" explícito (facilita testes).
    public void processar(String usuarioId, String hojeIso) {
        List<Recorrencia> recorrencias = recorrenciaRepository.findByUsuarioId(usuarioId);
        List<Gasto> novos = new ArrayList<>();

        for (Recorrencia rec : recorrencias) {
            if (!rec.isAtiva()) continue;

            String ultimoMes = rec.getUltimoMes();
            String proximo = mudarMes(ultimoMes, 1);

            boolean avancou = false;
            while (dataDaOcorrencia(proximo, rec.getDiaDoMes()).compareTo(hojeIso) <= 0
                    && novos.size() < LIMITE_OCORRENCIAS) {
                novos.add(new Gasto(
                    usuarioId,
                    rec.getDescricao(),
                    rec.getCategoria(),
                    rec.getCarteira(),
                    dataDaOcorrencia(proximo, rec.getDiaDoMes()),
                    rec.getValor(),
                    rec.getComentario(),
                    rec.getId()
                ));
                ultimoMes = proximo;
                proximo = mudarMes(proximo, 1);
                avancou = true;
            }

            if (avancou) {
                rec.setUltimoMes(ultimoMes);
                recorrenciaRepository.save(rec);
            }
        }

        if (!novos.isEmpty()) {
            gastoRepository.saveAll(novos);
        }
    }

    /* ========================================
       UTILITÁRIOS DE DATA (texto "AAAA-MM" / "AAAA-MM-DD")
       Espelham utils/Gastosutils.js do front.
       ======================================== */

    public static String mesAtualChave() {
        return hojeIso().substring(0, 7);
    }

    public static String hojeIso() {
        return LocalDate.now().toString(); // "AAAA-MM-DD"
    }

    // Soma (ou subtrai) meses de uma chave "AAAA-MM".
    public static String mudarMes(String chave, int delta) {
        int ano = Integer.parseInt(chave.substring(0, 4));
        int mes = Integer.parseInt(chave.substring(5, 7));
        LocalDate base = LocalDate.of(ano, mes, 1).plusMonths(delta);
        return String.format("%04d-%02d", base.getYear(), base.getMonthValue());
    }

    static int diasNoMes(String chave) {
        int ano = Integer.parseInt(chave.substring(0, 4));
        int mes = Integer.parseInt(chave.substring(5, 7));
        return LocalDate.of(ano, mes, 1).lengthOfMonth();
    }

    // Data em que uma recorrência cai num mês (dia 31 vira 28/29/30 se preciso).
    static String dataDaOcorrencia(String mes, int dia) {
        int diaEfetivo = Math.min(dia, diasNoMes(mes));
        return String.format("%s-%02d", mes, diaEfetivo);
    }
}
