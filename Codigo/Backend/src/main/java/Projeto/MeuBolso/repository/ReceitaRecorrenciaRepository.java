package Projeto.MeuBolso.repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;

import Projeto.MeuBolso.model.ReceitaRecorrencia;

public interface ReceitaRecorrenciaRepository extends MongoRepository<ReceitaRecorrencia, String> {

    // Todas as recorrências de receita de um usuário (isolamento por dono).
    List<ReceitaRecorrencia> findByUsuarioId(String usuarioId);

    // Uma recorrência específica, garantindo que pertence ao usuário.
    Optional<ReceitaRecorrencia> findByIdAndUsuarioId(String id, String usuarioId);
}
