package Projeto.MeuBolso.service;

import Projeto.MeuBolso.model.Categoria;
import Projeto.MeuBolso.repository.CategoriaRepository;

import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;

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

    /** Próxima ordem (vai para o fim da lista). */
    public int proximaOrdem(String usuarioId, String tipo) {
        return repo.findByUsuarioIdAndTipoOrderByOrdemAsc(usuarioId, tipo).stream()
            .mapToInt(Categoria::getOrdem)
            .max()
            .orElse(-1) + 1;
    }
}
