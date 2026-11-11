package Projeto.MeuBolso.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

/**
 * Regras de validação/normalização da foto de perfil. Sem Spring nem
 * Mongo: só o método puro {@link FotoPerfilService#normalizar}.
 */
class FotoPerfilServiceTest {

    FotoPerfilService service;

    @BeforeEach
    void preparar() {
        service = new FotoPerfilService();
    }

    @Test
    void fotoValidaEhMantida() {
        String foto = "data:image/png;base64,AAAA";
        assertThat(service.normalizar(foto)).isEqualTo(foto);
    }

    @Test
    void jpegEWebpTambemSaoAceitos() {
        assertThat(service.normalizar("data:image/jpeg;base64,AAAA"))
            .isEqualTo("data:image/jpeg;base64,AAAA");
        assertThat(service.normalizar("data:image/webp;base64,AAAA"))
            .isEqualTo("data:image/webp;base64,AAAA");
    }

    @Test
    void nullRemoveAFoto() {
        assertThat(service.normalizar(null)).isNull();
    }

    @Test
    void vazioRemoveAFoto() {
        assertThat(service.normalizar("")).isNull();
        assertThat(service.normalizar("   ")).isNull();
    }

    @Test
    void prefixoInvalidoDa400() {
        assertThatThrownBy(() -> service.normalizar("data:image/gif;base64,AAAA"))
            .isInstanceOf(ResponseStatusException.class)
            .extracting(e -> ((ResponseStatusException) e).getStatusCode())
            .isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void textoSemPrefixoDataUrlDa400() {
        assertThatThrownBy(() -> service.normalizar("AAAA"))
            .isInstanceOf(ResponseStatusException.class)
            .extracting(e -> ((ResponseStatusException) e).getStatusCode())
            .isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void grandeDemaisDa400() {
        String grande = "data:image/png;base64,"
            + "A".repeat(FotoPerfilService.TAMANHO_MAXIMO + 1);
        assertThatThrownBy(() -> service.normalizar(grande))
            .isInstanceOf(ResponseStatusException.class)
            .extracting(e -> ((ResponseStatusException) e).getStatusCode())
            .isEqualTo(HttpStatus.BAD_REQUEST);
    }
}
