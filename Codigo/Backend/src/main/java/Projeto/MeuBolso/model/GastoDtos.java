package Projeto.MeuBolso.model;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
<<<<<<< HEAD
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;

public final class GastoDtos {
    private GastoDtos() {}

    public record GastoRequest(
        @NotBlank @Size(max = 120) String descricao,
        @NotBlank @Size(max = 60) String categoria,
        @NotBlank @Size(max = 60) String carteira,
        @NotNull @DecimalMin("0.01") BigDecimal valor,
        @NotNull LocalDate data,
        @Size(max = 300) String comentario,
        Boolean recorrente
    ) {}

    public record GastoResponse(
        String id, String descricao, String categoria, String carteira,
        BigDecimal valor, LocalDate data, String comentario, String recorrenciaId
    ) {
        public static GastoResponse de(Gasto g) {
            return new GastoResponse(g.getId(), g.getDescricao(), g.getCategoria(), g.getCarteira(),
                g.getValor(), g.getData(), g.getComentario(), g.getRecorrenciaId());
        }
    }

    public record ComentarioRequest(@Size(max = 300) String comentario) {}

    public record RecorrenteRequest(
        @NotBlank @Size(max = 120) String descricao,
        @NotBlank @Size(max = 60) String categoria,
        @NotBlank @Size(max = 60) String carteira,
        @NotNull @DecimalMin("0.01") BigDecimal valor,
        @NotNull @Min(1) @Max(31) Integer diaDoMes,
        @Size(max = 300) String comentario,
        Boolean ativa
    ) {}

    public record RecorrenteResponse(
        String id, String descricao, String categoria, String carteira,
        BigDecimal valor, int diaDoMes, String comentario, boolean ativa, String ultimoMes
    ) {
        public static RecorrenteResponse de(GastoRecorrente r) {
            return new RecorrenteResponse(r.getId(), r.getDescricao(), r.getCategoria(), r.getCarteira(),
                r.getValor(), r.getDiaDoMes(), r.getComentario(), r.isAtiva(), r.getUltimoMes());
        }
    }

    public record OrcamentoRequest(@NotNull @DecimalMin("0.00") BigDecimal valorMensal) {}

    public record OrcamentoResponse(BigDecimal valorMensal) {}
}
=======
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

/**
 * DTOs da API de gastos, recorrências e orçamento. Segue o padrão de MetaDtos:
 * classe final agrupadora com records aninhados e validação Jakarta.
 *
 * O contrato (nomes dos campos) espelha o front em service/gastosService.js e
 * service/Api.js (gastosApi).
 */
public final class GastoDtos {
    private GastoDtos() {}

    // Datas viajam como texto "AAAA-MM-DD" (mesmo contrato do front).
    private static final String PADRAO_DATA = "\\d{4}-\\d{2}-\\d{2}";

    /** Dados que o cliente envia ao criar ou editar um gasto. */
    public record GastoRequest(
        @NotBlank @Size(max = 200) String descricao,
        @NotBlank @Size(max = 60) String categoria,
        @NotBlank @Size(max = 60) String carteira,
        @NotBlank @Pattern(regexp = PADRAO_DATA, message = "Data deve estar no formato AAAA-MM-DD.") String data,
        @NotNull @DecimalMin(value = "0.01", message = "O valor deve ser maior que zero.") BigDecimal valor,
        @Size(max = 300) String comentario,
        boolean recorrente
    ) {}

    /** Dados que a API devolve para cada gasto. */
    public record GastoResponse(
        String id,
        String descricao,
        String categoria,
        String carteira,
        String data,
        BigDecimal valor,
        String comentario,
        String recorrenciaId
    ) {}

    /** Corpo do PATCH de comentário. */
    public record ComentarioRequest(
        @Size(max = 300) String comentario
    ) {}

    /** Dados que o cliente envia ao atualizar uma recorrência (objeto completo). */
    public record RecorrenciaRequest(
        @NotBlank @Size(max = 200) String descricao,
        @NotBlank @Size(max = 60) String categoria,
        @NotBlank @Size(max = 60) String carteira,
        @NotNull @DecimalMin(value = "0.01", message = "O valor deve ser maior que zero.") BigDecimal valor,
        @Min(value = 1, message = "O dia do mês deve estar entre 1 e 31.")
        @Max(value = 31, message = "O dia do mês deve estar entre 1 e 31.") int diaDoMes,
        @Size(max = 300) String comentario,
        boolean ativa
    ) {}

    /** Dados que a API devolve para cada recorrência. */
    public record RecorrenciaResponse(
        String id,
        String descricao,
        String categoria,
        String carteira,
        BigDecimal valor,
        String comentario,
        int diaDoMes,
        boolean ativa,
        String ultimoMes
    ) {}

    /** Corpo e resposta do orçamento. */
    public record OrcamentoRequest(
        @NotNull @DecimalMin(value = "0.00", message = "O orçamento não pode ser negativo.") BigDecimal valorMensal
    ) {}

    public record OrcamentoResponse(BigDecimal valorMensal) {}
}
>>>>>>> 3af0db57f8043fc8f226b9843d3e51f60f9c7aae
