package Projeto.MeuBolso.repository;

import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;

import Projeto.MeuBolso.model.Orcamento;

public interface OrcamentoRepository extends MongoRepository<Orcamento, String> {

    // O orçamento (único) de um usuário.
    Optional<Orcamento> findByUsuarioId(String usuarioId);
}
