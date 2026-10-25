    import { useState } from "react";

    import { converterValor, valorParaTexto } from "../../utils/Gastosutils";
    import Modal from "./Modal";
    import styles from "../../pages/Gastos/Gastos.module.css";

    export default function ModalOrcamento({ orcamentoAtual, onFechar, onSalvar }) {
    const [valor, setValor] = useState(orcamentoAtual > 0 ? valorParaTexto(orcamentoAtual) : "");
    const [erro, setErro] = useState("");
    const [salvando, setSalvando] = useState(false);

    async function salvar(novoValor) {
        setSalvando(true);
        setErro("");

        try {
        await onSalvar(novoValor);
        } catch (e) {
        setErro(e.message || "Não foi possível salvar o orçamento.");
        setSalvando(false);
        }
    }

    function enviar(event) {
        event.preventDefault();

        const numero = converterValor(valor);

        if (!valor.trim() || !Number.isFinite(numero) || numero <= 0) {
        setErro("Informe um valor maior que zero.");
        return;
        }

        salvar(numero);
    }

    return (
        <Modal titulo="Orçamento mensal" onFechar={onFechar} largura={440}>
        <form className={styles["gastos-form-coluna"]} onSubmit={enviar} noValidate>
            <p className="texto-secundario texto-pequeno">
            Quanto você quer gastar, no máximo, em cada mês. O mesmo valor vale para todos
            os meses.
            </p>

            <div className="form-group">
            <label className="form-label" htmlFor="orcamento-valor">
                Valor (R$)
            </label>
            <input
                id="orcamento-valor"
                className="form-input"
                inputMode="decimal"
                placeholder="2.000,00"
                value={valor}
                onChange={(event) => {
                setValor(event.target.value);
                setErro("");
                }}
                autoFocus
            />
            </div>

            {erro && (
            <p className="mensagem mensagem-erro" role="alert">
                {erro}
            </p>
            )}

            <div className={styles["gastos-form-acoes"]}>
            {orcamentoAtual > 0 && (
                <button
                type="button"
                className={`btn btn-secundario ${styles["gastos-acao-esquerda"]}`}
                onClick={() => salvar(0)}
                disabled={salvando}
                >
                Remover orçamento
                </button>
            )}

            <button type="button" className="btn btn-secundario" onClick={onFechar}>
                Cancelar
            </button>

            <button type="submit" className="btn btn-primario" disabled={salvando}>
                {salvando ? "Salvando..." : "Salvar"}
            </button>
            </div>
        </form>
        </Modal>
    );
    }