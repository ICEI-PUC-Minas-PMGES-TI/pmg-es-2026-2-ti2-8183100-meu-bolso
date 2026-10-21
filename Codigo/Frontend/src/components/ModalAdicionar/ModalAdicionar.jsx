import { useState } from "react";
import { X, CreditCard, Landmark, Wallet, PiggyBank } from "lucide-react";
import styles from "./ModalAdicionar.module.css";

/**
 * Modal para adicionar OU editar um item da carteira.
 * Etapa 1: escolher o tipo (apenas ao adicionar).
 * Etapa 2: campos básicos. Sem número completo, CVV ou senha.
 *
 * props:
 *  - aberto: boolean
 *  - onFechar: fecha o modal
 *  - onSalvar: (item) => void  — recebe o item montado (novo ou editado)
 *  - contas: lista de contas já cadastradas (para os seletores)
 *  - itemEditando: item existente para edição (ou null para adicionar)
 */
const tiposDisponiveis = [
  { tipo: "cartao", nome: "Cartão", descricao: "Crédito ou débito", icone: CreditCard },
  { tipo: "conta", nome: "Conta bancária", descricao: "Conta corrente ou pagamento", icone: Landmark },
  { tipo: "dinheiro", nome: "Dinheiro físico", descricao: "Espécie na carteira", icone: Wallet },
  { tipo: "reserva", nome: "Reserva", descricao: "Emergência, poupança...", icone: PiggyBank },
];

const formInicial = {
  apelido: "",
  // cartão
  subtipo: "credito",
  bandeira: "",
  titular: "",
  validade: "",
  ultimosDigitos: "",
  limite: "",
  contaId: "",
  // conta
  instituicao: "",
  saldo: "",
  // dinheiro / reserva
  valor: "",
  objetivo: "",
};

/** Número -> string editável no input (sem forçar formato de moeda). */
function numParaTexto(n) {
  return n == null ? "" : String(n);
}

/** Monta o estado do formulário a partir de um item existente. */
function formDoItem(item) {
  if (!item) return formInicial;
  return {
    ...formInicial,
    apelido: item.apelido || "",
    subtipo: item.subtipo || "credito",
    bandeira: item.bandeira || "",
    titular: item.titular || "",
    validade: item.validade || "",
    ultimosDigitos: item.ultimosDigitos || "",
    limite: numParaTexto(item.limite),
    contaId: item.contaId || "",
    instituicao: item.instituicao || "",
    saldo: numParaTexto(item.saldo),
    valor: numParaTexto(item.valorReservado ?? (item.tipo === "dinheiro" ? item.saldo : undefined)),
    objetivo: numParaTexto(item.objetivo),
  };
}

function ModalAdicionar({ aberto, onFechar, onSalvar, contas = [], itemEditando = null }) {
  const editando = Boolean(itemEditando);
  // Estado inicializado a partir das props. O componente é remontado via
  // `key` no pai sempre que muda o alvo (adicionar x editar um item), então
  // não é preciso sincronizar com useEffect.
  const [tipoSelecionado, setTipoSelecionado] = useState(
    itemEditando ? itemEditando.tipo : null
  );
  const [form, setForm] = useState(
    itemEditando ? formDoItem(itemEditando) : formInicial
  );

  if (!aberto) return null;

  function fecharResetando() {
    setTipoSelecionado(null);
    setForm(formInicial);
    onFechar();
  }

  function atualizar(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  function converterValor(texto) {
    if (texto === "" || texto == null) return undefined;
    const limpo = String(texto)
      .replace(/[^\d,.-]/g, "")
      .replace(/\./g, "")
      .replace(",", ".");
    const n = parseFloat(limpo);
    return Number.isFinite(n) ? n : undefined;
  }

  function montarItem() {
    const base = { tipo: tipoSelecionado };
    // preserva id ao editar
    if (editando) base.id = itemEditando.id;

    if (tipoSelecionado === "cartao") {
      const digitos = form.ultimosDigitos.replace(/\D/g, "").slice(0, 4);
      const limite = converterValor(form.limite);
      return {
        ...base,
        apelido: form.apelido.trim() || "Cartão",
        subtipo: form.subtipo,
        ...(form.bandeira ? { bandeira: form.bandeira } : {}),
        ...(form.titular.trim() ? { titular: form.titular.trim() } : {}),
        ...(form.validade.trim() ? { validade: form.validade.trim() } : {}),
        ...(digitos ? { ultimosDigitos: digitos } : {}),
        ...(form.subtipo === "credito" && limite != null ? { limite } : {}),
        ...(form.contaId ? { contaId: form.contaId } : {}),
        // preserva fatura já existente ao editar
        ...(editando && itemEditando.faturaAtual != null
          ? { faturaAtual: itemEditando.faturaAtual }
          : {}),
        tema: itemEditando?.tema || "roxo",
      };
    }

    if (tipoSelecionado === "conta") {
      return {
        ...base,
        apelido: form.apelido.trim() || "Conta",
        ...(form.instituicao.trim() ? { instituicao: form.instituicao.trim() } : {}),
        saldo: converterValor(form.saldo) ?? 0,
      };
    }

    if (tipoSelecionado === "dinheiro") {
      return {
        ...base,
        apelido: form.apelido.trim() || "Dinheiro",
        saldo: converterValor(form.valor) ?? 0,
      };
    }

    // reserva
    return {
      ...base,
      apelido: form.apelido.trim() || "Reserva",
      valorReservado: converterValor(form.valor) ?? 0,
      ...(converterValor(form.objetivo) != null
        ? { objetivo: converterValor(form.objetivo) }
        : {}),
      ...(form.contaId ? { contaId: form.contaId } : {}),
    };
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (onSalvar) onSalvar(montarItem());
    fecharResetando();
  }

  const tituloModal = editando
    ? "Editar item"
    : tipoSelecionado
    ? "Dados básicos"
    : "O que você quer adicionar?";

  return (
    <div className={styles.overlay} onClick={fecharResetando}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label={editando ? "Editar item da carteira" : "Adicionar à carteira"}
        onClick={(e) => e.stopPropagation()}
      >
        <header className={styles.cabecalho}>
          <h2>{tituloModal}</h2>
          <button
            className={styles.botaoFechar}
            type="button"
            onClick={fecharResetando}
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </header>

        {/* Etapa 1: escolher o tipo (somente ao adicionar) */}
        {!tipoSelecionado && !editando && (
          <div className={styles.grade}>
            {tiposDisponiveis.map((opcao) => {
              const Icone = opcao.icone;
              return (
                <button
                  key={opcao.tipo}
                  type="button"
                  className={styles.opcao}
                  onClick={() => setTipoSelecionado(opcao.tipo)}
                >
                  <span className={styles.opcaoIcone}>
                    <Icone size={22} />
                  </span>
                  <strong>{opcao.nome}</strong>
                  <span className={styles.opcaoDescricao}>{opcao.descricao}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Etapa 2: campos básicos por tipo */}
        {tipoSelecionado && (
          <form className={styles.form} onSubmit={handleSubmit}>
            <CamposPorTipo
              tipo={tipoSelecionado}
              form={form}
              atualizar={atualizar}
              contas={contas}
            />

            <div className={styles.formAcoes}>
              {!editando && (
                <button
                  type="button"
                  className={styles.btnVoltar}
                  onClick={() => setTipoSelecionado(null)}
                >
                  Voltar
                </button>
              )}
              <button type="submit" className={styles.btnSalvar}>
                Salvar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function CamposPorTipo({ tipo, form, atualizar, contas }) {
  const temContas = contas.length > 0;

  return (
    <>
      <div className={styles.campo}>
        <label htmlFor="apelido">Apelido</label>
        <input
          id="apelido"
          type="text"
          placeholder="Ex: Nubank, Carteira, Reserva..."
          value={form.apelido}
          onChange={(e) => atualizar("apelido", e.target.value)}
        />
      </div>

      {tipo === "cartao" && (
        <>
          <div className={styles.campo}>
            <label htmlFor="subtipo">Tipo do cartão</label>
            <select
              id="subtipo"
              value={form.subtipo}
              onChange={(e) => atualizar("subtipo", e.target.value)}
            >
              <option value="credito">Crédito</option>
              <option value="debito">Débito</option>
            </select>
          </div>

          <div className={styles.campo}>
            <label htmlFor="titular">Nome do titular (opcional)</label>
            <input
              id="titular"
              type="text"
              placeholder="Como está impresso no cartão"
              value={form.titular}
              onChange={(e) => atualizar("titular", e.target.value)}
            />
          </div>

          <div className={styles.campo}>
            <label htmlFor="bandeira">Bandeira</label>
            <select
              id="bandeira"
              value={form.bandeira}
              onChange={(e) => atualizar("bandeira", e.target.value)}
            >
              <option value="" disabled>
                Selecione
              </option>
              <option value="visa">Visa</option>
              <option value="mastercard">Mastercard</option>
              <option value="elo">Elo</option>
              <option value="outra">Outra</option>
            </select>
          </div>

          <div className={styles.campo}>
            <label htmlFor="validade">Validade (MM/AA, opcional)</label>
            <input
              id="validade"
              type="text"
              inputMode="numeric"
              maxLength={5}
              placeholder="MM/AA"
              value={form.validade}
              onChange={(e) => atualizar("validade", e.target.value)}
            />
          </div>

          <div className={styles.campo}>
            <label htmlFor="digitos">4 últimos dígitos (opcional)</label>
            <input
              id="digitos"
              type="text"
              inputMode="numeric"
              maxLength={4}
              placeholder="0000"
              value={form.ultimosDigitos}
              onChange={(e) => atualizar("ultimosDigitos", e.target.value)}
            />
          </div>

          {/* Limite: apenas para crédito */}
          {form.subtipo === "credito" && (
            <div className={styles.campo}>
              <label htmlFor="limite">Limite (opcional)</label>
              <input
                id="limite"
                type="text"
                inputMode="decimal"
                placeholder="R$ 0,00"
                value={form.limite}
                onChange={(e) => atualizar("limite", e.target.value)}
              />
            </div>
          )}

          {/* Conta associada (crédito e débito) */}
          <div className={styles.campo}>
            <label htmlFor="contaCartao">Conta associada (opcional)</label>
            <select
              id="contaCartao"
              value={form.contaId}
              onChange={(e) => atualizar("contaId", e.target.value)}
              disabled={!temContas}
            >
              <option value="">
                {temContas ? "Nenhuma" : "Cadastre uma conta primeiro"}
              </option>
              {contas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.apelido}
                </option>
              ))}
            </select>
          </div>

          <p className={styles.aviso}>
            Não pedimos o número completo, o CVV nem a senha do cartão.
          </p>
        </>
      )}

      {tipo === "conta" && (
        <>
          <div className={styles.campo}>
            <label htmlFor="instituicao">Instituição</label>
            <input
              id="instituicao"
              type="text"
              placeholder="Ex: Banco Inter"
              value={form.instituicao}
              onChange={(e) => atualizar("instituicao", e.target.value)}
            />
          </div>
          <div className={styles.campo}>
            <label htmlFor="saldo">Saldo inicial</label>
            <input
              id="saldo"
              type="text"
              inputMode="decimal"
              placeholder="R$ 0,00"
              value={form.saldo}
              onChange={(e) => atualizar("saldo", e.target.value)}
            />
          </div>
        </>
      )}

      {tipo === "dinheiro" && (
        <div className={styles.campo}>
          <label htmlFor="valor">Valor em espécie</label>
          <input
            id="valor"
            type="text"
            inputMode="decimal"
            placeholder="R$ 0,00"
            value={form.valor}
            onChange={(e) => atualizar("valor", e.target.value)}
          />
        </div>
      )}

      {tipo === "reserva" && (
        <>
          <div className={styles.campo}>
            <label htmlFor="valor">Valor reservado</label>
            <input
              id="valor"
              type="text"
              inputMode="decimal"
              placeholder="R$ 0,00"
              value={form.valor}
              onChange={(e) => atualizar("valor", e.target.value)}
            />
          </div>
          <div className={styles.campo}>
            <label htmlFor="objetivo">Objetivo (opcional)</label>
            <input
              id="objetivo"
              type="text"
              inputMode="decimal"
              placeholder="R$ 0,00"
              value={form.objetivo}
              onChange={(e) => atualizar("objetivo", e.target.value)}
            />
          </div>
          {/* Conta onde o dinheiro está guardado */}
          <div className={styles.campo}>
            <label htmlFor="contaReserva">Guardado em (opcional)</label>
            <select
              id="contaReserva"
              value={form.contaId}
              onChange={(e) => atualizar("contaId", e.target.value)}
              disabled={!temContas}
            >
              <option value="">
                {temContas ? "Nenhuma" : "Cadastre uma conta primeiro"}
              </option>
              {contas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.apelido}
                </option>
              ))}
            </select>
          </div>
        </>
      )}
    </>
  );
}

export default ModalAdicionar;
