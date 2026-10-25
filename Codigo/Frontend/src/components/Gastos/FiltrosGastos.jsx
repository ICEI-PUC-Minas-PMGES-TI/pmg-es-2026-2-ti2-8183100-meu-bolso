    import { Search, X } from "lucide-react";

    import { OPCOES_ORDENACAO, temFiltroAtivo } from "../../utils/Gastosutils";
    import { CATEGORIAS, CARTEIRAS } from "../../pages/Gastos/Constantes";
    import styles from "../../pages/Gastos/Gastos.module.css";

    export default function FiltrosGastos({
    filtros,
    onAlterar,
    onLimpar,
    ordenacao,
    onOrdenar,
    mesSelecionado,
    diasDoMes,
    }) {
    const primeiroDia = `${mesSelecionado}-01`;
    const ultimoDia = `${mesSelecionado}-${String(diasDoMes).padStart(2, "0")}`;

    function alterar(event) {
        onAlterar({ ...filtros, [event.target.name]: event.target.value });
    }

    return (
        <div className={styles["gastos-filtros"]} role="search" aria-label="Filtrar gastos">
        <div className={`form-group ${styles["gastos-filtro-busca"]}`}>
            <label className="form-label" htmlFor="filtro-busca">
            Buscar
            </label>
            <div className={styles["gastos-busca-campo"]}>
            <Search size={16} aria-hidden="true" />
            <input
                id="filtro-busca"
                name="busca"
                type="search"
                className="form-input"
                placeholder="Descrição do gasto"
                value={filtros.busca}
                onChange={alterar}
                autoComplete="off"
            />
            </div>
        </div>

        <div className="form-group">
            <label className="form-label" htmlFor="filtro-categoria">
            Categoria
            </label>
            <select
            id="filtro-categoria"
            name="categoria"
            className="form-input"
            value={filtros.categoria}
            onChange={alterar}
            >
            <option value="">Todas</option>
            {CATEGORIAS.map((categoria) => (
                <option key={categoria} value={categoria}>
                {categoria}
                </option>
            ))}
            </select>
        </div>

        <div className="form-group">
            <label className="form-label" htmlFor="filtro-carteira">
            Carteira
            </label>
            <select
            id="filtro-carteira"
            name="carteira"
            className="form-input"
            value={filtros.carteira}
            onChange={alterar}
            >
            <option value="">Todas</option>
            {CARTEIRAS.map((carteira) => (
                <option key={carteira} value={carteira}>
                {carteira}
                </option>
            ))}
            </select>
        </div>

        <div className="form-group">
            <label className="form-label" htmlFor="filtro-de">
            De
            </label>
            <input
            id="filtro-de"
            name="de"
            type="date"
            className="form-input"
            min={primeiroDia}
            max={filtros.ate || ultimoDia}
            value={filtros.de}
            onChange={alterar}
            />
        </div>

        <div className="form-group">
            <label className="form-label" htmlFor="filtro-ate">
            Até
            </label>
            <input
            id="filtro-ate"
            name="ate"
            type="date"
            className="form-input"
            min={filtros.de || primeiroDia}
            max={ultimoDia}
            value={filtros.ate}
            onChange={alterar}
            />
        </div>

        <div className="form-group">
            <label className="form-label" htmlFor="filtro-ordenar">
            Ordenar por
            </label>
            <select
            id="filtro-ordenar"
            className="form-input"
            value={`${ordenacao.campo}:${ordenacao.direcao}`}
            onChange={(event) => {
                const [campo, direcao] = event.target.value.split(":");
                onOrdenar({ campo, direcao });
            }}
            >
            {OPCOES_ORDENACAO.map((opcao) => (
                <option key={opcao.valor} value={opcao.valor}>
                {opcao.rotulo}
                </option>
            ))}
            </select>
        </div>

        {temFiltroAtivo(filtros) && (
            <button
            type="button"
            className={`btn btn-secundario ${styles["gastos-filtro-limpar"]}`}
            onClick={onLimpar}
            >
            <X size={16} aria-hidden="true" />
            Limpar filtros
            </button>
        )}
        </div>
    );
    }