package Projeto.MeuBolso.whatsapp;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;

class ValorMonetarioTest {

    @ParameterizedTest
    @CsvSource(delimiter = '|', value = {
        "50|50.00",
        "50,9|50.90",
        "50,90|50.90",
        "50.90|50.90",
        "R$ 25,90|25.90",
        "r$25|25.00",
        "1.234,56|1234.56",
        "1.234|1234.00",
        "12.345.678|12345678.00",
        "1234.5|1234.50",
        "0,01|0.01",
        "  80  |80.00",
    })
    void interpretaFormatosAceitos(String texto, String esperado) {
        assertThat(ValorMonetario.interpretar(texto)).hasValueSatisfying(
            v -> assertThat(v).isEqualByComparingTo(esperado));
    }

    @ParameterizedTest
    @ValueSource(strings = {"", "abc", "0", "0,00", "-10", "10,999", "1,2,3", "R$", "dez reais", "1000000000"})
    void rejeitaValoresInvalidos(String texto) {
        assertThat(ValorMonetario.interpretar(texto)).isEmpty();
    }

    @org.junit.jupiter.api.Test
    void rejeitaNulo() {
        assertThat(ValorMonetario.interpretar(null)).isEmpty();
    }
}
