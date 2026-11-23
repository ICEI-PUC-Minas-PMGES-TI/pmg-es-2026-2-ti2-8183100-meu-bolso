package Projeto.MeuBolso.controller;

import Projeto.MeuBolso.model.Categoria;
import Projeto.MeuBolso.model.CategoriaDtos.CategoriaRequest;
import Projeto.MeuBolso.model.CategoriaDtos.CategoriaResponse;
import Projeto.MeuBolso.model.Gasto;
import Projeto.MeuBolso.model.Receita;
import Projeto.MeuBolso.model.Usuario;
import Projeto.MeuBolso.repository.CategoriaRepository;
import Projeto.MeuBolso.repository.GastoRepository;
import Projeto.MeuBolso.repository.ReceitaRepository;
import Projeto.MeuBolso.repository.UsuarioRepository;
import Projeto.MeuBolso.service.CategoriaService;

import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/**
 * API da biblioteca de categorias do usuário autenticado.
 *
 * O {tipo} do caminho é "gasto" ou "receita":
 *   GET    /api/categorias/{tipo}        -> lista (semeia padrões na 1a vez)
 *   POST   /api/categorias/{tipo}        <- cria { nome, icone }
 *   PUT    /api/categorias/{tipo}/{id}   <- renomeia/troca icone; propaga o
 *                                           novo nome aos gastos/receitas
 *   DELETE /api/categorias/{tipo}/{id}   -> remove; realoca os lançamentos
 *                                           afetados para "Outros"
 */
@RestController
@RequestMapping("/api/categorias")
public class CategoriaController {

    private static final String CATEGORIA_PADRAO = "Outros";

    private final CategoriaRepository categoriaRepository;
    private final CategoriaService categoriaService;
    private final GastoRepository gastoRepository;
    private final ReceitaRepository receitaRepository;
    private final UsuarioRepository usuarioRepository;

    public CategoriaController(CategoriaRepository categoriaRepository,
                               CategoriaService categoriaService,
                               GastoRepository gastoRepository,
                               ReceitaRepository receitaRepository,
                               UsuarioRepository usuarioRepository) {
        this.categoriaRepository = categoriaRepository;
        this.categoriaService = categoriaService;
        this.gastoRepository = gastoRepository;
        this.receitaRepository = receitaRepository;
        this.usuarioRepository = usuarioRepository;
    }

    @GetMapping("/{tipo}")
    public List<CategoriaResponse> listar(@PathVariable String tipo, Authentication authentication) {
        String usuarioId = usuarioAutenticado(authentication).getId();
        validarTipo(tipo);
        return categoriaService.listarComSemente(usuarioId, tipo).stream()
            .map(CategoriaController::paraResponse)
            .toList();
    }

    @PostMapping("/{tipo}")
    public ResponseEntity<CategoriaResponse> criar(@PathVariable String tipo,
                                                   @Valid @RequestBody CategoriaRequest request,
                                                   Authentication authentication) {
        String usuarioId = usuarioAutenticado(authentication).getId();
        validarTipo(tipo);
        String nome = request.nome().trim();

        // Garante que os padrões já existam antes de validar duplicidade.
        categoriaService.listarComSemente(usuarioId, tipo);

        if (nomeJaExiste(usuarioId, tipo, nome, null)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Já existe uma categoria com esse nome.");
        }

        Categoria categoria = new Categoria(
            usuarioId, tipo, nome, iconeLimpo(request.icone()),
            categoriaService.proximaOrdem(usuarioId, tipo)
        );
        Categoria salva = categoriaRepository.save(categoria);
        return ResponseEntity.status(HttpStatus.CREATED).body(paraResponse(salva));
    }

    @PutMapping("/{tipo}/{id}")
    public CategoriaResponse atualizar(@PathVariable String tipo,
                                       @PathVariable String id,
                                       @Valid @RequestBody CategoriaRequest request,
                                       Authentication authentication) {
        String usuarioId = usuarioAutenticado(authentication).getId();
        validarTipo(tipo);

        Categoria categoria = categoriaRepository.findByIdAndUsuarioId(id, usuarioId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Categoria não encontrada."));
        if (!tipo.equals(categoria.getTipo())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Categoria não encontrada.");
        }

        String nomeAntigo = categoria.getNome();
        String nomeNovo = request.nome().trim();

        if (nomeJaExiste(usuarioId, tipo, nomeNovo, categoria.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Já existe uma categoria com esse nome.");
        }

        categoria.setNome(nomeNovo);
        categoria.setIcone(iconeLimpo(request.icone()));
        Categoria salva = categoriaRepository.save(categoria);

        // Propaga o novo nome aos lançamentos existentes (categoria é texto livre).
        if (!nomeAntigo.equals(nomeNovo)) {
            renomearEmLancamentos(usuarioId, tipo, nomeAntigo, nomeNovo);
        }

        return paraResponse(salva);
    }

    @DeleteMapping("/{tipo}/{id}")
    public ResponseEntity<Void> excluir(@PathVariable String tipo,
                                        @PathVariable String id,
                                        Authentication authentication) {
        String usuarioId = usuarioAutenticado(authentication).getId();
        validarTipo(tipo);

        Categoria categoria = categoriaRepository.findByIdAndUsuarioId(id, usuarioId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Categoria não encontrada."));
        if (!tipo.equals(categoria.getTipo())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Categoria não encontrada.");
        }

        // "Outros" é a categoria de segurança; não pode ser removida.
        if (CATEGORIA_PADRAO.equalsIgnoreCase(categoria.getNome())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "A categoria \"" + CATEGORIA_PADRAO + "\" não pode ser removida.");
        }

        // Realoca os lançamentos que usavam essa categoria para "Outros".
        renomearEmLancamentos(usuarioId, tipo, categoria.getNome(), CATEGORIA_PADRAO);

        categoriaRepository.delete(categoria);
        return ResponseEntity.noContent().build();
    }

    /* ---------- Apoio ---------- */

    // Aplica o novo nome de categoria nos gastos OU receitas do usuário.
    private void renomearEmLancamentos(String usuarioId, String tipo, String nomeAntigo, String nomeNovo) {
        if (CategoriaService.TIPO_GASTO.equals(tipo)) {
            List<Gasto> afetados = gastoRepository.findByUsuarioIdAndCategoria(usuarioId, nomeAntigo);
            for (Gasto g : afetados) {
                g.setCategoria(nomeNovo);
            }
            if (!afetados.isEmpty()) gastoRepository.saveAll(afetados);
        } else {
            List<Receita> afetados = receitaRepository.findByUsuarioIdAndCategoria(usuarioId, nomeAntigo);
            for (Receita r : afetados) {
                r.setCategoria(nomeNovo);
            }
            if (!afetados.isEmpty()) receitaRepository.saveAll(afetados);
        }
    }

    // Duplicidade de nome, ignorando acentuação de caixa e a própria categoria.
    private boolean nomeJaExiste(String usuarioId, String tipo, String nome, String idIgnorado) {
        return categoriaRepository.findByUsuarioIdAndTipoOrderByOrdemAsc(usuarioId, tipo).stream()
            .anyMatch(c -> c.getNome().equalsIgnoreCase(nome)
                && (idIgnorado == null || !c.getId().equals(idIgnorado)));
    }

    private static String iconeLimpo(String icone) {
        String i = icone == null ? "" : icone.trim();
        return i.isEmpty() ? "Tag" : i;
    }

    private static void validarTipo(String tipo) {
        if (!CategoriaService.tipoValido(tipo)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tipo de categoria inválido.");
        }
    }

    private Usuario usuarioAutenticado(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuário não autenticado.");
        }
        return usuarioRepository.findByEmail(authentication.getName())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuário não encontrado."));
    }

    private static CategoriaResponse paraResponse(Categoria c) {
        return new CategoriaResponse(c.getId(), c.getTipo(), c.getNome(), c.getIcone(), c.getOrdem());
    }
}
