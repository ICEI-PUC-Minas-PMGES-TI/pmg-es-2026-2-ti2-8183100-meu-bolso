package Projeto.MeuBolso.repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;

import Projeto.MeuBolso.model.Orcamento;

public interface OrcamentoRepository extends MongoRepository<Orcamento, String> {

    // O orçamento de um mês específico ("AAAA-MM") de um usuário.
    Optional<Orcamento> findByUsuarioIdAndMes(String usuarioId, String mes);

    // Todos os orçamentos (histórico de meses) de um usuário.
    List<Orcamento> findByUsuarioId(String usuarioId);
}
