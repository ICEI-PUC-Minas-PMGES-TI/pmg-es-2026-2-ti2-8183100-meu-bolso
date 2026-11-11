package Projeto.MeuBolso.model;

import Projeto.MeuBolso.util.Telefone;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "usuarios")
public class Usuario {
    @Id
    private String id;
    private String nome;
    @Indexed(unique = true)
    private String email;
    // Indexado para a identificação do usuário pelo WhatsApp (busca por telefone).
    // Armazenado normalizado (só dígitos, com DDI 55).
    @Indexed
    private String telefone;
    private String senhaHash;
    private String role = "USER";
    // Foto de perfil opcional, guardada como data URL (base64). Pode ser null.
    private String foto;

    public Usuario() {}
    public Usuario(String nome, String email, String telefone, String senhaHash) {
        this.nome = nome;
        this.email = email.toLowerCase().trim();
        this.telefone = Telefone.normalizar(telefone);
        this.senhaHash = senhaHash;
        this.role = "USER";
    }
    public String getId() { return id; }
    public String getNome() { return nome; }
    public String getEmail() { return email; }
    public String getTelefone() { return telefone; }
    public String getSenhaHash() { return senhaHash; }
    public String getRole() { return role; }
    public String getFoto() { return foto; }
    public void setId(String id) { this.id = id; }
    public void setNome(String nome) { this.nome = nome; }
    public void setEmail(String email) { this.email = email == null ? null : email.toLowerCase().trim(); }
    public void setTelefone(String telefone) { this.telefone = Telefone.normalizar(telefone); }
    public void setSenhaHash(String senhaHash) { this.senhaHash = senhaHash; }
    public void setRole(String role) { this.role = role; }
    public void setFoto(String foto) { this.foto = foto; }
}
