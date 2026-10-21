package Projeto.MeuBolso.model;

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
    private String telefone;
    private String senhaHash;
    private String role = "USER";

    public Usuario() {}
    public Usuario(String nome, String email, String telefone, String senhaHash) {
        this.nome = nome;
        this.email = email.toLowerCase().trim();
        this.telefone = telefone;
        this.senhaHash = senhaHash;
        this.role = "USER";
    }
    public String getId() { return id; }
    public String getNome() { return nome; }
    public String getEmail() { return email; }
    public String getTelefone() { return telefone; }
    public String getSenhaHash() { return senhaHash; }
    public String getRole() { return role; }
    public void setId(String id) { this.id = id; }
    public void setNome(String nome) { this.nome = nome; }
    public void setEmail(String email) { this.email = email == null ? null : email.toLowerCase().trim(); }
    public void setTelefone(String telefone) { this.telefone = telefone; }
    public void setSenhaHash(String senhaHash) { this.senhaHash = senhaHash; }
    public void setRole(String role) { this.role = role; }
}
