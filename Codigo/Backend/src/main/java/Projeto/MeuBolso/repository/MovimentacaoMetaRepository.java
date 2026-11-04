package Projeto.MeuBolso.repository;

import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;

import Projeto.MeuBolso.model.MovimentacaoMeta;

public interface MovimentacaoMetaRepository extends MongoRepository<MovimentacaoMeta, String> {

    // Histórico de uma meta (mais recente primeiro), isolado por usuário.
    List<MovimentacaoMeta> findByMetaIdAndUsuarioIdOrderByDataDesc(String metaId, String usuarioId);

    // Usado ao excluir uma meta: remove o histórico associado.
    void deleteByMetaIdAndUsuarioId(String metaId, String usuarioId);
}
