import { useState } from "react";
import { Pencil, Repeat, Trash2 } from "lucide-react";

import {
  converterValor,
  dataDaOcorrencia,
  formatarData,
  formatarMoeda,
  mudarMes,
  valorParaTexto,
} from "../../utils/Receitasutils";
import { CATEGORIAS, TAMANHO_MAX_COMENTARIO } from "../../pages/Receitas/Constantes";
import IconeCategoria from "./IconeCategoria";
import Modal from "./Modal";
import styles from "../../pages/Receitas/Receitas.module.css";

// ---------- Formulário de edição de uma recorrência ----------

function FormRecorrencia({ recorrencia, carteiras = [], onCancelar, onSalvar }) {
  const [form, setForm] = useState({
    descricao: recorrencia.descricao,
    categoria: recorrencia.categoria,
    carteira: recorrencia.carteira,
    carteiraId: recorrencia.carteiraId ?? "",
    valor: valorParaTexto(recorrencia.valor),
    diaDoMes: String(recorrencia.diaDoMes),
    comentario: recorrencia.comentario ?? "",
  });
  const [erros, setErros] = useState({});
  const [erroEnvio, setErroEnvio] = useState("");
  const [salvando, setSalvando] = useState(false);

  const semCarteiras = carteiras.length === 0;
  const opcoesCarteira =
    !form.carteiraId && form.carteira
      ? [{ id: "", nome: form.carteira }, ...carteiras]
      : carteiras;

  function alterarCampo(event) {
    const { name, value } = event.target;
    setForm((atual) => ({ ...atual, [name]: value }));
    setErros((atual) => ({ ...atual, [name]: undefined }));
  }

  async function enviar(event) {
    event.preventDefault();

    const novosErros = {};
    const valor = converterValor(form.valor);
    const dia = Number(form.diaDoMes);

    if (!form.descricao.trim()) novosErros.descricao = "Informe a descrição.";
    if (!form.carteiraId) novosErros.carteira = "Selecione a carteira.";
    if (!form.valor.trim() || !Number.isFinite(valor) || valor <= 0) {
      novosErros.valor = "Informe um valor maior que zero.";
    }
    if (!Number.isInteger(dia) || dia < 1 || dia > 31) {
      novosErros.diaDoMes = "Use um dia de 1 a 31.";
    }

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
        valor,
        diaDoMes: dia,
        comentario: form.comentario.trim(),
      });
    } catch (erro) {
      setErroEnvio(erro.message || "Não foi possível salvar a recorrência.");
      setSalvando(false);
    }
  }

  return (
    <form className={styles["receitas-form"]} onSubmit={enviar} noValidate>
      <p className={`texto-secundario texto-pequeno ${styles["receitas-form-campo-largo"]}`}>
        As mudanças valem para os próximos lançamentos. As receitas já lançadas não são
        alteradas.
      </p>

      <div className={`form-group ${styles["receitas-form-campo-largo"]}`}>
        <label className="form-label" htmlFor="rec-descricao">
          Descrição
        </label>
        <input
          id="rec-descricao"
          name="descricao"
          className="form-input"
          value={form.descricao}
          onChange={alterarCampo}
          autoFocus
        />
        {erros.descricao && (
          <span className={styles["receitas-erro-campo"]}>{erros.descricao}</span>
        )}
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="rec-categoria">
          Categoria
        </label>
        <select
          id="rec-categoria"
          name="categoria"
          className="form-input"
          value={form.categoria}
          onChange={alterarCampo}
        >
          {(CATEGORIAS.includes(form.categoria)
            ? CATEGORIAS
            : [...CATEGORIAS, form.categoria]
          ).map((categoria) => (
            <option key={categoria} value={categoria}>
              {categoria}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="rec-carteira">
          Carteira
        </label>
        <select
          id="rec-carteira"
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
        <label className="form-label" htmlFor="rec-valor">
          Valor (R$)
        </label>
        <input
          id="rec-valor"
          name="valor"
          className="form-input"
          inputMode="decimal"
          value={form.valor}
          onChange={alterarCampo}
        />
        {erros.valor && <span className={styles["receitas-erro-campo"]}>{erros.valor}</span>}
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="rec-dia">
          Dia do mês
        </label>
        <input
          id="rec-dia"
          name="diaDoMes"
          type="number"
          min={1}
          max={31}
          className="form-input"
          value={form.diaDoMes}
          onChange={alterarCampo}
        />
        {erros.diaDoMes && (
          <span className={styles["receitas-erro-campo"]}>{erros.diaDoMes}</span>
        )}
      </div>

      <div className={`form-group ${styles["receitas-form-campo-largo"]}`}>
        <label className="form-label" htmlFor="rec-comentario">
          Comentário <span className="texto-secundario">(opcional)</span>
        </label>
        <textarea
          id="rec-comentario"
          name="comentario"
          className={`form-input ${styles["receitas-textarea"]}`}
          rows={2}
          maxLength={TAMANHO_MAX_COMENTARIO}
          value={form.comentario}
          onChange={alterarCampo}
        />
      </div>

      {erroEnvio && (
        <p
          className={`mensagem mensagem-erro ${styles["receitas-form-campo-largo"]}`}
          role="alert"
        >
          {erroEnvio}
        </p>
      )}

      <div className={`${styles["receitas-form-acoes"]} ${styles["receitas-form-campo-largo"]}`}>
        <button type="button" className="btn btn-secundario" onClick={onCancelar}>
          Voltar
        </button>
        <button type="submit" className="btn btn-primario" disabled={salvando || semCarteiras}>
          {salvando ? "Salvando..." : "Salvar alterações"}
        </button>
      </div>
    </form>
  );
}

// ---------- Lista de recorrências ----------

function proximoLancamento(rec) {
  if (!rec.ativa || !rec.ultimoMes) return null;
  return dataDaOcorrencia(mudarMes(rec.ultimoMes, 1), rec.diaDoMes);
}

export default function ModalRecorrencias({
  recorrencias,
  carteiras = [],
  onAtualizar,
  onExcluir,
  onFechar,
}) {
  const [editandoId, setEditandoId] = useState(null);
  const [erro, setErro] = useState("");
  const [ocupadoId, setOcupadoId] = useState(null);

  // A recorrência em edição vem sempre da lista atual (que o pai mantém atualizada)
  const editando = recorrencias.find((rec) => rec.id === editandoId) ?? null;

  const ordenadas = [...recorrencias].sort(
    (a, b) => Number(b.ativa) - Number(a.ativa) || a.descricao.localeCompare(b.descricao, "pt-BR"),
  );

  async function executar(id, acao) {
    setOcupadoId(id);
    setErro("");

    try {
      await acao();
    } catch (e) {
      setErro(e.message || "Não foi possível concluir a ação.");
    } finally {
      setOcupadoId(null);
    }
  }

  function excluir(rec) {
    if (
      !window.confirm(
        `Excluir a recorrência "${rec.descricao}"? As receitas já lançadas continuam na lista.`,
      )
    ) {
      return;
    }

    executar(rec.id, () => onExcluir(rec.id));
  }

  if (editando) {
    return (
      <Modal titulo="Editar recorrência" onFechar={onFechar}>
        <FormRecorrencia
          recorrencia={editando}
          carteiras={carteiras}
          onCancelar={() => setEditandoId(null)}
          onSalvar={async (dados) => {
            await onAtualizar(editando.id, dados);
            setEditandoId(null);
          }}
        />
      </Modal>
    );
  }

  return (
    <Modal titulo="Receitas recorrentes" onFechar={onFechar} largura={640}>
      <p className={`texto-secundario texto-pequeno ${styles["receitas-recorrencias-intro"]}`}>
        Lançadas automaticamente todo mês. Ao pausar, nenhuma nova receita é criada; as já
        lançadas continuam na lista.
      </p>

      {erro && (
        <p className="mensagem mensagem-erro" role="alert">
          {erro}
        </p>
      )}

      {ordenadas.length === 0 ? (
        <div className={styles["receitas-painel-vazio"]}>
          <Repeat size={28} aria-hidden="true" />
          <p>
            Nenhuma receita recorrente ainda. Ao adicionar uma receita, marque “Repetir todo
            mês”.
          </p>
        </div>
      ) : (
        <ul className={styles["receitas-recorrencias-lista"]}>
          {ordenadas.map((rec) => {
            const proximo = proximoLancamento(rec);

            return (
              <li
                key={rec.id}
                className={`${styles["receitas-recorrencia"]} ${
                  rec.ativa ? "" : styles["receitas-recorrencia-pausada"]
                }`}
              >
                <span className={styles["receitas-distribuicao-icone"]}>
                  <IconeCategoria categoria={rec.categoria} />
                </span>

                <div className={styles["receitas-recorrencia-info"]}>
                  <strong>{rec.descricao}</strong>
                  <span>
                    {formatarMoeda(rec.valor)} · todo dia {rec.diaDoMes} · {rec.carteira}
                  </span>
                  <span className={styles["receitas-recorrencia-proximo"]}>
                    {rec.ativa
                      ? proximo
                        ? `Próximo lançamento: ${formatarData(proximo)}`
                        : "Ativa"
                      : "Pausada"}
                  </span>
                </div>

                <div className={styles["receitas-recorrencia-acoes"]}>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={rec.ativa}
                    aria-label={`Recorrência ${rec.descricao}: ${
                      rec.ativa ? "ativa" : "pausada"
                    }`}
                    title={rec.ativa ? "Pausar" : "Reativar"}
                    className={styles["receitas-switch"]}
                    disabled={ocupadoId === rec.id}
                    onClick={() =>
                      executar(rec.id, () => onAtualizar(rec.id, { ativa: !rec.ativa }))
                    }
                  >
                    <span className={styles["receitas-switch-bolinha"]} />
                  </button>

                  <button
                    type="button"
                    className={styles["receitas-botao-icone"]}
                    onClick={() => {
                      setErro("");
                      setEditandoId(rec.id);
                    }}
                    aria-label={`Editar recorrência ${rec.descricao}`}
                    title="Editar"
                  >
                    <Pencil size={16} aria-hidden="true" />
                  </button>

                  <button
                    type="button"
                    className={`${styles["receitas-botao-icone"]} ${styles["receitas-botao-excluir"]}`}
                    onClick={() => excluir(rec)}
                    disabled={ocupadoId === rec.id}
                    aria-label={`Excluir recorrência ${rec.descricao}`}
                    title="Excluir"
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Modal>
  );
}
