package Projeto.MeuBolso.service;

import Projeto.MeuBolso.model.Gasto;
import Projeto.MeuBolso.model.Recorrencia;
import Projeto.MeuBolso.repository.GastoRepository;
import Projeto.MeuBolso.repository.RecorrenciaRepository;

import java.math.BigDecimal;
import org.springframework.stereotype.Service;

/**
 * Regra de negócio de criação de gastos, independente do canal (site via JWT
 * ou chatbot via telefone). Recebe o usuarioId já resolvido.
 *
 * A lógica de criação foi extraída do GastoController.criar sem alteração de
 * comportamento: cria o gasto, opcionalmente a recorrência vinculada, e aplica
 * o efeito na carteira. O controller passou a delegar para cá.
 */
@Service
public class GastoService {

    private final GastoRepository gastoRepository;
    private final RecorrenciaRepository recorrenciaRepository;
    private final CarteiraService carteiraService;

    public GastoService(GastoRepository gastoRepository,
                        RecorrenciaRepository recorrenciaRepository,
                        CarteiraService carteiraService) {
        this.gastoRepository = gastoRepository;
        this.recorrenciaRepository = recorrenciaRepository;
        this.carteiraService = carteiraService;
    }

    /**
     * Cria um gasto. Se "recorrente" for true, cria também a regra de
     * recorrência e vincula o gasto a ela. Depois aplica o valor na carteira.
     */
    public Gasto criar(String usuarioId, String descricao, String categoria, String carteira,
                       String data, BigDecimal valor, String comentario,
                       boolean recorrente, String carteiraId) {
        Gasto gasto = new Gasto(
            usuarioId,
            descricao.trim(),
            categoria,
            carteira,
            data,
            valor,
            comentarioLimpo(comentario),
            null
        );
        gasto.setCarteiraId(carteiraId);

        if (recorrente) {
            Recorrencia recorrencia = recorrenciaRepository.save(criarRecorrenciaDe(gasto));
            gasto.setRecorrenciaId(recorrencia.getId());
        }

        Gasto salvo = gastoRepository.save(gasto);
        carteiraService.aplicarGasto(usuarioId, salvo.getCarteiraId(), salvo.getValor());
        return salvo;
    }

    // Monta a regra de recorrência a partir de um gasto (dia do mês e mês da data).
    private static Recorrencia criarRecorrenciaDe(Gasto gasto) {
        int diaDoMes = Integer.parseInt(gasto.getData().substring(8, 10));
        String ultimoMes = gasto.getData().substring(0, 7);
        Recorrencia r = new Recorrencia(
            gasto.getUsuarioId(),
            gasto.getDescricao(),
            gasto.getCategoria(),
            gasto.getCarteira(),
            gasto.getValor(),
            gasto.getComentario(),
            diaDoMes,
            true,
            ultimoMes
        );
        r.setCarteiraId(gasto.getCarteiraId());
        return r;
    }

    private static String comentarioLimpo(String comentario) {
        return comentario == null ? "" : comentario.trim();
    }
}
