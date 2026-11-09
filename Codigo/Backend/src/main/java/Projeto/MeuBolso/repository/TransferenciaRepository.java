package Projeto.MeuBolso.repository;

import Projeto.MeuBolso.model.Transferencia;
import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface TransferenciaRepository extends MongoRepository<Transferencia, String> {

    // Histórico de transferências do usuário (isolamento por dono).
    List<Transferencia> findByUsuarioId(String usuarioId);
}
