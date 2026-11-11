package Projeto.MeuBolso.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

/**
 * Regras da foto de perfil: valida o formato (data URL base64 de
 * jpeg/png/webp) e o tamanho, e normaliza a remoção.
 *
 * Sem Spring nem Mongo nas regras: tudo em {@link #normalizar(String)},
 * um método puro, fácil de testar com Mockito/JUnit.
 */
@Service
public class FotoPerfilService {

    /** Tamanho máximo do texto da data URL. */
    public static final int TAMANHO_MAXIMO = 300_000;

    private static final String[] PREFIXOS = {
        "data:image/jpeg;base64,",
        "data:image/png;base64,",
        "data:image/webp;base64,"
    };

    /**
     * Valida e normaliza a foto recebida.
     *
     * @return a data URL válida, ou {@code null} quando a entrada é null/vazia
     *         (remoção da foto).
     * @throws ResponseStatusException 400 se o prefixo for inválido ou o
     *         texto for grande demais.
     */
    public String normalizar(String foto) {
        if (foto == null || foto.isBlank()) {
            return null; // remove a foto
        }

        if (foto.length() > TAMANHO_MAXIMO) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Imagem grande demais.");
        }

        for (String prefixo : PREFIXOS) {
            if (foto.startsWith(prefixo)) {
                return foto;
            }
        }
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Formato de imagem inválido.");
    }
}
