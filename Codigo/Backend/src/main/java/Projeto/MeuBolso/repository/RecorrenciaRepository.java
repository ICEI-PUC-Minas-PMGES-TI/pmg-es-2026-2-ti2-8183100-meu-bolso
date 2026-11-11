package Projeto.MeuBolso.repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;

import Projeto.MeuBolso.model.Recorrencia;

public interface RecorrenciaRepository extends MongoRepository<Recorrencia, String> {

    // Todas as recorrências de um usuário (isolamento por dono).
    List<Recorrencia> findByUsuarioId(String usuarioId);

    // Uma recorrência específica, garantindo que pertence ao usuário.
    Optional<Recorrencia> findByIdAndUsuarioId(String id, String usuarioId);
}
