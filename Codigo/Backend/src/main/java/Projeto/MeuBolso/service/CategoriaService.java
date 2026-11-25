package Projeto.MeuBolso.service;

import Projeto.MeuBolso.model.Categoria;
import Projeto.MeuBolso.repository.CategoriaRepository;

import java.util.ArrayList;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

/**
 * Regras da biblioteca de categorias.
 *
 * Mantém as listas padrão (as mesmas que o front usava fixas em
 * pages/Gastos/Constantes.js e pages/Receitas/Constantes.js) e semeia essas
 * categorias na primeira vez que o usuário abre a biblioteca de um tipo — assim
 * quem já usava o sistema continua vendo as categorias de sempre, e a partir
 * daí pode personalizar.
 */
@Service
public class CategoriaService {

    public static final String TIPO_GASTO = "gasto";
    public static final String TIPO_RECEITA = "receita";

    // Padrões de gasto: {nome, icone}. Ícone = nome do componente lucide-react.
    private static final String[][] PADRAO_GASTO = {
        {"Alimentação", "Utensils"},
        {"Transporte", "CarFront"},
        {"Lazer", "Gamepad2"},
        {"Moradia", "House"},
        {"Educação", "GraduationCap"},
        {"Saúde", "HeartPulse"},
        {"Assinaturas", "Clapperboard"},
        {"Outros", "Ellipsis"},
    };

    // Padrões de receita: {nome, icone}.
    private static final String[][] PADRAO_RECEITA = {
        {"Salário", "Wallet"},
        {"Freelance", "Laptop"},
        {"Investimentos", "TrendingUp"},
        {"Presente", "Gift"},
        {"Reembolso", "Undo2"},
        {"Vendas", "Tags"},
        {"Outros", "Ellipsis"},
    };

    private final CategoriaRepository repo;

    public CategoriaService(CategoriaRepository repo) {
        this.repo = repo;
    }

    /** true se o tipo é um dos valores aceitos. */
    public static boolean tipoValido(String tipo) {
        return TIPO_GASTO.equals(tipo) || TIPO_RECEITA.equals(tipo);
    }

    /**
     * Devolve a biblioteca do usuário para o tipo, semeando os padrões se ele
     * ainda não tiver nenhuma categoria daquele tipo.
     */
    public List<Categoria> listarComSemente(String usuarioId, String tipo) {
        if (repo.countByUsuarioIdAndTipo(usuarioId, tipo) == 0) {
            semear(usuarioId, tipo);
        }
        return repo.findByUsuarioIdAndTipoOrderByOrdemAsc(usuarioId, tipo);
    }

    private void semear(String usuarioId, String tipo) {
        String[][] padrao = TIPO_RECEITA.equals(tipo) ? PADRAO_RECEITA : PADRAO_GASTO;
        List<Categoria> novas = new ArrayList<>(padrao.length);
        for (int i = 0; i < padrao.length; i++) {
            novas.add(new Categoria(usuarioId, tipo, padrao[i][0], padrao[i][1], i));
        }
        repo.saveAll(novas);
    }

    /** Nomes da biblioteca do usuário para o tipo, na ordem de exibição. */
    public List<String> nomes(String usuarioId, String tipo) {
        return listarComSemente(usuarioId, tipo).stream().map(Categoria::getNome).toList();
    }

    /**
     * Confere se a categoria existe na biblioteca do usuário e devolve o nome
     * exatamente como está na biblioteca (a comparação ignora maiúsculas e
     * espaços nas pontas).
     *
     * Exceção: "atual" é a categoria que o lançamento já tinha. Ela continua
     * aceita mesmo que tenha saído da biblioteca, para que dê para editar um
     * lançamento antigo sem ser obrigado a trocar a categoria.
     *
     * Motivo: a categoria é gravada como texto. Sem esta checagem, um nome que
     * não existe na biblioteca (lista desatualizada numa aba, bug, chamada
     * direta à API) cria uma categoria "fantasma" que aparece nos relatórios
     * mas não pode ser renomeada nem removida em "Gerenciar".
     *
     * @throws ResponseStatusException 400 se a categoria não existir
     */
    public String validar(String usuarioId, String tipo, String nome, String atual) {
        String limpo = nome == null ? "" : nome.trim();
        if (limpo.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selecione a categoria.");
        }
        if (atual != null && atual.trim().equalsIgnoreCase(limpo)) {
            return atual;
        }
        return nomes(usuarioId, tipo).stream()
            .filter(existente -> existente.equalsIgnoreCase(limpo))
            .findFirst()
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "A categoria \"" + limpo + "\" não existe mais. Atualize a página e escolha outra."));
    }

    /** Próxima ordem (vai para o fim da lista). */
    public int proximaOrdem(String usuarioId, String tipo) {
        return repo.findByUsuarioIdAndTipoOrderByOrdemAsc(usuarioId, tipo).stream()
            .mapToInt(Categoria::getOrdem)
            .max()
            .orElse(-1) + 1;
    }
}
