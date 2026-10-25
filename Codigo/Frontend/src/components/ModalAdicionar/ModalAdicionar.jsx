import { useState } from "react";
import { X, CreditCard, Landmark, Wallet, PiggyBank } from "lucide-react";
import { BANCOS, bancoDe } from "../../data/bancos";
import styles from "./ModalAdicionar.module.css";

// Opções do seletor de banco, ordenadas pelo nome (A-Z).
const OPCOES_BANCO = Object.keys(BANCOS)
  .map((chave) => ({ chave, nome: bancoDe(chave).nome }))
  .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

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
  banco: "",
  bandeira: "",
  titular: "",
  validade: "",
  ultimosDigitos: "",
  limite: "",
  contaId: "",
  // conta
  instituicao: "",
  saldo: "",
  posicao: "",
  // dinheiro / reserva
  valor: "",
  objetivo: "",
};

/** Número -> string editável no input (sem forçar formato de moeda). */
function numParaTexto(n) {
  return n == null ? "" : String(n);
}

// Posições de destaque das contas (ordem fixa).
const POSICOES_CONTA = ["principal", "secundaria", "terciaria"];

/** Primeira posição de destaque ainda livre; "" (não destacar) se as 3 ocupadas. */
function primeiraPosicaoLivre(contas) {
  const usadas = new Set(contas.map((c) => c.posicao).filter(Boolean));
  return POSICOES_CONTA.find((p) => !usadas.has(p)) ?? "";
}

/**
 * Máscara de validade MM/AA.
 * - insere "/" automaticamente após os 2 primeiros dígitos
 * - aceita 4 dígitos colados
 * - permite apagar (não força a barra ao voltar para 2 dígitos ou menos)
 * - limita o mês a 01–12 assim que o 2º dígito é digitado
 */
function formatarValidade(texto) {
  const d = String(texto).replace(/\D/g, "").slice(0, 4);
  if (d.length === 0) return "";

  let mes = d.slice(0, 2);

  // corrige mês inválido quando já há 2 dígitos
  if (mes.length === 2) {
    if (mes === "00") mes = "01";
    else if (Number(mes) > 12) mes = "12";
  }

  if (d.length <= 2) return mes;
  return `${mes}/${d.slice(2)}`;
}

/** Monta o estado do formulário a partir de um item existente. */
function formDoItem(item) {
  if (!item) return formInicial;
  return {
    ...formInicial,
    apelido: item.apelido || "",
    subtipo: item.subtipo || "credito",
    banco: item.banco || "",
    bandeira: item.bandeira || "",
    titular: item.titular || "",
    validade: item.validade || "",
    ultimosDigitos: item.ultimosDigitos || "",
    limite: numParaTexto(item.limite),
    contaId: item.contaId || "",
    instituicao: item.instituicao || "",
    saldo: numParaTexto(item.saldo),
    posicao: item.posicao || "",
    valor: numParaTexto(item.valorReservado ?? (item.tipo === "dinheiro" ? item.saldo : undefined)),
    objetivo: numParaTexto(item.objetivo),
  };
}

function ModalAdicionar({ aberto, onFechar, onSalvar, contas = [], itemEditando = null, tipoInicial = null }) {
  const editando = Boolean(itemEditando);
  // Estado inicializado a partir das props. O componente é remontado via
  // `key` no pai sempre que muda o alvo (adicionar x editar um item), então
  // não é preciso sincronizar com useEffect.
  const [tipoSelecionado, setTipoSelecionado] = useState(
    itemEditando ? itemEditando.tipo : tipoInicial
  );
  const [erros, setErros] = useState({});
  const [form, setForm] = useState(() => {
    if (itemEditando) return formDoItem(itemEditando);
    // Nova conta: já sugere a primeira posição de destaque livre.
    if ((tipoInicial ?? null) === "conta") {
      return { ...formInicial, posicao: primeiraPosicaoLivre(contas) };
    }
    return formInicial;
  });

  if (!aberto) return null;

  function fecharResetando() {
    setTipoSelecionado(null);
    setForm(formInicial);
    onFechar();
  }

  function atualizar(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }));
    // limpa a mensagem de erro do campo ao editá-lo
    setErros((e) => (e[campo] ? { ...e, [campo]: undefined } : e));
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
        ...(form.banco ? { banco: form.banco } : {}),
        ...(form.bandeira ? { bandeira: form.bandeira } : {}),
        ...(form.titular.trim() ? { titular: form.titular.trim() } : {}),
        ...(form.validade.trim() ? { validade: form.validade.trim() } : {}),
        ...(digitos ? { ultimosDigitos: digitos } : {}),
        ...(form.subtipo === "credito" && limite != null ? { limite } : {}),
        ...(form.contaId ? { contaId: form.contaId } : {}),
        ...(editando && itemEditando.faturaAtual != null
          ? { faturaAtual: itemEditando.faturaAtual }
          : {}),
        tema: itemEditando?.tema || "roxo",
      };
    }

    if (tipoSelecionado === "conta") {
      // instituicao fica com o nome do banco (compatibilidade com cards antigos)
      const instituicao =
        form.banco && form.banco !== "outro"
          ? bancoDe(form.banco).nome
          : form.instituicao.trim();
      return {
        ...base,
        apelido: form.apelido.trim() || "Conta",
        ...(form.banco ? { banco: form.banco } : {}),
        ...(instituicao ? { instituicao } : {}),
        saldo: converterValor(form.saldo) ?? 0,
        posicao: form.posicao || null,
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

  // Valida os campos obrigatórios do cartão. Retorna um mapa campo->mensagem.
  function validarCartao() {
    const e = {};
    if (!form.apelido.trim()) e.apelido = "Informe um apelido.";
    if (!form.subtipo) e.subtipo = "Escolha o tipo do cartão.";
    if (!form.banco) e.banco = "Selecione o banco.";
    if (!form.bandeira) e.bandeira = "Selecione a bandeira.";
    if (!/^\d{4}$/.test(form.ultimosDigitos))
      e.ultimosDigitos = "Informe os 4 últimos dígitos.";
    return e;
  }

  // Obrigatórios da conta: apelido e banco.
  function validarConta() {
    const e = {};
    if (!form.apelido.trim()) e.apelido = "Informe um apelido.";
    if (!form.banco) e.banco = "Selecione o banco.";
    return e;
  }

  function handleSubmit(e) {
    e.preventDefault();

    if (tipoSelecionado === "cartao" || tipoSelecionado === "conta") {
      const novosErros =
        tipoSelecionado === "cartao" ? validarCartao() : validarConta();
      setErros(novosErros);
      if (Object.keys(novosErros).length > 0) return; // bloqueia o envio
    }

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
                  onClick={() => {
                    if (opcao.tipo === "conta") {
                      setForm((f) => ({
                        ...f,
                        posicao: primeiraPosicaoLivre(contas),
                      }));
                    }
                    setTipoSelecionado(opcao.tipo);
                  }}
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
              erros={erros}
            />

            <div className={styles.formAcoes}>
              {!editando && !tipoInicial && (
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

function CamposPorTipo({ tipo, form, atualizar, contas, erros = {} }) {
  const temContas = contas.length > 0;
  // classe do campo (adiciona borda vermelha quando há erro)
  const cls = (campo) =>
    `${styles.campo} ${erros[campo] ? styles.campoErro : ""}`;

  return (
    <>
      <div className={cls("apelido")}>
        <label htmlFor="apelido">Apelido</label>
        <input
          id="apelido"
          type="text"
          placeholder="Ex: Nubank, Carteira, Reserva..."
          value={form.apelido}
          onChange={(e) => atualizar("apelido", e.target.value)}
        />
        {erros.apelido && (
          <span className={styles.mensagemErro}>{erros.apelido}</span>
        )}
      </div>

      {tipo === "cartao" && (
        <>
          <div className={cls("subtipo")}>
            <label htmlFor="subtipo">Tipo do cartão</label>
            <select
              id="subtipo"
              value={form.subtipo}
              onChange={(e) => atualizar("subtipo", e.target.value)}
            >
              <option value="credito">Crédito</option>
              <option value="debito">Débito</option>
            </select>
            {erros.subtipo && (
              <span className={styles.mensagemErro}>{erros.subtipo}</span>
            )}
          </div>

          <div className={cls("banco")}>
            <label htmlFor="banco">Banco</label>
            <select
              id="banco"
              value={form.banco}
              onChange={(e) => atualizar("banco", e.target.value)}
            >
              <option value="" disabled>
                Selecione
              </option>
              {OPCOES_BANCO.map((b) => (
                <option key={b.chave} value={b.chave}>
                  {b.nome}
                </option>
              ))}
              <option value="outro">Outro banco</option>
            </select>
            {erros.banco && (
              <span className={styles.mensagemErro}>{erros.banco}</span>
            )}
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

          <div className={cls("bandeira")}>
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
            {erros.bandeira && (
              <span className={styles.mensagemErro}>{erros.bandeira}</span>
            )}
          </div>

          <div className={cls("ultimosDigitos")}>
            <label htmlFor="digitos">4 últimos dígitos</label>
            <input
              id="digitos"
              type="text"
              inputMode="numeric"
              maxLength={4}
              placeholder="0000"
              value={form.ultimosDigitos}
              onChange={(e) =>
                atualizar(
                  "ultimosDigitos",
                  e.target.value.replace(/\D/g, "").slice(0, 4)
                )
              }
            />
            {erros.ultimosDigitos && (
              <span className={styles.mensagemErro}>
                {erros.ultimosDigitos}
              </span>
            )}
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
          <div className={cls("banco")}>
            <label htmlFor="bancoConta">Banco</label>
            <select
              id="bancoConta"
              value={form.banco}
              onChange={(e) => atualizar("banco", e.target.value)}
            >
              <option value="" disabled>
                Selecione
              </option>
              {OPCOES_BANCO.map((b) => (
                <option key={b.chave} value={b.chave}>
                  {b.nome}
                </option>
              ))}
              <option value="outro">Outro banco</option>
            </select>
            {erros.banco && (
              <span className={styles.mensagemErro}>{erros.banco}</span>
            )}
          </div>
          <div className={styles.campo}>
            <label htmlFor="posicao">Posição na carteira (opcional)</label>
            <select
              id="posicao"
              value={form.posicao}
              onChange={(e) => atualizar("posicao", e.target.value)}
            >
              <option value="principal">Principal</option>
              <option value="secundaria">Secundária</option>
              <option value="terciaria">Terciária</option>
              <option value="">Não destacar</option>
            </select>
          </div>
          <div className={styles.campo}>
            <label htmlFor="saldo">Saldo inicial (opcional)</label>
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
