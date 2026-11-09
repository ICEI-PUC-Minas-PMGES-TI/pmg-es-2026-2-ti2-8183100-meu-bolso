import { useState } from "react";

import {
  converterValor,
  hojeISO,
  mesAtualChave,
  valorParaTexto,
} from "../../utils/Receitasutils";
import { CATEGORIAS, TAMANHO_MAX_COMENTARIO } from "../../pages/Receitas/Constantes";
import Modal from "./Modal";
import styles from "../../pages/Receitas/Receitas.module.css";

const FORM_INICIAL = {
  descricao: "",
  categoria: "",
  carteira: "",
  carteiraId: "",
  valor: "",
  data: "",
  comentario: "",
  recorrente: false,
};

// Hoje, se estiver no mês corrente; senão o dia 1 do mês que está na tela
function dataInicial(mesSelecionado) {
  return mesSelecionado === mesAtualChave() ? hojeISO() : `${mesSelecionado}-01`;
}

/**
 * Serve para adicionar (sem a prop "receita") e para editar (com "receita").
 * onSalvar recebe os dados prontos e devolve uma Promise; se ela falhar,
 * a mensagem de erro aparece aqui dentro do modal.
 */
export default function ModalReceita({ receita, mesSelecionado, carteiras = [], onFechar, onSalvar }) {
  const editando = Boolean(receita);

  const [form, setForm] = useState(() =>
    editando
      ? {
          descricao: receita.descricao,
          categoria: receita.categoria,
          carteira: receita.carteira,
          carteiraId: receita.carteiraId ?? "",
          valor: valorParaTexto(receita.valor),
          data: receita.data,
          comentario: receita.comentario ?? "",
          recorrente: false,
        }
      : { ...FORM_INICIAL, data: dataInicial(mesSelecionado) },
  );
  const [erros, setErros] = useState({});
  const [erroEnvio, setErroEnvio] = useState("");
  const [salvando, setSalvando] = useState(false);

  // Se a receita tiver uma categoria fora da lista, ela continua selecionável
  const categorias =
    !form.categoria || CATEGORIAS.includes(form.categoria)
      ? CATEGORIAS
      : [...CATEGORIAS, form.categoria];

  // Formas de recebimento disponíveis. Item editado sem carteiraId mas com
  // nome legado ganha uma opção extra para não perder o valor atual.
  const semCarteiras = carteiras.length === 0;
  const opcoesCarteira =
    !form.carteiraId && form.carteira
      ? [{ id: "", nome: form.carteira }, ...carteiras]
      : carteiras;

  const jaEhRecorrente = editando && Boolean(receita.recorrenciaId);
  const diaDaRecorrencia = form.data ? Number(form.data.slice(8, 10)) : null;

  function alterarCampo(event) {
    const { name, value, type, checked } = event.target;

    setForm((atual) => ({ ...atual, [name]: type === "checkbox" ? checked : value }));
    setErros((atual) => ({ ...atual, [name]: undefined }));
  }

  function validar() {
    const novosErros = {};

    if (!form.descricao.trim()) novosErros.descricao = "Informe a descrição.";
    if (!form.categoria) novosErros.categoria = "Selecione a categoria.";
    if (!form.carteiraId) novosErros.carteira = "Selecione a carteira.";
    if (!form.data) novosErros.data = "Informe a data.";

    const valorNumerico = converterValor(form.valor);

    if (!form.valor.trim()) {
      novosErros.valor = "Informe o valor.";
    } else if (!Number.isFinite(valorNumerico) || valorNumerico <= 0) {
      novosErros.valor = "Informe um valor maior que zero.";
    }

    return novosErros;
  }

  async function enviar(event) {
    event.preventDefault();

    const novosErros = validar();
    setErros(novosErros);
    if (Object.keys(novosErros).length > 0) return;

    setSalvando(true);
    setErroEnvio("");

    try {
      await onSalvar({
        descricao: form.descricao.trim(),
        categoria: form.categoria,
        carteira: form.carteira,
        carteiraId: form.carteiraId,
        data: form.data,
        valor: converterValor(form.valor),
        comentario: form.comentario.trim(),
        recorrente: form.recorrente,
      });
    } catch (erro) {
      setErroEnvio(erro.message || "Não foi possível salvar a receita.");
      setSalvando(false);
    }
  }

  return (
    <Modal titulo={editando ? "Editar receita" : "Adicionar receita"} onFechar={onFechar}>
      <form className={styles["receitas-form"]} onSubmit={enviar} noValidate>
        <div className={`form-group ${styles["receitas-form-campo-largo"]}`}>
          <label className="form-label" htmlFor="receita-descricao">
            Descrição
          </label>
          <input
            id="receita-descricao"
            name="descricao"
            className="form-input"
            placeholder="Ex.: Salário do mês"
            value={form.descricao}
            onChange={alterarCampo}
            autoFocus
          />
          {erros.descricao && (
            <span className={styles["receitas-erro-campo"]}>{erros.descricao}</span>
          )}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="receita-categoria">
            Categoria
          </label>
          <select
            id="receita-categoria"
            name="categoria"
            className="form-input"
            value={form.categoria}
            onChange={alterarCampo}
          >
            <option value="">Selecione</option>
            {categorias.map((categoria) => (
              <option key={categoria} value={categoria}>
                {categoria}
              </option>
            ))}
          </select>
          {erros.categoria && (
            <span className={styles["receitas-erro-campo"]}>{erros.categoria}</span>
          )}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="receita-carteira">
            Carteira
          </label>
          <select
            id="receita-carteira"
            name="carteiraId"
            className="form-input"
            value={form.carteiraId}
            onChange={(event) => {
              const id = event.target.value;
              const opcao = opcoesCarteira.find((c) => c.id === id);
              setForm((atual) => ({
                ...atual,
                carteiraId: id,
                carteira: opcao ? opcao.nome : "",
              }));
              setErros((atual) => ({ ...atual, carteira: undefined }));
            }}
            disabled={semCarteiras}
          >
            <option value="">Selecione</option>
            {opcoesCarteira.map((carteira) => (
              <option key={carteira.id} value={carteira.id}>
                {carteira.nome}
              </option>
            ))}
          </select>
          {semCarteiras && (
            <span className={styles["receitas-erro-campo"]}>
              Cadastre uma conta na Carteira antes de registrar receitas.
            </span>
          )}
          {erros.carteira && (
            <span className={styles["receitas-erro-campo"]}>{erros.carteira}</span>
          )}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="receita-valor">
            Valor (R$)
          </label>
          <input
            id="receita-valor"
            name="valor"
            className="form-input"
            inputMode="decimal"
            placeholder="0,00"
            value={form.valor}
            onChange={alterarCampo}
          />
          {erros.valor && (
            <span className={styles["receitas-erro-campo"]}>{erros.valor}</span>
          )}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="receita-data">
            Data
          </label>
          <input
            id="receita-data"
            name="data"
            type="date"
            className="form-input"
            value={form.data}
            onChange={alterarCampo}
          />
          {erros.data && (
            <span className={styles["receitas-erro-campo"]}>{erros.data}</span>
          )}
        </div>

        <div className={`form-group ${styles["receitas-form-campo-largo"]}`}>
          <label className="form-label" htmlFor="receita-comentario">
            Comentário <span className="texto-secundario">(opcional)</span>
          </label>
          <textarea
            id="receita-comentario"
            name="comentario"
            className={`form-input ${styles["receitas-textarea"]}`}
            rows={3}
            maxLength={TAMANHO_MAX_COMENTARIO}
            placeholder="Ex.: adiantamento do 13º"
            value={form.comentario}
            onChange={alterarCampo}
          />
          <span className={styles["receitas-contador"]}>
            {form.comentario.length}/{TAMANHO_MAX_COMENTARIO}
          </span>
        </div>

        <div className={styles["receitas-form-campo-largo"]}>
          {jaEhRecorrente ? (
            <p className={`mensagem mensagem-info ${styles["receitas-nota"]}`}>
              Esta receita faz parte de uma recorrência. Alterá-la aqui não muda os próximos
              lançamentos; para isso use “Recorrentes”.
            </p>
          ) : (
            <label className={styles["receitas-check"]}>
              <input
                type="checkbox"
                name="recorrente"
                checked={form.recorrente}
                onChange={alterarCampo}
              />
              <span>
                <strong>Repetir todo mês</strong>
                <small>
                  {diaDaRecorrencia
                    ? `Lança automaticamente esta receita todo dia ${diaDaRecorrencia}. `
                    : "Lança automaticamente esta receita todo mês. "}
                  Você pode pausar ou editar em “Recorrentes”.
                </small>
              </span>
            </label>
          )}
        </div>

        {erroEnvio && (
          <p
            className={`mensagem mensagem-erro ${styles["receitas-form-campo-largo"]}`}
            role="alert"
          >
            {erroEnvio}
          </p>
        )}

        <div
          className={`${styles["receitas-form-acoes"]} ${styles["receitas-form-campo-largo"]}`}
        >
          <button type="button" className="btn btn-secundario" onClick={onFechar}>
            Cancelar
          </button>

          <button type="submit" className="btn btn-primario" disabled={salvando || semCarteiras}>
            {salvando ? "Salvando..." : editando ? "Salvar alterações" : "Adicionar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
