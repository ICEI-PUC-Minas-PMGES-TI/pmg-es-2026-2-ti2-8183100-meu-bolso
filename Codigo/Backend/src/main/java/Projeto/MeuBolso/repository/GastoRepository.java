package Projeto.MeuBolso.repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;

import Projeto.MeuBolso.model.Gasto;

public interface GastoRepository extends MongoRepository<Gasto, String> {

    // Todos os gastos de um usuário, mais recentes primeiro (ordena pela data textual AAAA-MM-DD).
    List<Gasto> findByUsuarioIdOrderByDataDesc(String usuarioId);

    // Um gasto específico, garantindo que pertence ao usuário.
    Optional<Gasto> findByIdAndUsuarioId(String id, String usuarioId);

    // Usado ao excluir uma recorrência: solta o vínculo dos gastos já lançados.
    List<Gasto> findByUsuarioIdAndRecorrenciaId(String usuarioId, String recorrenciaId);
}
