import { useState, useEffect } from "react";
import { Plus, CreditCard, Landmark, Coins } from "lucide-react";

import CarteiraVisual from "../../components/CarteiraVisual/CarteiraVisual";
import CarteiraFisica from "../../components/CarteiraFisica/CarteiraFisica";
import PainelDetalhes from "../../components/PainelDetalhes/PainelDetalhes";
import ModalAdicionar from "../../components/ModalAdicionar/ModalAdicionar";

import {
  contas as contasMock,
  cartoes as cartoesMock,
  dinheiroEReservas as dinheiroEReservasMock,
  movimentacoesPorItem,
  formatarBRL,
} from "./carteirasMock";

import styles from "./Carteiras.module.css";

// Persistência simples em localStorage (sem backend nesta etapa).
const CHAVE_STORAGE = "meubolso:carteira";

function carregarPersistido() {
  try {
    const bruto = localStorage.getItem(CHAVE_STORAGE);
    if (!bruto) return null;
    const dados = JSON.parse(bruto);
    // só aceita se tiver as três listas no formato esperado
    if (
      Array.isArray(dados?.cartoes) &&
      Array.isArray(dados?.contas) &&
      Array.isArray(dados?.dinheiroEReservas)
    ) {
      return dados;
    }
    return null;
  } catch {
    return null;
  }
}

function Carteiras() {
  const [itemSelecionado, setItemSelecionado] = useState(null);
  const [modalAberto, setModalAberto] = useState(false);

  // Listas em estado. Na primeira carga, usa o que estiver salvo no
  // localStorage; caso contrário, parte dos dados fictícios.
  const persistido = carregarPersistido();
  const [cartoes, setCartoes] = useState(persistido?.cartoes ?? cartoesMock);
  const [contas, setContas] = useState(persistido?.contas ?? contasMock);
  const [dinheiroEReservas, setDinheiroEReservas] = useState(
    persistido?.dinheiroEReservas ?? dinheiroEReservasMock
  );

  // Salva as listas sempre que mudarem (edição, exclusão, inclusão).
  useEffect(() => {
    try {
      localStorage.setItem(
        CHAVE_STORAGE,
        JSON.stringify({ cartoes, contas, dinheiroEReservas })
      );
    } catch {
      // armazenamento indisponível: segue apenas em memória
    }
  }, [cartoes, contas, dinheiroEReservas]);

  // Resumo recalculado a partir do estado atual.
  const saldoContas =
    contas.reduce((acc, c) => acc + (c.saldo || 0), 0) +
    dinheiroEReservas
      .filter((i) => i.tipo === "dinheiro")
      .reduce((acc, d) => acc + (d.saldo || 0), 0);

  const faturasCartoes = cartoes
    .filter((c) => c.subtipo === "credito")
    .reduce((acc, c) => acc + (c.faturaAtual || 0), 0);

  // Item em edição (null = modal em modo "adicionar").
  const [itemEditando, setItemEditando] = useState(null);

  function setListaPorTipo(tipo, atualizador) {
    if (tipo === "cartao") setCartoes(atualizador);
    else if (tipo === "conta") setContas(atualizador);
    else setDinheiroEReservas(atualizador); // dinheiro e reserva
  }

  function salvarItem(dados) {
    if (dados.id) {
      // edição: substitui o item existente
      setListaPorTipo(dados.tipo, (lista) =>
        lista.map((i) => (i.id === dados.id ? { ...i, ...dados } : i))
      );
      // mantém o painel refletindo o item editado
      setItemSelecionado((atual) =>
        atual && atual.id === dados.id ? { ...atual, ...dados } : atual
      );
    } else {
      // novo item
      const item = { ...dados, id: `${dados.tipo}-${Date.now()}` };
      setListaPorTipo(dados.tipo, (lista) => [...lista, item]);
    }
    setItemEditando(null);
  }

  // Remove o vínculo contaId de itens que apontavam para uma conta excluída,
  // preservando todos os demais campos.
  function desvincularConta(contaId, lista) {
    return lista.map((i) => {
      if (i.contaId !== contaId) return i;
      const copia = { ...i };
      delete copia.contaId;
      return copia;
    });
  }

  function excluirItem(item) {
    setListaPorTipo(item.tipo, (lista) => lista.filter((i) => i.id !== item.id));

    // Ao excluir uma conta, limpa vínculos órfãos em cartões e reservas.
    if (item.tipo === "conta") {
      setCartoes((lista) => desvincularConta(item.id, lista));
      setDinheiroEReservas((lista) => desvincularConta(item.id, lista));
    }

    setItemSelecionado(null);
  }

  function abrirEdicao(item) {
    setItemEditando(item);
    setModalAberto(true);
  }

  // Conta associada ao item selecionado (cartão/reserva), quando houver.
  const contaAssociada =
    itemSelecionado?.contaId
      ? contas.find((c) => c.id === itemSelecionado.contaId) || null
      : null;

  const movimentacoes = itemSelecionado
    ? movimentacoesPorItem[itemSelecionado.id] || []
    : [];

  return (
    <div className={styles.carteiras}>
      {/* Cabeçalho */}
      <div className={styles.topo}>
        <div>
          <h1>Carteira</h1>
          <p className="texto-secundario">
            Veja onde seu dinheiro está: cartões, contas, dinheiro em espécie e
            reservas, tudo em um só lugar.
          </p>
        </div>

        <button
          className={styles.botaoAdicionar}
          type="button"
          onClick={() => {
            setItemEditando(null);
            setModalAberto(true);
          }}
        >
          <Plus size={18} />
          Adicionar
        </button>
      </div>

      {/* Resumo financeiro */}
      <div className={styles.resumo}>
        <div className={`card ${styles.cardResumo}`}>
          <span className={styles.resumoRotulo}>Saldo nas contas</span>
          <strong className={styles.resumoValor}>
            {formatarBRL(saldoContas)}
          </strong>
          <span className="texto-secundario">Contas e dinheiro físico</span>
        </div>

        <div className={`card ${styles.cardResumo}`}>
          <span className={styles.resumoRotulo}>Faturas dos cartões</span>
          <strong className={styles.resumoValor}>
            {formatarBRL(faturasCartoes)}
          </strong>
          <span className="texto-secundario">Cartões de crédito em aberto</span>
        </div>
      </div>

      {/* Seção: Cartões — porta-cartões físico (SVG) com cartões HTML */}
      <section className={styles.secao}>
        <div className={styles.secaoTopo}>
          <CreditCard size={18} />
          <h2>Sua carteira</h2>
        </div>

        {cartoes.length === 0 ? (
          <div className={`card ${styles.vazio}`}>
            <p className="texto-secundario">Nenhum cartão cadastrado.</p>
          </div>
        ) : (
          <CarteiraFisica
            manterAberta={cartoes.some((c) => c.id === itemSelecionado?.id)}
          >
            {cartoes.map((item) => (
              <ItemCarteira
                key={item.id}
                item={item}
                selecionado={itemSelecionado?.id === item.id}
                onSelecionar={() => setItemSelecionado(item)}
                semRodape
              />
            ))}
          </CarteiraFisica>
        )}
      </section>

      {/* Seção: Contas */}
      <Secao titulo="Contas" icone={Landmark} vazio="Nenhuma conta cadastrada.">
        {contas.map((item) => (
          <ItemCarteira
            key={item.id}
            item={item}
            selecionado={itemSelecionado?.id === item.id}
            onSelecionar={() => setItemSelecionado(item)}
          />
        ))}
      </Secao>

      {/* Seção: Dinheiro e reservas */}
      <Secao
        titulo="Dinheiro e reservas"
        icone={Coins}
        vazio="Nenhum dinheiro ou reserva cadastrado."
      >
        {dinheiroEReservas.map((item) => (
          <ItemCarteira
            key={item.id}
            item={item}
            selecionado={itemSelecionado?.id === item.id}
            onSelecionar={() => setItemSelecionado(item)}
          />
        ))}
      </Secao>

      {/* Painel lateral de detalhes */}
      <PainelDetalhes
        item={itemSelecionado}
        movimentacoes={movimentacoes}
        contaAssociada={contaAssociada}
        onFechar={() => setItemSelecionado(null)}
        onVerMovimentacoes={() => {
          // Depende da página de movimentações com filtro por item (futuro).
        }}
        onEditar={() => abrirEdicao(itemSelecionado)}
        onExcluir={() => excluirItem(itemSelecionado)}
      />

      {/* Modal de adicionar / editar.
          A key remonta o modal ao alternar entre adicionar e editar,
          garantindo o estado inicial correto dos campos. */}
      <ModalAdicionar
        key={itemEditando ? `editar-${itemEditando.id}` : "adicionar"}
        aberto={modalAberto}
        onFechar={() => {
          setModalAberto(false);
          setItemEditando(null);
        }}
        onSalvar={salvarItem}
        contas={contas}
        itemEditando={itemEditando}
      />
    </div>
  );
}

/** Seção com título e grade de itens; mostra estado vazio quando não há filhos. */
function Secao({ titulo, icone: Icone, vazio, children }) {
  const temItens = Array.isArray(children)
    ? children.length > 0
    : Boolean(children);

  return (
    <section className={styles.secao}>
      <div className={styles.secaoTopo}>
        {Icone ? <Icone size={18} /> : null}
        <h2>{titulo}</h2>
      </div>

      {temItens ? (
        <div className={styles.grade}>{children}</div>
      ) : (
        <div className={`card ${styles.vazio}`}>
          <p className="texto-secundario">{vazio}</p>
        </div>
      )}
    </section>
  );
}

/** Item clicável da carteira: representação visual + rótulo e saldo.
 *  `semRodape` oculta o texto abaixo (usado dentro do corpo da carteira). */
function ItemCarteira({ item, selecionado, onSelecionar, semRodape = false }) {
  const valorRodape =
    item.tipo === "reserva"
      ? formatarBRL(item.valorReservado)
      : item.subtipo === "credito"
      ? `Fatura ${formatarBRL(item.faturaAtual)}`
      : item.saldo != null
      ? formatarBRL(item.saldo)
      : "";

  return (
    <div
      className={`${styles.item} ${selecionado ? styles.itemSelecionado : ""}`}
      role="button"
      tabIndex={0}
      onClick={(e) => {
        // evita que o clique no cartão alterne a abertura da carteira
        e.stopPropagation();
        onSelecionar();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelecionar();
        }
      }}
      aria-label={`Abrir detalhes de ${item.apelido}`}
    >
      <CarteiraVisual
        tipo={item.tipo}
        apelido={item.apelido}
        instituicao={item.instituicao}
        bandeira={item.bandeira}
        tema={item.tema}
        ultimosDigitos={item.ultimosDigitos}
        validade={item.validade}
        valor={formatarBRL(item.saldo)}
      />

      {!semRodape && (
        <div className={styles.itemRodape}>
          <span className={styles.itemNome}>{item.apelido}</span>
          {valorRodape ? (
            <span className={styles.itemValor}>{valorRodape}</span>
          ) : null}
        </div>
      )}
    </div>
  );
}

export default Carteiras;
