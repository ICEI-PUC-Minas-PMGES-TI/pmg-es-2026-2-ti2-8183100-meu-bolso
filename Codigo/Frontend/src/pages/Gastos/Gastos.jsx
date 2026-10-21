
    import { useEffect, useMemo, useState } from "react";
    import styles from "./Gastos.module.css";

    // ========================================
    // DADOS FICTÍCIOS (SPRINT 1)
    // ========================================

    const CHAVE_STORAGE = "meubolso:gastos";

    const CATEGORIAS = [
    "Alimentação",
    "Transporte",
    "Lazer",
    "Moradia",
    "Educação",
    "Saúde",
    "Assinaturas",
    "Outros",
    ];

    const CARTEIRAS = [
    "Carteira",
    "Nubank",
    "Itaú",
    "Inter",
    "Cartão de crédito",
    ];

    function dataRelativa(mesesAtras, dia) {
    const hoje = new Date();
    const data = new Date(
        hoje.getFullYear(),
        hoje.getMonth() - mesesAtras,
        dia
    );

    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const diaStr = String(data.getDate()).padStart(2, "0");

    return `${data.getFullYear()}-${mes}-${diaStr}`;
    }

    const GASTOS_FICTICIOS = [
    {
        id: 1,
        descricao: "Almoço no restaurante",
        categoria: "Alimentação",
        carteira: "Nubank",
        data: dataRelativa(0, 3),
        valor: 38.9,
    },
    {
        id: 2,
        descricao: "Uber para a faculdade",
        categoria: "Transporte",
        carteira: "Carteira",
        data: dataRelativa(0, 5),
        valor: 22.5,
    },
    {
        id: 3,
        descricao: "Netflix",
        categoria: "Assinaturas",
        carteira: "Cartão de crédito",
        data: dataRelativa(0, 8),
        valor: 44.9,
    },
    {
        id: 4,
        descricao: "Cinema com amigos",
        categoria: "Lazer",
        carteira: "Inter",
        data: dataRelativa(0, 12),
        valor: 56,
    },
    {
        id: 5,
        descricao: "Aluguel",
        categoria: "Moradia",
        carteira: "Itaú",
        data: dataRelativa(0, 1),
        valor: 850,
    },
    {
        id: 6,
        descricao: "Curso de inglês",
        categoria: "Educação",
        carteira: "Nubank",
        data: dataRelativa(1, 10),
        valor: 120,
    },
    {
        id: 7,
        descricao: "Farmácia",
        categoria: "Saúde",
        carteira: "Carteira",
        data: dataRelativa(1, 18),
        valor: 47.3,
    },
    {
        id: 8,
        descricao: "Supermercado",
        categoria: "Alimentação",
        carteira: "Inter",
        data: dataRelativa(1, 22),
        valor: 213.75,
    },
    ];

    function carregarGastos() {
    try {
        const salvo = localStorage.getItem(CHAVE_STORAGE);

        if (salvo) {
        return JSON.parse(salvo);
        }
    } catch {
        // Utiliza os dados fictícios em caso de erro.
    }

    return GASTOS_FICTICIOS;
    }

    function salvarGastos(gastos) {
    try {
        localStorage.setItem(CHAVE_STORAGE, JSON.stringify(gastos));
    } catch {
        // Ignora falhas no armazenamento local.
    }
    }

    // ========================================
    // FUNÇÕES AUXILIARES
    // ========================================

    const NOMES_MESES = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
    ];

    function mesAtualChave() {
    const hoje = new Date();

    return `${hoje.getFullYear()}-${String(
        hoje.getMonth() + 1
    ).padStart(2, "0")}`;
    }

    function formatarMesExtenso(chave) {
    const [ano, mes] = chave.split("-");

    return `${NOMES_MESES[Number(mes) - 1]} de ${ano}`;
    }

    function mudarMes(chave, delta) {
    const [ano, mes] = chave.split("-").map(Number);
    const data = new Date(ano, mes - 1 + delta, 1);

    return `${data.getFullYear()}-${String(
        data.getMonth() + 1
    ).padStart(2, "0")}`;
    }

    function formatarData(dataISO) {
    const [ano, mes, dia] = dataISO.split("-");

    return `${dia}/${mes}/${ano}`;
    }

    function formatarMoeda(valor) {
    return valor.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
    });
    }

    function converterValor(texto) {
    const limpo = texto
        .replace(/\./g, "")
        .replace(",", ".")
        .trim();

    return Number(limpo);
    }

    const FORM_INICIAL = {
    descricao: "",
    categoria: "",
    carteira: "",
    valor: "",
    data: "",
    };

    // ========================================
    // MODAL DE ADICIONAR GASTO
    // ========================================

    function ModalAdicionarGasto({
    mesSelecionado,
    onFechar,
    onSalvar,
    }) {
    const [form, setForm] = useState({
        ...FORM_INICIAL,
        data: `${mesSelecionado}-01`,
    });

    const [erros, setErros] = useState({});

    useEffect(() => {
        function aoPressionarTecla(event) {
        if (event.key === "Escape") {
            onFechar();
        }
        }

        document.addEventListener("keydown", aoPressionarTecla);

        return () => {
        document.removeEventListener("keydown", aoPressionarTecla);
        };
    }, [onFechar]);

    function alterarCampo(event) {
        const { name, value } = event.target;

        setForm((atual) => ({
        ...atual,
        [name]: value,
        }));

        setErros((atual) => ({
        ...atual,
        [name]: undefined,
        }));
    }

    function validar() {
        const novosErros = {};

        if (!form.descricao.trim()) {
        novosErros.descricao = "Informe a descrição.";
        }

        if (!form.categoria) {
        novosErros.categoria = "Selecione a categoria.";
        }

        if (!form.carteira) {
        novosErros.carteira = "Selecione a carteira.";
        }

        if (!form.data) {
        novosErros.data = "Informe a data.";
        }

        const valorNumerico = converterValor(form.valor);

        if (!form.valor.trim()) {
        novosErros.valor = "Informe o valor.";
        } else if (
        !Number.isFinite(valorNumerico) ||
        valorNumerico <= 0
        ) {
        novosErros.valor = "Informe um valor maior que zero.";
        }

        return novosErros;
    }

    function enviar(event) {
        event.preventDefault();

        const novosErros = validar();

        setErros(novosErros);

        if (Object.keys(novosErros).length > 0) {
        return;
        }

        onSalvar({
        id: Date.now(),
        descricao: form.descricao.trim(),
        categoria: form.categoria,
        carteira: form.carteira,
        data: form.data,
        valor: converterValor(form.valor),
        });
    }

    return (
        <div
        className={styles["gastos-modal-overlay"]}
        onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
            onFechar();
            }
        }}
        >
        <div
            className={styles["gastos-modal"]}
            role="dialog"
            aria-modal="true"
            aria-labelledby="gastos-modal-titulo"
        >
            <div className={styles["gastos-modal-cabecalho"]}>
            <h2 id="gastos-modal-titulo">
                Adicionar gasto
            </h2>

            <button
                type="button"
                className={styles["gastos-modal-fechar"]}
                onClick={onFechar}
                aria-label="Fechar"
            >
                ×
            </button>
            </div>

            <form
            className={styles["gastos-form"]}
            onSubmit={enviar}
            noValidate
            >
            <div
                className={`form-group ${
                styles["gastos-form-campo-largo"]
                }`}
            >
                <label
                className="form-label"
                htmlFor="gasto-descricao"
                >
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
                <span className={styles["gastos-erro-campo"]}>
                    {erros.descricao}
                </span>
                )}
            </div>

            <div className="form-group">
                <label
                className="form-label"
                htmlFor="gasto-categoria"
                >
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

                {CATEGORIAS.map((categoria) => (
                    <option key={categoria} value={categoria}>
                    {categoria}
                    </option>
                ))}
                </select>

                {erros.categoria && (
                <span className={styles["gastos-erro-campo"]}>
                    {erros.categoria}
                </span>
                )}
            </div>

            <div className="form-group">
                <label
                className="form-label"
                htmlFor="gasto-carteira"
                >
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

                {CARTEIRAS.map((carteira) => (
                    <option key={carteira} value={carteira}>
                    {carteira}
                    </option>
                ))}
                </select>

                {erros.carteira && (
                <span className={styles["gastos-erro-campo"]}>
                    {erros.carteira}
                </span>
                )}
            </div>

            <div className="form-group">
                <label
                className="form-label"
                htmlFor="gasto-valor"
                >
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
                <span className={styles["gastos-erro-campo"]}>
                    {erros.valor}
                </span>
                )}
            </div>

            <div className="form-group">
                <label
                className="form-label"
                htmlFor="gasto-data"
                >
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
                <span className={styles["gastos-erro-campo"]}>
                    {erros.data}
                </span>
                )}
            </div>

            <div
                className={`${
                styles["gastos-form-acoes"]
                } ${styles["gastos-form-campo-largo"]}`}
            >
                <button
                type="button"
                className="btn btn-secundario"
                onClick={onFechar}
                >
                Cancelar
                </button>

                <button
                type="submit"
                className="btn btn-primario"
                >
                Adicionar
                </button>
            </div>
            </form>
        </div>
        </div>
    );
    }

    // ========================================
    // PÁGINA DE GASTOS
    // ========================================

    export default function Gastos() {
    const [gastos, setGastos] = useState(carregarGastos);
    const [mesSelecionado, setMesSelecionado] =
        useState(mesAtualChave);
    const [modalAberto, setModalAberto] = useState(false);

    useEffect(() => {
        salvarGastos(gastos);
    }, [gastos]);

    const gastosDoMes = useMemo(() => {
        return gastos
        .filter((gasto) =>
            gasto.data.startsWith(mesSelecionado)
        )
        .sort((a, b) => b.data.localeCompare(a.data));
    }, [gastos, mesSelecionado]);

    const totalDoMes = useMemo(() => {
        return gastosDoMes.reduce(
        (soma, gasto) => soma + gasto.valor,
        0
        );
    }, [gastosDoMes]);

    function adicionarGasto(novoGasto) {
        setGastos((atual) => [novoGasto, ...atual]);

        setMesSelecionado(novoGasto.data.slice(0, 7));
        setModalAberto(false);
    }

    function excluirGasto(id) {
        if (!window.confirm("Deseja excluir este gasto?")) {
        return;
        }

        setGastos((atual) =>
        atual.filter((gasto) => gasto.id !== id)
        );
    }

    return (
        <section className={styles["gastos-pagina"]}>
        <header className={styles["gastos-topo"]}>
            <div>
            <h1 className={styles["gastos-titulo"]}>
                Gastos
            </h1>

            <p className={styles["gastos-subtitulo"]}>
                {formatarMesExtenso(mesSelecionado)}
            </p>
            </div>

            <div className={styles["gastos-topo-acoes"]}>
            <div
                className={styles["gastos-seletor-mes"]}
                aria-label="Selecionar mês"
            >
                <button
                type="button"
                className={styles["gastos-seletor-botao"]}
                onClick={() =>
                    setMesSelecionado((mes) =>
                    mudarMes(mes, -1)
                    )
                }
                aria-label="Mês anterior"
                >
                ‹
                </button>

                <span className={styles["gastos-seletor-texto"]}>
                {formatarMesExtenso(mesSelecionado)}
                </span>

                <button
                type="button"
                className={styles["gastos-seletor-botao"]}
                onClick={() =>
                    setMesSelecionado((mes) =>
                    mudarMes(mes, 1)
                    )
                }
                aria-label="Próximo mês"
                >
                ›
                </button>
            </div>

            <button
                type="button"
                className={`btn btn-primario ${
                styles["gastos-botao-adicionar"]
                }`}
                onClick={() => setModalAberto(true)}
            >
                + Adicionar Gasto
            </button>
            </div>
        </header>

        <div className={styles["gastos-card"]}>
            {gastosDoMes.length === 0 ? (
            <div className={styles["gastos-vazio"]}>
                <span
                className={styles["gastos-vazio-icone"]}
                aria-hidden="true"
                >
                🧾
                </span>

                <h3>Nenhum gasto neste mês</h3>

                <p className="texto-secundario">
                Não há gastos em{" "}
                {formatarMesExtenso(mesSelecionado)}.
                Clique em “Adicionar Gasto” para registrar
                o primeiro.
                </p>
            </div>
            ) : (
            <>
                <div className={styles["gastos-tabela-wrapper"]}>
                <table className={styles["gastos-tabela"]}>
                    <thead>
                    <tr>
                        <th>Descrição</th>
                        <th>Categoria</th>
                        <th>Carteira</th>
                        <th>Data</th>

                        <th className={styles["gastos-col-valor"]}>
                        Valor
                        </th>

                        <th className={styles["gastos-col-acoes"]}>
                        <span className={styles["gastos-sr-only"]}>
                            Ações
                        </span>
                        </th>
                    </tr>
                    </thead>

                    <tbody>
                    {gastosDoMes.map((gasto) => (
                        <tr key={gasto.id}>
                        <td
                            data-label="Descrição"
                            className={
                            styles["gastos-celula-descricao"]
                            }
                        >
                            {gasto.descricao}
                        </td>

                        <td data-label="Categoria">
                            <span className={styles["gastos-etiqueta"]}>
                            {gasto.categoria}
                            </span>
                        </td>

                        <td data-label="Carteira">
                            {gasto.carteira}
                        </td>

                        <td data-label="Data">
                            {formatarData(gasto.data)}
                        </td>

                        <td
                            data-label="Valor"
                            className={styles["gastos-col-valor"]}
                        >
                            <span className={styles["gastos-valor"]}>
                            − {formatarMoeda(gasto.valor)}
                            </span>
                        </td>

                        <td
                            data-label="Ações"
                            className={styles["gastos-col-acoes"]}
                        >
                            <button
                            type="button"
                            className={
                                styles["gastos-botao-excluir"]
                            }
                            onClick={() =>
                                excluirGasto(gasto.id)
                            }
                            aria-label={`Excluir gasto ${gasto.descricao}`}
                            title="Excluir"
                            >
                            🗑
                            </button>
                        </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                </div>

                <footer className={styles["gastos-rodape"]}>
                <span className="texto-secundario texto-pequeno">
                    {gastosDoMes.length}{" "}
                    {gastosDoMes.length === 1
                    ? "gasto"
                    : "gastos"}
                </span>

                <span className={styles["gastos-total"]}>
                    Total:{" "}
                    <strong className={styles["gastos-valor"]}>
                    − {formatarMoeda(totalDoMes)}
                    </strong>
                </span>
                </footer>
            </>
            )}
        </div>

        {modalAberto && (
            <ModalAdicionarGasto
            mesSelecionado={mesSelecionado}
            onFechar={() => setModalAberto(false)}
            onSalvar={adicionarGasto}
            />
        )}
        </section>
    );
    }
