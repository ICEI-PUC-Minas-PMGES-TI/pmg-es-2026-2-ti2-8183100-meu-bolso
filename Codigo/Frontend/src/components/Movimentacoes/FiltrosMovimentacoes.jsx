import { useId } from "react";
import { ArrowUpDown, LayoutGrid, Search, SlidersHorizontal, Wallet, X } from "lucide-react";

import { OPCOES_ORDENACAO, temFiltroAtivo } from "../../utils/Gastosutils";
import { TIPO_RECEITA, VISOES } from "../../utils/Movimentacoesutils";
import IconeGasto from "../Gastos/IconeCategoria";
import IconeReceita from "../Receitas/IconeCategoria";
import SeletorOpcoes from "../SeletorOpcoes/SeletorOpcoes";
import { opcoesDeConta } from "../SeletorOpcoes/opcoes";
import g from "../../pages/Gastos/Gastos.module.css";
import styles from "../../pages/Movimentacoes/Movimentacoes.module.css";

// Ícone de uma categoria do filtro, a partir da biblioteca do tipo dela.
function iconeDaCategoria({ nome, tipo }) {
  const Icone = tipo === TIPO_RECEITA ? IconeReceita : IconeGasto;
  return <Icone categoria={nome} tamanho={16} />;
}

const CHIPS = [
  { valor: VISOES.tudo, rotulo: "Tudo" },
  { valor: VISOES.entradas, rotulo: "Entradas" },
  { valor: VISOES.saidas, rotulo: "Saídas" },
];

/**
 * Chips Tudo/Entradas/Saídas + busca sempre visíveis. Categoria, carteira,
 * período e ordenação (os mesmos filtros das páginas antigas) ficam no
 * painel "Filtros".
 */
export default function FiltrosMovimentacoes({
  visao,
  onVisao,
  filtros,
  onAlterar,
  onLimpar,
  ordenacao,
  onOrdenar,
  mesSelecionado,
  diasDoMes,
  carteiras = [],
  categorias = [],
  avancadosAbertos,
  onAlternarAvancados,
}) {
  const id = useId();
  const primeiroDia = `${mesSelecionado}-01`;
  const ultimoDia = `${mesSelecionado}-${String(diasDoMes).padStart(2, "0")}`;

  // Quantos filtros do painel estão ligados (a busca fica de fora: está sempre à vista)
  const avancadosAtivos = ["categoria", "carteira", "de", "ate"].filter(
    (campo) => filtros[campo] !== "",
  ).length;

  function alterar(event) {
    onAlterar({ ...filtros, [event.target.name]: event.target.value });
  }

  return (
    <div role="search" aria-label="Filtrar movimentações">
      <div className={styles.ferramentas}>
        <div className={styles.chips} role="group" aria-label="Tipo de movimentação">
          {CHIPS.map((chip) => (
            <button
              key={chip.valor}
              type="button"
              className={`${styles.chip} ${visao === chip.valor ? styles["chip-ativo"] : ""}`}
              aria-pressed={visao === chip.valor}
              onClick={() => onVisao(chip.valor)}
            >
              {chip.rotulo}
            </button>
          ))}
        </div>

        <div className={`${g["gastos-busca-campo"]} ${styles.busca}`}>
          <Search size={16} aria-hidden="true" />
          <label className={g["gastos-sr-only"]} htmlFor={`${id}-busca`}>
            Buscar
          </label>
          <input
            id={`${id}-busca`}
            name="busca"
            type="search"
            className="form-input"
            placeholder="Buscar…"
            value={filtros.busca}
            onChange={alterar}
            autoComplete="off"
          />
        </div>

        <button
          type="button"
          className={`btn btn-secundario ${styles["botao-filtros"]}`}
          aria-expanded={avancadosAbertos}
          aria-controls={`${id}-avancados`}
          onClick={onAlternarAvancados}
        >
          <SlidersHorizontal size={16} aria-hidden="true" />
          Filtros
          {avancadosAtivos > 0 && <span className={g["gastos-contagem"]}>{avancadosAtivos}</span>}
        </button>

        {temFiltroAtivo(filtros) && (
          <button type="button" className={`btn btn-secundario ${styles["botao-filtros"]}`} onClick={onLimpar}>
            <X size={16} aria-hidden="true" />
            Limpar
          </button>
        )}
      </div>

      {avancadosAbertos && (
        <div id={`${id}-avancados`} className={`${g["gastos-filtros"]} ${styles.avancados}`}>
          <div className="form-group">
            <label className="form-label" htmlFor={`${id}-categoria`}>
              Categoria
            </label>
            <SeletorOpcoes
              id={`${id}-categoria`}
              valor={filtros.categoria}
              opcoes={[
                { valor: "", rotulo: "Todas", icone: <LayoutGrid size={16} aria-hidden="true" /> },
                ...categorias.map((categoria) => ({
                  valor: categoria.nome,
                  rotulo: categoria.nome,
                  icone: iconeDaCategoria(categoria),
                })),
              ]}
              onAlterar={(categoria) => onAlterar({ ...filtros, categoria })}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor={`${id}-carteira`}>
              Carteira
            </label>
            <SeletorOpcoes
              id={`${id}-carteira`}
              valor={filtros.carteira}
              opcoes={[
                { valor: "", rotulo: "Todas", icone: <Wallet size={16} aria-hidden="true" /> },
                ...opcoesDeConta(carteiras),
              ]}
              onAlterar={(carteira) => onAlterar({ ...filtros, carteira })}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor={`${id}-de`}>
              De
            </label>
            <input
              id={`${id}-de`}
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
            <label className="form-label" htmlFor={`${id}-ate`}>
              Até
            </label>
            <input
              id={`${id}-ate`}
              name="ate"
              type="date"
              className="form-input"
              min={filtros.de || primeiroDia}
              max={ultimoDia}
              value={filtros.ate}
              onChange={alterar}
            />
          </div>

          <div className={`form-group ${styles["filtro-ordenar"]}`}>
            <label className="form-label" htmlFor={`${id}-ordenar`}>
              Ordenar por
            </label>
            <SeletorOpcoes
              id={`${id}-ordenar`}
              valor={`${ordenacao.campo}:${ordenacao.direcao}`}
              opcoes={OPCOES_ORDENACAO.map((opcao) => ({
                valor: opcao.valor,
                rotulo: opcao.rotulo,
                icone: <ArrowUpDown size={16} aria-hidden="true" />,
              }))}
              onAlterar={(valor) => {
                const [campo, direcao] = valor.split(":");
                onOrdenar({ campo, direcao });
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
