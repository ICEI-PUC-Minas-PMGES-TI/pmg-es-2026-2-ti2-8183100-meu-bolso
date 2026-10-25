package Projeto.MeuBolso.repository;

import Projeto.MeuBolso.model.GastoRecorrente;
import java.util.List;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface GastoRecorrenteRepository extends MongoRepository<GastoRecorrente, String> {
    List<GastoRecorrente> findByUsuarioIdOrderByDescricaoAsc(String usuarioId);
    List<GastoRecorrente> findByUsuarioIdAndAtivaTrue(String usuarioId);
    List<GastoRecorrente> findByAtivaTrue();
    Optional<GastoRecorrente> findByIdAndUsuarioId(String id, String usuarioId);
}