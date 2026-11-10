package Projeto.MeuBolso.repository;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.withSettings;

import Projeto.MeuBolso.model.Usuario;
import java.util.Collection;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Answers;
import org.mockito.ArgumentCaptor;

/**
 * Regra de telefone único entre contas (UsuarioRepository.telefoneEmUsoPorOutraConta).
 * O mock é da interface e executa o método default de verdade; só a consulta
 * ao banco (findByTelefoneIn) é simulada.
 */
class UsuarioRepositoryTelefoneTest {

    UsuarioRepository repo;

    @BeforeEach
    void preparar() {
        repo = mock(UsuarioRepository.class, withSettings().defaultAnswer(Answers.CALLS_REAL_METHODS));
    }

    @Test
    void telefoneLivreNaoConflita() {
        when(repo.findByTelefoneIn(anyCollection())).thenReturn(List.of());
        assertThat(repo.telefoneEmUsoPorOutraConta("(31) 99718-6768", null)).isFalse();
    }

    @Test
    void telefoneDeOutraContaConflitaNoCadastro() {
        when(repo.findByTelefoneIn(anyCollection())).thenReturn(List.of(usuario("outro")));
        assertThat(repo.telefoneEmUsoPorOutraConta("(31) 99718-6768", null)).isTrue();
    }

    @Test
    void oProprioUsuarioNaoConflitaAoEditarOPerfil() {
        when(repo.findByTelefoneIn(anyCollection())).thenReturn(List.of(usuario("eu")));
        assertThat(repo.telefoneEmUsoPorOutraConta("(31) 99718-6768", "eu")).isFalse();
    }

    @Test
    void outraContaConflitaMesmoQueOProprioTambemApareca() {
        when(repo.findByTelefoneIn(anyCollection())).thenReturn(List.of(usuario("eu"), usuario("outro")));
        assertThat(repo.telefoneEmUsoPorOutraConta("(31) 99718-6768", "eu")).isTrue();
    }

    @Test
    @SuppressWarnings("unchecked")
    void comparaComESemONonoDigito() {
        when(repo.findByTelefoneIn(anyCollection())).thenReturn(List.of());
        repo.telefoneEmUsoPorOutraConta("(31) 99718-6768", null);

        ArgumentCaptor<Collection<String>> captor = ArgumentCaptor.forClass(Collection.class);
        verify(repo).findByTelefoneIn(captor.capture());
        assertThat(captor.getValue()).containsExactlyInAnyOrder("5531997186768", "553197186768");
    }

    @Test
    void telefoneVazioNemConsultaOBanco() {
        assertThat(repo.telefoneEmUsoPorOutraConta("", null)).isFalse();
        assertThat(repo.telefoneEmUsoPorOutraConta(null, null)).isFalse();
        verify(repo, never()).findByTelefoneIn(anyCollection());
    }

    private static Usuario usuario(String id) {
        Usuario u = new Usuario("Nome", id + "@teste.com", "31997186768", "hash");
        u.setId(id);
        return u;
    }
}
