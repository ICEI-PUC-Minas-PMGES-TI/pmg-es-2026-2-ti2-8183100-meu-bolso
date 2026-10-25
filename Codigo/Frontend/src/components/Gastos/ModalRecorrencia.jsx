    import { useState } from "react";
    import { Pencil, Repeat, Trash2 } from "lucide-react";

    import {
    converterValor,
    dataDaOcorrencia,
    formatarData,
    formatarMoeda,
    mudarMes,
    valorParaTexto,
    } from "../../utils/Gastosutils";
    import { CATEGORIAS, CARTEIRAS, TAMANHO_MAX_COMENTARIO } from "../../pages/Gastos/Constantes";
    import IconeCategoria from "./IconeCategoria";
    import Modal from "./Modal";
    import styles from "../../pages/Gastos/Gastos.module.css";

    // ---------- Formulário de edição de uma recorrência ----------

    function FormRecorrencia({ recorrencia, onCancelar, onSalvar }) {
    const [form, setForm] = useState({
        descricao: recorrencia.descricao,
        categoria: recorrencia.categoria,
        carteira: recorrencia.carteira,
        valor: valorParaTexto(recorrencia.valor),
        diaDoMes: String(recorrencia.diaDoMes),
        comentario: recorrencia.comentario ?? "",
    });
    const [erros, setErros] = useState({});
    const [erroEnvio, setErroEnvio] = useState("");
    const [salvando, setSalvando] = useState(false);

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
        <form className={styles["gastos-form"]} onSubmit={enviar} noValidate>
        <p className={`texto-secundario texto-pequeno ${styles["gastos-form-campo-largo"]}`}>
            As mudanças valem para os próximos lançamentos. Os gastos já lançados não são
            alterados.
        </p>

        <div className={`form-group ${styles["gastos-form-campo-largo"]}`}>
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
            <span className={styles["gastos-erro-campo"]}>{erros.descricao}</span>
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
            name="carteira"
            className="form-input"
            value={form.carteira}
            onChange={alterarCampo}
            >
            {(CARTEIRAS.includes(form.carteira)
                ? CARTEIRAS
                : [...CARTEIRAS, form.carteira]
            ).map((carteira) => (
                <option key={carteira} value={carteira}>
                {carteira}
                </option>
            ))}
            </select>
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
            {erros.valor && <span className={styles["gastos-erro-campo"]}>{erros.valor}</span>}
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
            <span className={styles["gastos-erro-campo"]}>{erros.diaDoMes}</span>
            )}
        </div>

        <div className={`form-group ${styles["gastos-form-campo-largo"]}`}>
            <label className="form-label" htmlFor="rec-comentario">
            Comentário <span className="texto-secundario">(opcional)</span>
            </label>
            <textarea
            id="rec-comentario"
            name="comentario"
            className={`form-input ${styles["gastos-textarea"]}`}
            rows={2}
            maxLength={TAMANHO_MAX_COMENTARIO}
            value={form.comentario}
            onChange={alterarCampo}
            />
        </div>

        {erroEnvio && (
            <p
            className={`mensagem mensagem-erro ${styles["gastos-form-campo-largo"]}`}
            role="alert"
            >
            {erroEnvio}
            </p>
        )}

        <div className={`${styles["gastos-form-acoes"]} ${styles["gastos-form-campo-largo"]}`}>
            <button type="button" className="btn btn-secundario" onClick={onCancelar}>
            Voltar
            </button>
            <button type="submit" className="btn btn-primario" disabled={salvando}>
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
            `Excluir a recorrência "${rec.descricao}"? Os gastos já lançados continuam na lista.`,
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
        <Modal titulo="Gastos recorrentes" onFechar={onFechar} largura={640}>
        <p className={`texto-secundario texto-pequeno ${styles["gastos-recorrencias-intro"]}`}>
            Lançados automaticamente todo mês. Ao pausar, nenhum novo gasto é criado; os já
            lançados continuam na lista.
        </p>

        {erro && (
            <p className="mensagem mensagem-erro" role="alert">
            {erro}
            </p>
        )}

        {ordenadas.length === 0 ? (
            <div className={styles["gastos-painel-vazio"]}>
            <Repeat size={28} aria-hidden="true" />
            <p>
                Nenhum gasto recorrente ainda. Ao adicionar um gasto, marque “Repetir todo
                mês”.
            </p>
            </div>
        ) : (
            <ul className={styles["gastos-recorrencias-lista"]}>
            {ordenadas.map((rec) => {
                const proximo = proximoLancamento(rec);

                return (
                <li
                    key={rec.id}
                    className={`${styles["gastos-recorrencia"]} ${
                    rec.ativa ? "" : styles["gastos-recorrencia-pausada"]
                    }`}
                >
                    <span className={styles["gastos-distribuicao-icone"]}>
                    <IconeCategoria categoria={rec.categoria} />
                    </span>

                    <div className={styles["gastos-recorrencia-info"]}>
                    <strong>{rec.descricao}</strong>
                    <span>
                        {formatarMoeda(rec.valor)} · todo dia {rec.diaDoMes} · {rec.carteira}
                    </span>
                    <span className={styles["gastos-recorrencia-proximo"]}>
                        {rec.ativa
                        ? proximo
                            ? `Próximo lançamento: ${formatarData(proximo)}`
                            : "Ativa"
                        : "Pausada"}
                    </span>
                    </div>

                    <div className={styles["gastos-recorrencia-acoes"]}>
                    <button
                        type="button"
                        role="switch"
                        aria-checked={rec.ativa}
                        aria-label={`Recorrência ${rec.descricao}: ${
                        rec.ativa ? "ativa" : "pausada"
                        }`}
                        title={rec.ativa ? "Pausar" : "Reativar"}
                        className={styles["gastos-switch"]}
                        disabled={ocupadoId === rec.id}
                        onClick={() =>
                        executar(rec.id, () => onAtualizar(rec.id, { ativa: !rec.ativa }))
                        }
                    >
                        <span className={styles["gastos-switch-bolinha"]} />
                    </button>

                    <button
                        type="button"
                        className={styles["gastos-botao-icone"]}
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
                        className={`${styles["gastos-botao-icone"]} ${styles["gastos-botao-excluir"]}`}
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