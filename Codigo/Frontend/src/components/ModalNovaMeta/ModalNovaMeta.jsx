import { useState } from "react";
import { X } from "lucide-react";
import styles from "./ModalNovaMeta.module.css";

/**
 * Modal para criar uma nova meta.
 *
 * Segue o modelo de dados (ver Documentacao/ModeloDeDados.md, coleção
 * "metas"): nome, valorAlvo, valorAtual, prazo e prioridade
 * ("alta" | "media" | "baixa"). A meta nova nasce com valorAtual = 0.
 *
 * Ainda sem integração com o back-end: o onSalvar devolve o objeto da
 * meta montado para o componente pai guardar no estado local.
 *
 * props:
 *  - aberto: boolean
 *  - onFechar: fecha o modal
 *  - onSalvar: (meta) => void — recebe a meta montada
 */
const formInicial = {
  nome: "",
  valorAlvo: "",
  prazo: "",
  prioridade: "media",
};

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

function ModalNovaMeta({ aberto, onFechar, onSalvar }) {
  const [form, setForm] = useState(formInicial);
  const [erro, setErro] = useState("");

  if (!aberto) return null;

  function fecharResetando() {
    setForm(formInicial);
    setErro("");
    onFechar();
  }

  function atualizar(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  function handleSubmit(e) {
    e.preventDefault();

    const nome = form.nome.trim();
    const valorAlvo = converterValor(form.valorAlvo);

    if (!nome) {
      setErro("Dê um nome para a meta.");
      return;
    }
    if (valorAlvo == null || valorAlvo <= 0) {
      setErro("Informe um valor-alvo maior que zero.");
      return;
    }

    const meta = {
      nome,
      valorAlvo,
      valorAtual: 0,
      prazo: form.prazo || null,
      prioridade: form.prioridade,
    };

    if (onSalvar) onSalvar(meta);
    fecharResetando();
  }

  return (
    <div className={styles.overlay} onClick={fecharResetando}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label="Nova meta"
        onClick={(e) => e.stopPropagation()}
      >
        <header className={styles.cabecalho}>
          <h2>Nova meta</h2>
          <button
            className={styles.botaoFechar}
            type="button"
            onClick={fecharResetando}
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </header>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.campo}>
            <label htmlFor="nome">Nome</label>
            <input
              id="nome"
              type="text"
              placeholder="Ex: Viagem, Reserva de emergência..."
              value={form.nome}
              onChange={(e) => atualizar("nome", e.target.value)}
            />
          </div>

          <div className={styles.campo}>
            <label htmlFor="valorAlvo">Valor-alvo</label>
            <input
              id="valorAlvo"
              type="text"
              inputMode="decimal"
              placeholder="R$ 0,00"
              value={form.valorAlvo}
              onChange={(e) => atualizar("valorAlvo", e.target.value)}
            />
          </div>

          <div className={styles.campo}>
            <label htmlFor="prazo">Prazo (opcional)</label>
            <input
              id="prazo"
              type="date"
              value={form.prazo}
              onChange={(e) => atualizar("prazo", e.target.value)}
            />
          </div>

          <div className={styles.campo}>
            <label htmlFor="prioridade">Prioridade</label>
            <select
              id="prioridade"
              value={form.prioridade}
              onChange={(e) => atualizar("prioridade", e.target.value)}
            >
              <option value="alta">Alta</option>
              <option value="media">Média</option>
              <option value="baixa">Baixa</option>
            </select>
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
            <button type="submit" className={styles.btnSalvar}>
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ModalNovaMeta;
