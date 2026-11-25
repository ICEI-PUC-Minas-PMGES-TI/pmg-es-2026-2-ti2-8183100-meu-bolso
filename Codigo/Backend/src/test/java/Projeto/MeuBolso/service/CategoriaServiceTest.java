package Projeto.MeuBolso.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import Projeto.MeuBolso.model.Categoria;
import Projeto.MeuBolso.repository.CategoriaRepository;

import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

/**
 * Validação da categoria de um lançamento contra a biblioteca do usuário.
 * Só o repositório (interface) é mockado.
 */
@ExtendWith(MockitoExtension.class)
class CategoriaServiceTest {

    private static final String USUARIO = "u1";

    @Mock CategoriaRepository repo;

    CategoriaService service;

    @BeforeEach
    void preparar() {
        service = new CategoriaService(repo);
    }

    private void biblioteca(String tipo, String... nomes) {
        List<Categoria> lista = new java.util.ArrayList<>();
        for (int i = 0; i < nomes.length; i++) {
            lista.add(new Categoria(USUARIO, tipo, nomes[i], "Tag", i));
        }
        when(repo.countByUsuarioIdAndTipo(USUARIO, tipo)).thenReturn((long) lista.size());
        when(repo.findByUsuarioIdAndTipoOrderByOrdemAsc(USUARIO, tipo)).thenReturn(lista);
    }

    @Test
    void aceitaCategoriaDaBibliotecaEDevolveONomeComoEstaNela() {
        biblioteca(CategoriaService.TIPO_GASTO, "Alimentação", "Diversão", "Outros");

        assertThat(service.validar(USUARIO, CategoriaService.TIPO_GASTO, "Diversão", null)).isEqualTo("Diversão");
        // Ignora maiúsculas e espaços nas pontas, mas grava o nome da biblioteca.
        assertThat(service.validar(USUARIO, CategoriaService.TIPO_GASTO, "  diversão ", null)).isEqualTo("Diversão");
    }

    @Test
    void recusaCategoriaQueNaoExisteNaBiblioteca() {
        // Caso real: "Lazer" foi renomeada para "Diversão" no site.
        biblioteca(CategoriaService.TIPO_GASTO, "Alimentação", "Diversão", "Outros");

        assertThatThrownBy(() -> service.validar(USUARIO, CategoriaService.TIPO_GASTO, "Lazer", null))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("Lazer")
            .hasMessageContaining("não existe mais");
    }

    @Test
    void categoriaDeReceitaNaoValeParaGasto() {
        biblioteca(CategoriaService.TIPO_GASTO, "Alimentação", "Outros");

        assertThatThrownBy(() -> service.validar(USUARIO, CategoriaService.TIPO_GASTO, "Salário", null))
            .isInstanceOf(ResponseStatusException.class);
    }

    @Test
    void aoEditarAceitaACategoriaQueOLancamentoJaTinhaMesmoForaDaBiblioteca() {
        // "Lazer" saiu da biblioteca, mas o gasto antigo ainda está nela: dá para
        // editar o valor sem ser obrigado a trocar a categoria.
        assertThat(service.validar(USUARIO, CategoriaService.TIPO_GASTO, "Lazer", "Lazer")).isEqualTo("Lazer");
        verify(repo, never()).findByUsuarioIdAndTipoOrderByOrdemAsc(USUARIO, CategoriaService.TIPO_GASTO);
    }

    @Test
    void aoEditarTrocarParaUmaCategoriaInexistenteContinuaRecusado() {
        biblioteca(CategoriaService.TIPO_GASTO, "Alimentação", "Outros");

        assertThatThrownBy(() -> service.validar(USUARIO, CategoriaService.TIPO_GASTO, "Viagem", "Lazer"))
            .isInstanceOf(ResponseStatusException.class);
    }

    @Test
    void categoriaVaziaERecusada() {
        assertThatThrownBy(() -> service.validar(USUARIO, CategoriaService.TIPO_GASTO, "  ", null))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("Selecione a categoria");
    }

    @Test
    void bibliotecaVaziaGanhaOsPadroesAntesDeValidar() {
        // Usuário que só usou o WhatsApp: ainda não tem biblioteca gravada.
        when(repo.countByUsuarioIdAndTipo(USUARIO, CategoriaService.TIPO_RECEITA)).thenReturn(0L);
        when(repo.findByUsuarioIdAndTipoOrderByOrdemAsc(USUARIO, CategoriaService.TIPO_RECEITA))
            .thenReturn(List.of(new Categoria(USUARIO, CategoriaService.TIPO_RECEITA, "Salário", "Wallet", 0)));

        assertThat(service.validar(USUARIO, CategoriaService.TIPO_RECEITA, "Salário", null)).isEqualTo("Salário");
        verify(repo).saveAll(anyList());
    }
}
