package Projeto.MeuBolso.repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;

import Projeto.MeuBolso.model.Categoria;

public interface CategoriaRepository extends MongoRepository<Categoria, String> {

    // Biblioteca de um tipo ("gasto" ou "receita") de um usuário, em ordem.
    List<Categoria> findByUsuarioIdAndTipoOrderByOrdemAsc(String usuarioId, String tipo);

    // Uma categoria específica, garantindo que pertence ao usuário.
    Optional<Categoria> findByIdAndUsuarioId(String id, String usuarioId);

    // Quantas categorias o usuário já tem de um tipo (usado para semear padrões).
    long countByUsuarioIdAndTipo(String usuarioId, String tipo);

    // Detecta nome repetido no mesmo tipo (case-insensitive fica no controller).
    boolean existsByUsuarioIdAndTipoAndNome(String usuarioId, String tipo, String nome);
}
