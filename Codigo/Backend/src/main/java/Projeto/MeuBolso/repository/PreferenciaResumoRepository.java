package Projeto.MeuBolso.repository;

import Projeto.MeuBolso.model.PreferenciaResumo;
import java.util.List;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface PreferenciaResumoRepository extends MongoRepository<PreferenciaResumo, String> {

    // A preferência de um usuário (uma por usuário).
    Optional<PreferenciaResumo> findByUsuarioId(String usuarioId);

    // Usado pelo agendador: todos que querem receber o resumo.
    List<PreferenciaResumo> findByAtivoTrue();

    // Usado no cancelamento pelo link do e-mail (busca pelo hash do token).
    Optional<PreferenciaResumo> findByTokenHash(String tokenHash);
}
