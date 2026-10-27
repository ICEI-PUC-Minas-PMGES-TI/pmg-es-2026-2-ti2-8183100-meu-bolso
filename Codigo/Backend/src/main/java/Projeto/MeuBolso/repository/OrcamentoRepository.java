package Projeto.MeuBolso.repository;

<<<<<<< HEAD
import Projeto.MeuBolso.model.Orcamento;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface OrcamentoRepository extends MongoRepository<Orcamento, String> {
    Optional<Orcamento> findByUsuarioId(String usuarioId);
}
=======
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;

import Projeto.MeuBolso.model.Orcamento;

public interface OrcamentoRepository extends MongoRepository<Orcamento, String> {

    // O orçamento (único) de um usuário.
    Optional<Orcamento> findByUsuarioId(String usuarioId);
}
>>>>>>> 3af0db57f8043fc8f226b9843d3e51f60f9c7aae
