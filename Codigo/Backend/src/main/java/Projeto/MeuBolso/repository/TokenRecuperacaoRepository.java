package Projeto.MeuBolso.repository;

import Projeto.MeuBolso.model.TokenRecuperacao;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface TokenRecuperacaoRepository extends MongoRepository<TokenRecuperacao, String> {
    Optional<TokenRecuperacao> findByTokenHash(String tokenHash);

    // Apaga os tokens antigos do usuário (só o mais recente deve valer).
    void deleteByUsuarioId(String usuarioId);

    // Devolve quantos documentos foram apagados: usado para "consumir" o token
    // uma única vez (se devolver 0, outra requisição já o usou).
    long deleteByTokenHash(String tokenHash);
}
