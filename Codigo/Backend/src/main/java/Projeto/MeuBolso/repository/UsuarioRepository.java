package Projeto.MeuBolso.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;
// Adicione a linha abaixo com o pacote correto da sua classe Usuario:
import Projeto.MeuBolso.model.Usuario; 

public interface UsuarioRepository extends MongoRepository<Usuario, String> {
    Optional<Usuario> findByEmail(String email);
    boolean existsByEmail(String email);
    // Usado ao trocar o e-mail: detecta duplicidade ignorando o próprio usuário.
    boolean existsByEmailAndIdNot(String email, String id);
    // Identificação do usuário pelo WhatsApp: busca pelo telefone normalizado.
    Optional<Usuario> findByTelefone(String telefone);
    // Busca por qualquer forma equivalente do número (com/sem o nono dígito).
    // Use com Telefone.variantes(...). Pode trazer mais de um se houver cadastro duplicado.
    List<Usuario> findByTelefoneIn(Collection<String> telefones);
}