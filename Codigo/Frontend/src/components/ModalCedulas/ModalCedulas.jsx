import { useState } from "react";
import { X, Minus, Plus } from "lucide-react";

import {
  DENOMINACOES,
  contagemZerada,
  saldoDaContagem,
  totalCentavos,
  rotuloDenominacao,
} from "../../data/denominacoes";
import { formatarBRL } from "../../pages/Carteiras/carteirasMock";
import styles from "./ModalCedulas.module.css";

/**
 * Modal de contagem de cédulas/moedas para adicionar ou retirar dinheiro.
 *
 * props:
 *  - aberto: boolean
 *  - modo: "adicionar" | "retirar"
 *  - disponivel: contagem atual (usada como teto no modo "retirar")
 *  - onFechar: () => void
 *  - onConfirmar: (contagemEscolhida) => void
 */
function ModalCedulas({ aberto, modo = "adicionar", disponivel = {}, onFechar, onConfirmar }) {
  const retirando = modo === "retirar";
  const [contagem, setContagem] = useState(contagemZerada);

  if (!aberto) return null;

  function alterar(chave, delta) {
    setContagem((c) => {
      const atual = Number(c[chave]) || 0;
      let novo = atual + delta;
      if (novo < 0) novo = 0;
      if (retirando) {
        const teto = Number(disponivel[chave]) || 0;
        if (novo > teto) novo = teto;
      }
      return { ...c, [chave]: novo };
    });
  }

  function definir(chave, texto) {
    const digitos = texto.replace(/\D/g, "").slice(0, 4);
    let novo = digitos === "" ? 0 : parseInt(digitos, 10);
    if (retirando) {
      const teto = Number(disponivel[chave]) || 0;
      if (novo > teto) novo = teto;
    }
    setContagem((c) => ({ ...c, [chave]: novo }));
  }

  function fecharResetando() {
    setContagem(contagemZerada());
    onFechar?.();
  }

  const total = saldoDaContagem(contagem);
  const vazio = totalCentavos(contagem) === 0;

  return (
    <div className={styles.overlay} onClick={fecharResetando}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label={retirando ? "Retirar dinheiro" : "Adicionar dinheiro"}
        onClick={(e) => e.stopPropagation()}
      >
        <header className={styles.cabecalho}>
          <h2>{retirando ? "Retirar dinheiro" : "Adicionar dinheiro"}</h2>
          <button
            className={styles.botaoFechar}
            type="button"
            onClick={fecharResetando}
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </header>

        <div className={styles.lista}>
          {DENOMINACOES.map((d) => {
            const qtd = Number(contagem[d.chave]) || 0;
            const teto = retirando ? Number(disponivel[d.chave]) || 0 : Infinity;
            return (
              <div key={d.chave} className={styles.linha}>
                <span className={styles.denominacao}>
                  {rotuloDenominacao(d.chave)}
                  <span className={styles.tipo}>{d.tipo}</span>
                </span>
                {retirando ? (
                  <span className={styles.disponivel}>disp. {teto}</span>
                ) : null}
                <div className={styles.contador}>
                  <button
                    type="button"
                    className={styles.botaoContador}
                    onClick={() => alterar(d.chave, -1)}
                    disabled={qtd === 0}
                    aria-label={`Diminuir ${rotuloDenominacao(d.chave)}`}
                  >
                    <Minus size={16} />
                  </button>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className={styles.inputQtd}
                    value={qtd === 0 ? "" : qtd}
                    placeholder="0"
                    onChange={(e) => definir(d.chave, e.target.value)}
                    onFocus={(e) => e.target.select()}
                    aria-label={`Quantidade de ${rotuloDenominacao(d.chave)}`}
                  />
                  <button
                    type="button"
                    className={styles.botaoContador}
                    onClick={() => alterar(d.chave, 1)}
                    disabled={retirando && qtd >= teto}
                    aria-label={`Aumentar ${rotuloDenominacao(d.chave)}`}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className={styles.rodape}>
          <div className={styles.total}>
            <span className={styles.totalRotulo}>Total</span>
            <strong className={styles.totalValor}>{formatarBRL(total)}</strong>
          </div>
          <button
            type="button"
            className={styles.botaoConfirmar}
            disabled={vazio}
            onClick={() => {
              onConfirmar?.(contagem);
              fecharResetando();
            }}
          >
            {retirando ? "Retirar" : "Adicionar"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ModalCedulas;
