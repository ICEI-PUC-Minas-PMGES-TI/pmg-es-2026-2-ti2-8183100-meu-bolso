    import {
    ArrowDown,
    ArrowUp,
    ArrowUpDown,
    MessageSquareText,
    Pencil,
    Repeat,
    SearchX,
    Trash2,
    } from "lucide-react";

    import {
    formatarData,
    formatarMoeda,
    DIRECAO_PADRAO,
    } from "../../utils/Gastosutils";
    import IconeCategoria from "./IconeCategoria";
    import styles from "../../pages/Gastos/Gastos.module.css";

    // Cabeçalho clicável: alterna crescente/decrescente e informa o estado ao leitor de tela
    function CabecalhoOrdenavel({ campo, rotulo, ordenacao, onOrdenar, className }) {
    const ativo = ordenacao.campo === campo;
    const Seta = !ativo ? ArrowUpDown : ordenacao.direcao === "asc" ? ArrowUp : ArrowDown;

    function alternar() {
        onOrdenar(
        ativo
            ? { campo, direcao: ordenacao.direcao === "asc" ? "desc" : "asc" }
            : { campo, direcao: DIRECAO_PADRAO[campo] },
        );
    }

    return (
        <th
        className={className}
        aria-sort={
            ativo ? (ordenacao.direcao === "asc" ? "ascending" : "descending") : "none"
        }
        >
        <button
            type="button"
            className={`${styles["gastos-th-botao"]} ${
            ativo ? styles["gastos-th-ativo"] : ""
            }`}
            onClick={alternar}
        >
            {rotulo}
            <Seta size={14} aria-hidden="true" />
        </button>
        </th>
    );
    }

    export default function TabelaGastos({
    gastos,
    quantidadeDoMes,
    filtrando,
    carregando,
    removendo,
    ordenacao,
    onOrdenar,
    onEditar,
    onExcluir,
    onComentario,
    onLimparFiltros,
    mesExtenso,
    }) {
    if (carregando) {
        return (
        <div className={styles["gastos-esqueleto-lista"]} aria-busy="true">
            {[0, 1, 2, 3].map((i) => (
            <div key={i} className={styles["gastos-esqueleto"]} />
            ))}
        </div>
        );
    }

    if (quantidadeDoMes === 0) {
        return (
        <div className={styles["gastos-vazio"]}>
            <span className={styles["gastos-vazio-icone"]} aria-hidden="true">
            🧾
            </span>
            <h3>Nenhum gasto neste mês</h3>
            <p className="texto-secundario">
            Não há gastos em {mesExtenso}. Clique em “Adicionar Gasto” para registrar o
            primeiro.
            </p>
        </div>
        );
    }

    if (gastos.length === 0) {
        return (
        <div className={styles["gastos-vazio"]}>
            <SearchX size={36} aria-hidden="true" className={styles["gastos-vazio-svg"]} />
            <h3>Nenhum gasto encontrado</h3>
            <p className="texto-secundario">
            Nenhum gasto de {mesExtenso} combina com os filtros aplicados.
            </p>
            <button type="button" className="btn btn-secundario" onClick={onLimparFiltros}>
            Limpar filtros
            </button>
        </div>
        );
    }

    const somaVisivel = gastos.reduce((soma, gasto) => soma + gasto.valor, 0);

    return (
        <>
        <div className={styles["gastos-tabela-wrapper"]}>
            <table className={styles["gastos-tabela"]}>
            <thead>
                <tr>
                <th>Descrição</th>
                <CabecalhoOrdenavel
                    campo="categoria"
                    rotulo="Categoria"
                    ordenacao={ordenacao}
                    onOrdenar={onOrdenar}
                />
                <CabecalhoOrdenavel
                    campo="carteira"
                    rotulo="Carteira"
                    ordenacao={ordenacao}
                    onOrdenar={onOrdenar}
                />
                <CabecalhoOrdenavel
                    campo="data"
                    rotulo="Data"
                    ordenacao={ordenacao}
                    onOrdenar={onOrdenar}
                />
                <CabecalhoOrdenavel
                    campo="valor"
                    rotulo="Valor"
                    ordenacao={ordenacao}
                    onOrdenar={onOrdenar}
                    className={styles["gastos-col-valor"]}
                />
                <th className={styles["gastos-col-acoes"]}>
                    <span className={styles["gastos-sr-only"]}>Ações</span>
                </th>
                </tr>
            </thead>

            <tbody>
                {gastos.map((gasto, indice) => (
                <tr
                    key={gasto.id}
                    className={`${styles["gastos-linha"]} ${
                    removendo.has(gasto.id) ? styles["gastos-linha-saindo"] : ""
                    }`}
                    style={{ "--i": indice }}
                >
                    <td data-label="Descrição" className={styles["gastos-celula-descricao"]}>
                    <span className={styles["gastos-descricao"]}>
                        <span>{gasto.descricao}</span>

                        {gasto.recorrenciaId && (
                        <span
                            className={styles["gastos-selo-recorrente"]}
                            title="Gasto recorrente (repete todo mês)"
                        >
                            <Repeat size={13} aria-hidden="true" />
                            <span className={styles["gastos-sr-only"]}>Recorrente</span>
                        </span>
                        )}

                        {gasto.comentario && (
                        <button
                            type="button"
                            className={styles["gastos-botao-comentario"]}
                            onClick={() => onComentario(gasto)}
                            aria-label={`Ver comentário de ${gasto.descricao}`}
                            title={gasto.comentario}
                        >
                            <MessageSquareText size={16} aria-hidden="true" />
                        </button>
                        )}
                    </span>
                    </td>

                    <td data-label="Categoria">
                    <span className={styles["gastos-etiqueta"]}>
                        <IconeCategoria categoria={gasto.categoria} />
                        {gasto.categoria}
                    </span>
                    </td>

                    <td data-label="Carteira">{gasto.carteira}</td>

                    <td data-label="Data">{formatarData(gasto.data)}</td>

                    <td data-label="Valor" className={styles["gastos-col-valor"]}>
                    <span className={styles["gastos-valor"]}>
                        − {formatarMoeda(gasto.valor)}
                    </span>
                    </td>

                    <td data-label="Ações" className={styles["gastos-col-acoes"]}>
                    <span className={styles["gastos-acoes"]}>
                        <button
                        type="button"
                        className={styles["gastos-botao-icone"]}
                        onClick={() => onEditar(gasto)}
                        aria-label={`Editar gasto ${gasto.descricao}`}
                        title="Editar"
                        >
                        <Pencil size={16} aria-hidden="true" />
                        </button>

                        <button
                        type="button"
                        className={`${styles["gastos-botao-icone"]} ${styles["gastos-botao-excluir"]}`}
                        onClick={() => onExcluir(gasto)}
                        aria-label={`Excluir gasto ${gasto.descricao}`}
                        title="Excluir"
                        >
                        <Trash2 size={16} aria-hidden="true" />
                        </button>
                    </span>
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>

        <footer className={styles["gastos-rodape"]}>
            <span className="texto-secundario texto-pequeno" aria-live="polite">
            {filtrando
                ? `${gastos.length} de ${quantidadeDoMes} ${quantidadeDoMes === 1 ? "gasto" : "gastos"}`
                : `${gastos.length} ${gastos.length === 1 ? "gasto" : "gastos"}`}
            </span>

            <span className={styles["gastos-total"]}>
            {filtrando ? "Total filtrado:" : "Total:"}{" "}
            <strong className={styles["gastos-valor"]}>− {formatarMoeda(somaVisivel)}</strong>
            </span>
        </footer>
        </>
    );
    }