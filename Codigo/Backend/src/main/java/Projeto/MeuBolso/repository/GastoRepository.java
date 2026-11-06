package Projeto.MeuBolso.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import Projeto.MeuBolso.model.Gasto;

public interface GastoRepository extends MongoRepository<Gasto, String> {

    // Todos os gastos de um usuário, mais recentes primeiro (ordena pela data textual AAAA-MM-DD).
    List<Gasto> findByUsuarioIdOrderByDataDesc(String usuarioId);

    // Um gasto específico, garantindo que pertence ao usuário.
    Optional<Gasto> findByIdAndUsuarioId(String id, String usuarioId);

    // Usado ao excluir uma recorrência: solta o vínculo dos gastos já lançados.
    List<Gasto> findByUsuarioIdAndRecorrenciaId(String usuarioId, String recorrenciaId);

    boolean existsByRecorrenciaIdAndData(String recorrenciaId, LocalDate data);

    // Gastos de um usuário num período (datas inclusivas, no formato "AAAA-MM-DD").
    // Usa @Query porque o "Between" derivado do Spring Data exclui as duas pontas,
    // e aqui o primeiro e o último dia do período precisam entrar.
    // Funciona porque a data é texto ISO: comparar texto equivale a comparar datas.
    @Query("{ 'usuarioId': ?0, 'data': { $gte: ?1, $lte: ?2 } }")
    List<Gasto> findPorPeriodo(String usuarioId, String inicio, String fim);
}
 