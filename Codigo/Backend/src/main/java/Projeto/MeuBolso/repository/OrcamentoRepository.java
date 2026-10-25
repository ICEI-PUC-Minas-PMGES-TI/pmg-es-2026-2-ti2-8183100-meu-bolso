package Projeto.MeuBolso.repository;

import Projeto.MeuBolso.model.Orcamento;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface OrcamentoRepository extends MongoRepository<Orcamento, String> {
    Optional<Orcamento> findByUsuarioId(String usuarioId);
}