package Projeto.MeuBolso.repository;

import Projeto.MeuBolso.model.CarteiraUsuario;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface CarteiraUsuarioRepository extends MongoRepository<CarteiraUsuario, String> {

    Optional<CarteiraUsuario> findByUsuarioId(String usuarioId);
}
