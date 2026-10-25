package Projeto.MeuBolso.repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;

import Projeto.MeuBolso.model.Meta;

public interface MetaRepository extends MongoRepository<Meta, String> {

    // Todas as metas de um usuário (isolamento por dono).
    List<Meta> findByUsuarioId(String usuarioId);

    // Uma meta específica, garantindo que pertence ao usuário.
    Optional<Meta> findByIdAndUsuarioId(String id, String usuarioId);
}
