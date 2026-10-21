package Projeto.MeuBolso.repository;

import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;
// Adicione a linha abaixo com o pacote correto da sua classe Usuario:
import Projeto.MeuBolso.model.Usuario; 

public interface UsuarioRepository extends MongoRepository<Usuario, String> {
    Optional<Usuario> findByEmail(String email);
    boolean existsByEmail(String email);
}