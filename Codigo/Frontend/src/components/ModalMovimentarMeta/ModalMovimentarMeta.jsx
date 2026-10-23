import { useState } from "react";
import { X, ArrowDownCircle, ArrowUpCircle } from "lucide-react";

import { listarCarteirasComSaldo } from "../../service/carteirasStorage";
import styles from "./ModalMovimentarMeta.module.css";

/**
 * Modal para movimentar o valor guardado de uma meta, sempre vinculado a
 * uma carteira (conta ou dinheiro físico).
 *
 *  - Depósito: o dinheiro SAI da carteira e ENTRA na meta
 *    (carteira.saldo -= valor; meta.valorAtual += valor).
 *  - Retirada: o dinheiro ENTRA na carteira e SAI da meta
 *    (carteira.saldo += valor; meta.valorAtual -= valor).
 *
 * Segue o modelo de dados (ver Documentacao/ModeloDeDados.md): no back-end
 * cada movimentação vira uma `transacao` com `metaId` e `carteiraId`, e os
 * saldos são recalculados. Enquanto não há back-end, o modal devolve o
 * resultado para o componente pai aplicar no estado/localStorage.
 *
 * props:
 *  - aberto: boolean
 *  - meta: a meta que será movimentada (usa nome e valorAtual)
 *  - onFechar: fecha o modal
 *  - onConfirmar: (meta, { tipo, valor, novoValorAtual, carteiraId }) => void
 */

/** Converte o texto digitado em número (aceita "1.234,56" ou "1234.56"). */
function converterValor(texto) {
  if (texto === "" || texto == null) return undefined;
  const limpo = String(texto)
    .replace(/[^\d,.-]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const n = parseFloat(limpo);
  return Number.isFinite(n) ? n : undefined;
}

/** Formata um número como moeda brasileira (R$). */
function formatarMoeda(valor) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor ?? 0);
}

function ModalMovimentarMeta({ aberto, meta, onFechar, onConfirmar }) {
  // "deposito" soma ao valor guardado; "retirada" subtrai.
  const [tipo, setTipo] = useState("deposito");
  const [valor, setValor] = useState("");
  const [carteiraId, setCarteiraId] = useState("");
  const [erro, setErro] = useState("");

  // Carteiras com saldo (contas e dinheiro físico) disponíveis como
  // origem/destino da movimentação. Lidas ao montar o modal.
  const [carteiras] = useState(() => listarCarteirasComSaldo());

  if (!aberto || !meta) return null;

  const valorAtual = meta.valorAtual ?? 0;
  const carteiraSelecionada = carteiras.find((c) => c.id === carteiraId) || null;

  function fecharResetando() {
    setTipo("deposito");
    setValor("");
    setCarteiraId("");
    setErro("");
    onFechar();
  }

  function handleSubmit(e) {
    e.preventDefault();

    if (!carteiraId) {
      setErro("Selecione a carteira da movimentação.");
      return;
    }

    const valorNum = converterValor(valor);

    if (valorNum == null || valorNum <= 0) {
      setErro("Informe um valor maior que zero.");
      return;
    }

    if (tipo === "deposito") {
      // Sai da carteira, entra na meta: carteira precisa ter saldo.
      if (carteiraSelecionada && valorNum > carteiraSelecionada.saldo) {
        setErro("Saldo insuficiente na carteira para este depósito.");
        return;
      }
    } else {
      // Retirada: sai da meta, entra na carteira: a meta precisa ter valor.
      if (valorNum > valorAtual) {
        setErro("A retirada não pode ser maior que o valor guardado na meta.");
        return;
      }
    }

    const novoValorAtual =
      tipo === "deposito" ? valorAtual + valorNum : valorAtual - valorNum;

    if (onConfirmar) {
      onConfirmar(meta, { tipo, valor: valorNum, novoValorAtual, carteiraId });
    }
    fecharResetando();
  }

  return (
    <div className={styles.overlay} onClick={fecharResetando}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label="Movimentar meta"
        onClick={(e) => e.stopPropagation()}
      >
        <header className={styles.cabecalho}>
          <h2>Movimentar meta</h2>
          <button
            className={styles.botaoFechar}
            type="button"
            onClick={fecharResetando}
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </header>

        <p className={styles.resumo}>
          <span className="texto-secundario texto-pequeno">
            {meta.nome} · guardado
          </span>
          <strong>{formatarMoeda(valorAtual)}</strong>
        </p>

        <form className={styles.form} onSubmit={handleSubmit}>
          {/* Seletor de tipo de movimentação */}
          <div
            className={styles.tipoSeletor}
            role="group"
            aria-label="Tipo de movimentação"
          >
            <button
              type="button"
              className={`${styles.tipoBotao} ${
                tipo === "deposito" ? styles.tipoAtivoDeposito : ""
              }`}
              onClick={() => setTipo("deposito")}
              aria-pressed={tipo === "deposito"}
            >
              <ArrowUpCircle size={18} aria-hidden="true" />
              Depositar
            </button>
            <button
              type="button"
              className={`${styles.tipoBotao} ${
                tipo === "retirada" ? styles.tipoAtivoRetirada : ""
              }`}
              onClick={() => setTipo("retirada")}
              aria-pressed={tipo === "retirada"}
            >
              <ArrowDownCircle size={18} aria-hidden="true" />
              Retirar
            </button>
          </div>

          {/* Carteira vinculada */}
          <div className={styles.campo}>
            <label htmlFor="carteira">
              {tipo === "deposito" ? "De qual carteira sai" : "Para qual carteira vai"}
            </label>
            {carteiras.length === 0 ? (
              <p className={styles.aviso}>
                Nenhuma carteira com saldo encontrada. Cadastre uma conta ou
                dinheiro na página Carteiras.
              </p>
            ) : (
              <select
                id="carteira"
                value={carteiraId}
                onChange={(e) => setCarteiraId(e.target.value)}
              >
                <option value="">Selecione uma carteira</option>
                {carteiras.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome} · {formatarMoeda(c.saldo)}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className={styles.campo}>
            <label htmlFor="valorMovimento">Valor</label>
            <input
              id="valorMovimento"
              type="text"
              inputMode="decimal"
              placeholder="R$ 0,00"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
            />
          </div>

          {erro && <p className={styles.erro}>{erro}</p>}

          <div className={styles.formAcoes}>
            <button
              type="button"
              className={styles.btnVoltar}
              onClick={fecharResetando}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.btnSalvar}
              disabled={carteiras.length === 0}
            >
              {tipo === "deposito" ? "Depositar" : "Retirar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ModalMovimentarMeta;
