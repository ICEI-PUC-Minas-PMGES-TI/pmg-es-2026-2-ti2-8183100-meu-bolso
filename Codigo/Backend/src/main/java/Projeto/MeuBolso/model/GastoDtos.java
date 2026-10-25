package Projeto.MeuBolso.model;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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