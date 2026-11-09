package Projeto.MeuBolso.service;

import Projeto.MeuBolso.model.Receita;
import Projeto.MeuBolso.model.ReceitaRecorrencia;
import Projeto.MeuBolso.repository.ReceitaRecorrenciaRepository;
import Projeto.MeuBolso.repository.ReceitaRepository;

import java.math.BigDecimal;
import org.springframework.stereotype.Service;

/**
 * Regra de negócio de criação de receitas, independente do canal (site via JWT
 * ou chatbot via telefone). Recebe o usuarioId já resolvido.
 *
 * Espelho do {@link GastoService}: a lógica foi extraída do
 * ReceitaController.criar sem alteração de comportamento. Cria a receita,
 * opcionalmente a recorrência vinculada, e soma o valor na carteira.
 */
@Service
public class ReceitaService {

    private final ReceitaRepository receitaRepository;
    private final ReceitaRecorrenciaRepository recorrenciaRepository;
    private final CarteiraService carteiraService;

    public ReceitaService(ReceitaRepository receitaRepository,
                          ReceitaRecorrenciaRepository recorrenciaRepository,
                          CarteiraService carteiraService) {
        this.receitaRepository = receitaRepository;
        this.recorrenciaRepository = recorrenciaRepository;
        this.carteiraService = carteiraService;
    }

    /**
     * Cria uma receita. Se "recorrente" for true, cria também a regra de
     * recorrência e vincula a receita a ela. Depois aplica o valor na carteira.
     */
    public Receita criar(String usuarioId, String descricao, String categoria, String carteira,
                         String data, BigDecimal valor, String comentario,
                         boolean recorrente, String carteiraId) {
        Receita receita = new Receita(
            usuarioId,
            descricao.trim(),
            categoria,
            carteira,
            data,
            valor,
            comentarioLimpo(comentario),
            null
        );
        receita.setCarteiraId(carteiraId);

        if (recorrente) {
            ReceitaRecorrencia recorrencia = recorrenciaRepository.save(criarRecorrenciaDe(receita));
            receita.setRecorrenciaId(recorrencia.getId());
        }

        Receita salva = receitaRepository.save(receita);
        carteiraService.aplicarReceita(usuarioId, salva.getCarteiraId(), salva.getValor());
        return salva;
    }

    // Monta a regra de recorrência a partir de uma receita (dia do mês e mês da data).
    private static ReceitaRecorrencia criarRecorrenciaDe(Receita receita) {
        int diaDoMes = Integer.parseInt(receita.getData().substring(8, 10));
        String ultimoMes = receita.getData().substring(0, 7);
        ReceitaRecorrencia r = new ReceitaRecorrencia(
            receita.getUsuarioId(),
            receita.getDescricao(),
            receita.getCategoria(),
            receita.getCarteira(),
            receita.getValor(),
            receita.getComentario(),
            diaDoMes,
            true,
            ultimoMes
        );
        r.setCarteiraId(receita.getCarteiraId());
        return r;
    }

    private static String comentarioLimpo(String comentario) {
        return comentario == null ? "" : comentario.trim();
    }
}
