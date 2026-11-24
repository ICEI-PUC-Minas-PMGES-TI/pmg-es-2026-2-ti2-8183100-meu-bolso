package Projeto.MeuBolso.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * Categoria personalizável de gasto ou receita — coleção "categorias".
 *
 * É a "biblioteca" do usuário: cada pessoa monta a própria lista de categorias
 * de gasto e de receita (adicionar, renomear, trocar o ícone, remover). Antes
 * as categorias eram listas fixas no front (nos arquivos Constantes.js das
 * páginas de Gastos e Receitas); agora elas vivem no banco, por usuário.
 *
 * tipo: "gasto" ou "receita" — separa as duas bibliotecas.
 * icone: chave de um ícone (nome do ícone lucide-react) que o front mapeia.
 *
 * O par (usuarioId, tipo, nome) é único: não dá para ter duas categorias de
 * mesmo nome e tipo para o mesmo usuário.
 */
@Document(collection = "categorias")
@CompoundIndex(name = "usuario_tipo_nome", def = "{'usuarioId': 1, 'tipo': 1, 'nome': 1}", unique = true)
public class Categoria {
    @Id
    private String id;

    @Indexed
    private String usuarioId;

    // "gasto" ou "receita"
    private String tipo;

    private String nome;

    // Chave do ícone (nome lucide-react, ex.: "Utensils"); o front resolve.
    private String icone;

    // Ordem de exibição (menor primeiro). Facilita manter a lista estável.
    private int ordem;

    public Categoria() {}

    public Categoria(String usuarioId, String tipo, String nome, String icone, int ordem) {
        this.usuarioId = usuarioId;
        this.tipo = tipo;
        this.nome = nome;
        this.icone = icone;
        this.ordem = ordem;
    }

    public String getId() { return id; }
    public String getUsuarioId() { return usuarioId; }
    public String getTipo() { return tipo; }
    public String getNome() { return nome; }
    public String getIcone() { return icone; }
    public int getOrdem() { return ordem; }

    public void setId(String id) { this.id = id; }
    public void setUsuarioId(String usuarioId) { this.usuarioId = usuarioId; }
    public void setTipo(String tipo) { this.tipo = tipo; }
    public void setNome(String nome) { this.nome = nome; }
    public void setIcone(String icone) { this.icone = icone; }
    public void setOrdem(int ordem) { this.ordem = ordem; }
}
