import { Calculator } from "lucide-react";

import styles from "./Simulacao.module.css";
import { CATEGORIAS, formatarMoeda } from "./calculoSimulacao";

// Mensagem de erro de um campo do formulário.
function ErroCampo({ texto }) {
  if (!texto) return null;
  return (
    <span className={`mensagem mensagem-erro ${styles.erroCampo}`}>{texto}</span>
  );
}

// Formulário "Dados da compra". Componente controlado: os valores e o
// callback de alteração vêm da página; aqui só cuidamos da apresentação.
function FormularioCompra({ form, erros, carteiras, aoAlterar, aoCalcular }) {
  const { valor, categoria, forma, parcelas, carteiraId } = form;
  const semCarteiras = carteiras.length === 0;

  return (
    <form className={`card ${styles.formulario}`} onSubmit={aoCalcular} noValidate>
      <div>
        <h3>Dados da compra</h3>
        <p className="texto-secundario texto-pequeno">
          Preencha os campos para criar um cenário
        </p>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="valor">
          Valor da compra
        </label>
        <input
          id="valor"
          className="form-input"
          inputMode="decimal"
          placeholder="R$ 850,00"
          value={valor}
          onChange={(e) => aoAlterar("valor", e.target.value)}
          aria-invalid={Boolean(erros.valor)}
        />
        <ErroCampo texto={erros.valor} />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="categoria">
          Categoria
        </label>
        <select
          id="categoria"
          className="form-input"
          value={categoria}
          onChange={(e) => aoAlterar("categoria", e.target.value)}
        >
          {CATEGORIAS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <span className="form-label">Forma de pagamento</span>
        <div className={styles.toggle} role="group" aria-label="Forma de pagamento">
          <button
            type="button"
            className={`${styles.toggleBotao} ${forma === "avista" ? styles.toggleAtivo : ""}`}
            aria-pressed={forma === "avista"}
            onClick={() => aoAlterar("forma", "avista")}
          >
            À vista
          </button>
          <button
            type="button"
            className={`${styles.toggleBotao} ${forma === "parcelado" ? styles.toggleAtivo : ""}`}
            aria-pressed={forma === "parcelado"}
            onClick={() => aoAlterar("forma", "parcelado")}
          >
            Parcelado
          </button>
        </div>
      </div>

      {/* Nº de parcelas: só quando a forma for "parcelado" */}
      {forma === "parcelado" && (
        <div className="form-group">
          <label className="form-label" htmlFor="parcelas">
            Número de parcelas
          </label>
          <input
            id="parcelas"
            className="form-input"
            type="number"
            min="2"
            step="1"
            value={parcelas}
            onChange={(e) => aoAlterar("parcelas", e.target.value)}
            aria-invalid={Boolean(erros.parcelas)}
          />
          <ErroCampo texto={erros.parcelas} />
        </div>
      )}

      <div className="form-group">
        <label className="form-label" htmlFor="carteira">
          Carteira
        </label>
        {semCarteiras ? (
          <p className="texto-secundario texto-pequeno">
            Nenhuma carteira com saldo encontrada.
          </p>
        ) : (
          <select
            id="carteira"
            className="form-input"
            value={carteiraId}
            onChange={(e) => aoAlterar("carteiraId", e.target.value)}
          >
            {carteiras.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome} — {formatarMoeda(c.saldo)}
              </option>
            ))}
          </select>
        )}
      </div>

      <button type="submit" className="btn btn-primario btn-full" disabled={semCarteiras}>
        <Calculator size={18} aria-hidden="true" />
        Calcular impacto
      </button>
    </form>
  );
}

export default FormularioCompra;
