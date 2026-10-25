package Projeto.MeuBolso.repository;

import Projeto.MeuBolso.model.Gasto;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface GastoRepository extends MongoRepository<Gasto, String> {
    List<Gasto> findByUsuarioIdOrderByDataDesc(String usuarioId);
    Optional<Gasto> findByIdAndUsuarioId(String id, String usuarioId);
    List<Gasto> findByRecorrenciaIdAndUsuarioId(String recorrenciaId, String usuarioId);
    boolean existsByRecorrenciaIdAndData(String recorrenciaId, LocalDate data);
}