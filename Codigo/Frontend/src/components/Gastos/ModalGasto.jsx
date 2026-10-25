    import { useState } from "react";

    import {
    converterValor,
    hojeISO,
    mesAtualChave,
    valorParaTexto,
    } from "../../utils/Gastosutils";
    import { CATEGORIAS, CARTEIRAS, TAMANHO_MAX_COMENTARIO } from "../../pages/Gastos/Constantes";
    import Modal from "./Modal";
    import styles from "../../pages/Gastos/Gastos.module.css";

    const FORM_INICIAL = {
    descricao: "",
    categoria: "",
    carteira: "",
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
     * Serve para adicionar (sem a prop "gasto") e para editar (com "gasto").
     * onSalvar recebe os dados prontos e devolve uma Promise; se ela falhar,
     * a mensagem de erro aparece aqui dentro do modal.
     */
    export default function ModalGasto({ gasto, mesSelecionado, onFechar, onSalvar }) {
    const editando = Boolean(gasto);

    const [form, setForm] = useState(() =>
        editando
        ? {
            descricao: gasto.descricao,
            categoria: gasto.categoria,
            carteira: gasto.carteira,
            valor: valorParaTexto(gasto.valor),
            data: gasto.data,
            comentario: gasto.comentario ?? "",
            recorrente: false,
            }
        : { ...FORM_INICIAL, data: dataInicial(mesSelecionado) },
    );
    const [erros, setErros] = useState({});
    const [erroEnvio, setErroEnvio] = useState("");
    const [salvando, setSalvando] = useState(false);

    // Se o gasto tiver uma categoria/carteira fora da lista, ela continua selecionável
    const categorias =
        !form.categoria || CATEGORIAS.includes(form.categoria)
        ? CATEGORIAS
        : [...CATEGORIAS, form.categoria];
    const carteiras =
        !form.carteira || CARTEIRAS.includes(form.carteira)
        ? CARTEIRAS
        : [...CARTEIRAS, form.carteira];

    const jaEhRecorrente = editando && Boolean(gasto.recorrenciaId);
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
        if (!form.carteira) novosErros.carteira = "Selecione a carteira.";
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
            data: form.data,
            valor: converterValor(form.valor),
            comentario: form.comentario.trim(),
            recorrente: form.recorrente,
        });
        } catch (erro) {
        setErroEnvio(erro.message || "Não foi possível salvar o gasto.");
        setSalvando(false);
        }
    }

    return (
        <Modal titulo={editando ? "Editar gasto" : "Adicionar gasto"} onFechar={onFechar}>
        <form className={styles["gastos-form"]} onSubmit={enviar} noValidate>
            <div className={`form-group ${styles["gastos-form-campo-largo"]}`}>
            <label className="form-label" htmlFor="gasto-descricao">
                Descrição
            </label>
            <input
                id="gasto-descricao"
                name="descricao"
                className="form-input"
                placeholder="Ex.: Almoço no restaurante"
                value={form.descricao}
                onChange={alterarCampo}
                autoFocus
            />
            {erros.descricao && (
                <span className={styles["gastos-erro-campo"]}>{erros.descricao}</span>
            )}
            </div>

            <div className="form-group">
            <label className="form-label" htmlFor="gasto-categoria">
                Categoria
            </label>
            <select
                id="gasto-categoria"
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
                <span className={styles["gastos-erro-campo"]}>{erros.categoria}</span>
            )}
            </div>

            <div className="form-group">
            <label className="form-label" htmlFor="gasto-carteira">
                Carteira
            </label>
            <select
                id="gasto-carteira"
                name="carteira"
                className="form-input"
                value={form.carteira}
                onChange={alterarCampo}
            >
                <option value="">Selecione</option>
                {carteiras.map((carteira) => (
                <option key={carteira} value={carteira}>
                    {carteira}
                </option>
                ))}
            </select>
            {erros.carteira && (
                <span className={styles["gastos-erro-campo"]}>{erros.carteira}</span>
            )}
            </div>

            <div className="form-group">
            <label className="form-label" htmlFor="gasto-valor">
                Valor (R$)
            </label>
            <input
                id="gasto-valor"
                name="valor"
                className="form-input"
                inputMode="decimal"
                placeholder="0,00"
                value={form.valor}
                onChange={alterarCampo}
            />
            {erros.valor && (
                <span className={styles["gastos-erro-campo"]}>{erros.valor}</span>
            )}
            </div>

            <div className="form-group">
            <label className="form-label" htmlFor="gasto-data">
                Data
            </label>
            <input
                id="gasto-data"
                name="data"
                type="date"
                className="form-input"
                value={form.data}
                onChange={alterarCampo}
            />
            {erros.data && (
                <span className={styles["gastos-erro-campo"]}>{erros.data}</span>
            )}
            </div>

            <div className={`form-group ${styles["gastos-form-campo-largo"]}`}>
            <label className="form-label" htmlFor="gasto-comentario">
                Comentário <span className="texto-secundario">(opcional)</span>
            </label>
            <textarea
                id="gasto-comentario"
                name="comentario"
                className={`form-input ${styles["gastos-textarea"]}`}
                rows={3}
                maxLength={TAMANHO_MAX_COMENTARIO}
                placeholder="Ex.: dividi a conta com a Ana"
                value={form.comentario}
                onChange={alterarCampo}
            />
            <span className={styles["gastos-contador"]}>
                {form.comentario.length}/{TAMANHO_MAX_COMENTARIO}
            </span>
            </div>

            <div className={styles["gastos-form-campo-largo"]}>
            {jaEhRecorrente ? (
                <p className={`mensagem mensagem-info ${styles["gastos-nota"]}`}>
                Este gasto faz parte de uma recorrência. Alterá-lo aqui não muda os próximos
                lançamentos; para isso use “Recorrentes”.
                </p>
            ) : (
                <label className={styles["gastos-check"]}>
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
                        ? `Lança automaticamente este gasto todo dia ${diaDaRecorrencia}. `
                        : "Lança automaticamente este gasto todo mês. "}
                    Você pode pausar ou editar em “Recorrentes”.
                    </small>
                </span>
                </label>
            )}
            </div>

            {erroEnvio && (
            <p
                className={`mensagem mensagem-erro ${styles["gastos-form-campo-largo"]}`}
                role="alert"
            >
                {erroEnvio}
            </p>
            )}

            <div
            className={`${styles["gastos-form-acoes"]} ${styles["gastos-form-campo-largo"]}`}
            >
            <button type="button" className="btn btn-secundario" onClick={onFechar}>
                Cancelar
            </button>

            <button type="submit" className="btn btn-primario" disabled={salvando}>
                {salvando ? "Salvando..." : editando ? "Salvar alterações" : "Adicionar"}
            </button>
            </div>
        </form>
        </Modal>
    );
    }