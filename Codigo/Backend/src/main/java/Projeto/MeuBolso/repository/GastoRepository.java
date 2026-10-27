package Projeto.MeuBolso.repository;

<<<<<<< HEAD
import Projeto.MeuBolso.model.Gasto;
import java.time.LocalDate;
=======
>>>>>>> 3af0db57f8043fc8f226b9843d3e51f60f9c7aae
import java.util.List;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;

<<<<<<< HEAD
public interface GastoRepository extends MongoRepository<Gasto, String> {
    List<Gasto> findByUsuarioIdOrderByDataDesc(String usuarioId);
    Optional<Gasto> findByIdAndUsuarioId(String id, String usuarioId);
    List<Gasto> findByRecorrenciaIdAndUsuarioId(String recorrenciaId, String usuarioId);
    boolean existsByRecorrenciaIdAndData(String recorrenciaId, LocalDate data);
}
=======
import Projeto.MeuBolso.model.Gasto;

public interface GastoRepository extends MongoRepository<Gasto, String> {

    // Todos os gastos de um usuário, mais recentes primeiro (ordena pela data textual AAAA-MM-DD).
    List<Gasto> findByUsuarioIdOrderByDataDesc(String usuarioId);

    // Um gasto específico, garantindo que pertence ao usuário.
    Optional<Gasto> findByIdAndUsuarioId(String id, String usuarioId);

    // Usado ao excluir uma recorrência: solta o vínculo dos gastos já lançados.
    List<Gasto> findByUsuarioIdAndRecorrenciaId(String usuarioId, String recorrenciaId);
}
>>>>>>> 3af0db57f8043fc8f226b9843d3e51f60f9c7aae
