package Projeto.MeuBolso.service;

import Projeto.MeuBolso.model.Meta;
import Projeto.MeuBolso.model.MovimentacaoMeta;
import Projeto.MeuBolso.repository.MetaRepository;
import Projeto.MeuBolso.repository.MovimentacaoMetaRepository;

import java.math.BigDecimal;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

/**
 * Regra de negócio das metas, independente do canal (site via JWT ou
 * chatbot via telefone). Os métodos recebem o usuarioId já resolvido.
 *
 * A lógica de movimentação foi extraída do MetaController sem alteração de
 * comportamento: mesmas validações, mesma ordem de operações e mesmas
 * mensagens de erro. O controller passou a delegar para cá.
 */
@Service
public class MetaService {

    private final MetaRepository metaRepository;
    private final MovimentacaoMetaRepository movimentacaoRepository;
    private final CarteiraService carteiraService;

    public MetaService(MetaRepository metaRepository,
                       MovimentacaoMetaRepository movimentacaoRepository,
                       CarteiraService carteiraService) {
        this.metaRepository = metaRepository;
        this.movimentacaoRepository = movimentacaoRepository;
        this.carteiraService = carteiraService;
    }

    /**
     * Resultado de uma movimentação aplicada: a meta já atualizada e o
     * registro gravado no histórico.
     */
    public record MovimentacaoAplicada(Meta meta, MovimentacaoMeta movimentacao) {}

    /**
     * Registra uma movimentação (aporte/retirada) numa meta, numa única
     * operação: valida, ajusta o saldo da carteira, atualiza o valorAtual da
     * meta e grava o registro do histórico. Tudo vinculado ao usuário.
     *
     *  - deposito: sai da carteira (delta negativo) e entra na meta.
     *  - retirada: entra na carteira (delta positivo) e sai da meta.
     */
    public MovimentacaoAplicada movimentar(String usuarioId, String metaId, String tipo,
                                           BigDecimal valor, String carteiraId, String titulo) {
        Meta meta = metaRepository.findByIdAndUsuarioId(metaId, usuarioId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Meta não encontrada."));

        boolean deposito = "deposito".equals(tipo);

        // Valida saldo conforme o tipo.
        if (deposito) {
            BigDecimal saldo = carteiraService.saldoDe(usuarioId, carteiraId);
            if (saldo == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Carteira inválida para a movimentação.");
            }
            if (valor.compareTo(saldo) > 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Saldo insuficiente na carteira para este depósito.");
            }
        } else {
            if (valor.compareTo(meta.getValorAtual()) > 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A retirada não pode ser maior que o valor guardado na meta.");
            }
        }

        // Ajusta o saldo da carteira: depósito tira da carteira; retirada devolve.
        BigDecimal deltaCarteira = deposito ? valor.negate() : valor;
        boolean ajustou = carteiraService.ajustarSaldo(usuarioId, carteiraId, deltaCarteira);
        if (!ajustou) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Não foi possível ajustar o saldo da carteira.");
        }

        // Atualiza o valor guardado da meta.
        BigDecimal novoValor = deposito
            ? meta.getValorAtual().add(valor)
            : meta.getValorAtual().subtract(valor);
        meta.setValorAtual(novoValor);
        Meta metaSalva = metaRepository.save(meta);

        // Registra a movimentação no histórico.
        String tituloLimpo = titulo == null ? "" : titulo.trim();
        MovimentacaoMeta mov = movimentacaoRepository.save(
            new MovimentacaoMeta(usuarioId, metaId, carteiraId, tipo, valor, tituloLimpo));

        return new MovimentacaoAplicada(metaSalva, mov);
    }
}
