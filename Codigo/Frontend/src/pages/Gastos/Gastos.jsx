    import { useEffect, useMemo, useState } from "react";
    import "./Gastos.css";

    /* ==========================================================
    DADOS FICTÍCIOS E "SERVIÇO" (Sprint 1)
    Na Sprint 2, substitua as funções de "carregarGastos" e
    "salvarGastos" por chamadas fetch/axios ao Spring Boot.
    ========================================================== */

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

    const CARTEIRAS = ["Carteira", "Nubank", "Itaú", "Inter", "Cartão de crédito"];

    function dataRelativa(mesesAtras, dia) {
    const hoje = new Date();
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - mesesAtras, dia);
    const mes = String(d.getMonth() + 1).padStart(2, "0");
    const diaStr = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${mes}-${diaStr}`;
    }

    const GASTOS_FICTICIOS = [
    { id: 1, descricao: "Almoço no restaurante", categoria: "Alimentação", carteira: "Nubank", data: dataRelativa(0, 3), valor: 38.9 },
    { id: 2, descricao: "Uber para a faculdade", categoria: "Transporte", carteira: "Carteira", data: dataRelativa(0, 5), valor: 22.5 },
    { id: 3, descricao: "Netflix", categoria: "Assinaturas", carteira: "Cartão de crédito", data: dataRelativa(0, 8), valor: 44.9 },
    { id: 4, descricao: "Cinema com amigos", categoria: "Lazer", carteira: "Inter", data: dataRelativa(0, 12), valor: 56 },
    { id: 5, descricao: "Aluguel", categoria: "Moradia", carteira: "Itaú", data: dataRelativa(0, 1), valor: 850 },
    { id: 6, descricao: "Curso de inglês", categoria: "Educação", carteira: "Nubank", data: dataRelativa(1, 10), valor: 120 },
    { id: 7, descricao: "Farmácia", categoria: "Saúde", carteira: "Carteira", data: dataRelativa(1, 18), valor: 47.3 },
    { id: 8, descricao: "Supermercado", categoria: "Alimentação", carteira: "Inter", data: dataRelativa(1, 22), valor: 213.75 },
    ];

    function carregarGastos() {
    try {
        const salvo = localStorage.getItem(CHAVE_STORAGE);
        if (salvo) return JSON.parse(salvo);
    } catch {
        /* ignora e usa os dados fictícios */
    }
    return GASTOS_FICTICIOS;
    }

    function salvarGastos(gastos) {
    try {
        localStorage.setItem(CHAVE_STORAGE, JSON.stringify(gastos));
    } catch {
        /* ignora falha de armazenamento */
    }
    }

    /* ==========================================================
    FUNÇÕES AUXILIARES
    ========================================================== */

    const NOMES_MESES = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
    ];

    function mesAtualChave() {
    const hoje = new Date();
    return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;
    }

    function formatarMesExtenso(chave) {
    const [ano, mes] = chave.split("-");
    return `${NOMES_MESES[Number(mes) - 1]} de ${ano}`;
    }

    function mudarMes(chave, delta) {
    const [ano, mes] = chave.split("-").map(Number);
    const d = new Date(ano, mes - 1 + delta, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    }

    function formatarData(dataISO) {
    const [ano, mes, dia] = dataISO.split("-");
    return `${dia}/${mes}/${ano}`;
    }

    function formatarMoeda(valor) {
    return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    }

    function converterValor(texto) {
    const limpo = texto.replace(/\./g, "").replace(",", ".").trim();
    return Number(limpo);
    }

    const FORM_INICIAL = {
    descricao: "",
    categoria: "",
    carteira: "",
    valor: "",
    data: "",
    };

    /* ==========================================================
    COMPONENTE: MODAL DE NOVO GASTO
    ========================================================== */

    function ModalAdicionarGasto({ mesSelecionado, onFechar, onSalvar }) {
    const [form, setForm] = useState({
        ...FORM_INICIAL,
        data: `${mesSelecionado}-01`,
    });
    const [erros, setErros] = useState({});

    useEffect(() => {
        function aoPressionarTecla(e) {
        if (e.key === "Escape") onFechar();
        }
        document.addEventListener("keydown", aoPressionarTecla);
        return () => document.removeEventListener("keydown", aoPressionarTecla);
    }, [onFechar]);

    function alterarCampo(e) {
        const { name, value } = e.target;
        setForm((atual) => ({ ...atual, [name]: value }));
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
        } else if (Number.isNaN(valorNumerico) || valorNumerico <= 0) {
        novosErros.valor = "Informe um valor maior que zero.";
        }
        return novosErros;
    }

    function enviar(e) {
        e.preventDefault();
        const novosErros = validar();
        setErros(novosErros);
        if (Object.keys(novosErros).length > 0) return;

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
        className="gastos-modal-overlay"
        onMouseDown={(e) => e.target === e.currentTarget && onFechar()}
        >
        <div
            className="gastos-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="gastos-modal-titulo"
        >
            <div className="gastos-modal-cabecalho">
            <h2 id="gastos-modal-titulo">Adicionar gasto</h2>
            <button
                type="button"
                className="gastos-modal-fechar"
                onClick={onFechar}
                aria-label="Fechar"
            >
                ×
            </button>
            </div>

            <form className="gastos-form" onSubmit={enviar} noValidate>
            <div className="form-group gastos-form-campo-largo">
                <label className="form-label" htmlFor="gasto-descricao">Descrição</label>
                <input
                id="gasto-descricao"
                name="descricao"
                className="form-input"
                placeholder="Ex.: Almoço no restaurante"
                value={form.descricao}
                onChange={alterarCampo}
                autoFocus
                />
                {erros.descricao && <span className="gastos-erro-campo">{erros.descricao}</span>}
            </div>

            <div className="form-group">
                <label className="form-label" htmlFor="gasto-categoria">Categoria</label>
                <select
                id="gasto-categoria"
                name="categoria"
                className="form-input"
                value={form.categoria}
                onChange={alterarCampo}
                >
                <option value="">Selecione</option>
                {CATEGORIAS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                ))}
                </select>
                {erros.categoria && <span className="gastos-erro-campo">{erros.categoria}</span>}
            </div>

            <div className="form-group">
                <label className="form-label" htmlFor="gasto-carteira">Carteira</label>
                <select
                id="gasto-carteira"
                name="carteira"
                className="form-input"
                value={form.carteira}
                onChange={alterarCampo}
                >
                <option value="">Selecione</option>
                {CARTEIRAS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                ))}
                </select>
                {erros.carteira && <span className="gastos-erro-campo">{erros.carteira}</span>}
            </div>

            <div className="form-group">
                <label className="form-label" htmlFor="gasto-valor">Valor (R$)</label>
                <input
                id="gasto-valor"
                name="valor"
                className="form-input"
                inputMode="decimal"
                placeholder="0,00"
                value={form.valor}
                onChange={alterarCampo}
                />
                {erros.valor && <span className="gastos-erro-campo">{erros.valor}</span>}
            </div>

            <div className="form-group">
                <label className="form-label" htmlFor="gasto-data">Data</label>
                <input
                id="gasto-data"
                name="data"
                type="date"
                className="form-input"
                value={form.data}
                onChange={alterarCampo}
                />
                {erros.data && <span className="gastos-erro-campo">{erros.data}</span>}
            </div>

            <div className="gastos-form-acoes gastos-form-campo-largo">
                <button type="button" className="btn btn-secundario" onClick={onFechar}>
                Cancelar
                </button>
                <button type="submit" className="btn btn-primario">
                Adicionar
                </button>
            </div>
            </form>
        </div>
        </div>
    );
    }

    /* ==========================================================
    PÁGINA: GASTOS
    ========================================================== */

    export default function Gastos() {
    const [gastos, setGastos] = useState(carregarGastos);
    const [mesSelecionado, setMesSelecionado] = useState(mesAtualChave);
    const [modalAberto, setModalAberto] = useState(false);

    useEffect(() => {
        salvarGastos(gastos);
    }, [gastos]);

    const gastosDoMes = useMemo(
        () =>
        gastos
            .filter((g) => g.data.startsWith(mesSelecionado))
            .sort((a, b) => b.data.localeCompare(a.data)),
        [gastos, mesSelecionado]
    );

    const totalDoMes = useMemo(
        () => gastosDoMes.reduce((soma, g) => soma + g.valor, 0),
        [gastosDoMes]
    );

    function adicionarGasto(novoGasto) {
        setGastos((atual) => [novoGasto, ...atual]);
        // Mostra o mês do gasto recém-cadastrado
        setMesSelecionado(novoGasto.data.slice(0, 7));
        setModalAberto(false);
    }

    return (
        <section className="gastos-pagina">
        <header className="gastos-topo">
            <div className="gastos-titulo-bloco">
            <h1 className="gastos-titulo">Gastos</h1>
            <p className="gastos-subtitulo">{formatarMesExtenso(mesSelecionado)}</p>
            </div>

            <div className="gastos-topo-acoes">
            <div className="gastos-seletor-mes" aria-label="Selecionar mês">
                <button
                type="button"
                className="gastos-seletor-botao"
                onClick={() => setMesSelecionado((m) => mudarMes(m, -1))}
                aria-label="Mês anterior"
                >
                ‹
                </button>
                <span className="gastos-seletor-texto">
                {formatarMesExtenso(mesSelecionado)}
                </span>
                <button
                type="button"
                className="gastos-seletor-botao"
                onClick={() => setMesSelecionado((m) => mudarMes(m, 1))}
                aria-label="Próximo mês"
                >
                ›
                </button>
            </div>

            <button
                type="button"
                className="btn btn-primario gastos-botao-adicionar"
                onClick={() => setModalAberto(true)}
            >
                + Adicionar Gasto
            </button>
            </div>
        </header>

        <div className="gastos-card">
            {gastosDoMes.length === 0 ? (
            <div className="gastos-vazio">
                <span className="gastos-vazio-icone" aria-hidden="true">🧾</span>
                <h3>Nenhum gasto neste mês</h3>
                <p className="texto-secundario">
                Não há gastos em {formatarMesExtenso(mesSelecionado)}. Clique em
                “Adicionar Gasto” para registrar o primeiro.
                </p>
            </div>
            ) : (
            <>
                <div className="gastos-tabela-wrapper">
                <table className="gastos-tabela">
                    <thead>
                    <tr>
                        <th>Descrição</th>
                        <th>Categoria</th>
                        <th>Carteira</th>
                        <th>Data</th>
                        <th className="gastos-col-valor">Valor</th>
                    </tr>
                    </thead>
                    <tbody>
                    {gastosDoMes.map((g) => (
                        <tr key={g.id}>
                        <td data-label="Descrição" className="gastos-celula-descricao">
                            {g.descricao}
                        </td>
                        <td data-label="Categoria">
                            <span className="gastos-etiqueta">{g.categoria}</span>
                        </td>
                        <td data-label="Carteira">{g.carteira}</td>
                        <td data-label="Data">{formatarData(g.data)}</td>
                        <td data-label="Valor" className="gastos-col-valor">
                            <span className="gastos-valor">− {formatarMoeda(g.valor)}</span>
                        </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                </div>

                <footer className="gastos-rodape">
                <span className="texto-secundario texto-pequeno">
                    {gastosDoMes.length} {gastosDoMes.length === 1 ? "gasto" : "gastos"}
                </span>
                <span className="gastos-total">
                    Total: <strong className="gastos-valor">− {formatarMoeda(totalDoMes)}</strong>
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