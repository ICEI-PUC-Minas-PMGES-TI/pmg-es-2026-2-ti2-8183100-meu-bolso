import { useState, useEffect } from "react";
import {
  Plus,
  CreditCard,
  Landmark,
  Coins,
  ChevronRight,
  PiggyBank,
} from "lucide-react";

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

import { bancoDe } from "../../data/bancos";

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
  // Quando preenchido, o modal abre direto no formulário desse tipo
  // (ex.: botão "Adicionar" exclusivo de cartões na seção da carteira).
  const [tipoAdicionar, setTipoAdicionar] = useState(null);

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
          <span className={styles.rotulo}>CARTEIRA</span>
          <h1>Seu dinheiro, no seu controle.</h1>
          <p className="texto-secundario">
            Acompanhe suas finanças, organize seus objetivos e construa o futuro
            que você quer.
          </p>
        </div>

      </div>

      {/* Área principal em duas colunas:
          esquerda = carteira física | direita = resumos + contas */}
      <div className={styles.areaPrincipal}>
      {/* Coluna esquerda: a carteira física */}
      {/* Seção: Cartões — porta-cartões físico (SVG) com cartões HTML */}
      <section className={`${styles.secao} ${styles.secaoCarteira}`}>
        <div className={styles.secaoTopo}>
          <div className={styles.secaoTitulo}>
            <CreditCard size={18} />
            <h2>Sua carteira</h2>
            <span className={styles.contador}>
              {cartoes.length} {cartoes.length === 1 ? "cartão" : "cartões"}
            </span>
          </div>

          <button
            className={styles.botaoAdicionarCartao}
            type="button"
            onClick={() => {
              setItemEditando(null);
              setTipoAdicionar("cartao");
              setModalAberto(true);
            }}
          >
            <Plus size={16} />
            Adicionar
          </button>
        </div>

        {cartoes.length === 0 ? (
          <div className={`card ${styles.vazio}`}>
            <p className="texto-secundario">Nenhum cartão cadastrado.</p>
          </div>
        ) : (
          <CarteiraFisica
            manterAberta={cartoes.some((c) => c.id === itemSelecionado?.id)}
            indiceSelecionado={cartoes.findIndex((c) => c.id === itemSelecionado?.id)}
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

        {cartoes.length > 0 && (
          <p className={styles.carteiraLegenda}>
            Seus cartões, contas e reservas em um só lugar.
          </p>
        )}
      </section>

      {/* Coluna direita: resumos financeiros + seção Contas */}
      <div className={styles.colunaDireita}>
        {/* Resumo financeiro */}
        <div className={styles.resumo}>
          <div className={`card ${styles.cardResumo}`}>
            <span className={styles.resumoIcone}>
              <Coins size={22} />
            </span>
            <div className={styles.resumoInfo}>
              <span className={styles.resumoRotulo}>Saldo nas contas</span>
              <strong className={styles.resumoValor}>
                {formatarBRL(saldoContas)}
              </strong>
              <span className="texto-secundario">Contas e dinheiro físico</span>
            </div>
            <ChevronRight size={18} className={styles.resumoSeta} />
          </div>

          <div className={`card ${styles.cardResumo}`}>
            <span className={styles.resumoIcone}>
              <CreditCard size={22} />
            </span>
            <div className={styles.resumoInfo}>
              <span className={styles.resumoRotulo}>Faturas dos cartões</span>
              <strong className={styles.resumoValor}>
                {formatarBRL(faturasCartoes)}
              </strong>
              <span className="texto-secundario">
                Cartões de crédito em aberto
              </span>
            </div>
            <ChevronRight size={18} className={styles.resumoSeta} />
          </div>
        </div>

        {/* Seção: Contas */}
        <Secao
          titulo="Contas"
          icone={Landmark}
          vazio="Nenhuma conta cadastrada."
          className={styles.secaoContas}
          acao={
            <span className={styles.verTodas}>
              Ver todas <ChevronRight size={14} />
            </span>
          }
        >
          {contas.map((item, i) => (
            <CardConta
              key={item.id}
              item={item}
              posicao={i}
              selecionado={itemSelecionado?.id === item.id}
              onSelecionar={() => setItemSelecionado(item)}
            />
          ))}
          <CardAdicionarConta
            onClick={() => {
              setItemEditando(null);
              setTipoAdicionar("conta");
              setModalAberto(true);
            }}
          />
        </Secao>

        {/* Seção: Dinheiro e reservas (abaixo de Contas, na coluna direita) */}
        <Secao
          titulo="Dinheiro e reservas"
          icone={Coins}
          vazio="Nenhum dinheiro ou reserva cadastrado."
          className={styles.secaoDinheiro}
        >
          {dinheiroEReservas.map((item) =>
            item.tipo === "reserva" ? (
              <CardConta
                key={item.id}
                item={item}
                selecionado={itemSelecionado?.id === item.id}
                onSelecionar={() => setItemSelecionado(item)}
              />
            ) : (
              <ItemCarteira
                key={item.id}
                item={item}
                selecionado={itemSelecionado?.id === item.id}
                onSelecionar={() => setItemSelecionado(item)}
                semRodape
              />
            )
          )}
        </Secao>
      </div>
      </div>

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
        key={
          itemEditando
            ? `editar-${itemEditando.id}`
            : `adicionar-${tipoAdicionar ?? "geral"}`
        }
        aberto={modalAberto}
        onFechar={() => {
          setModalAberto(false);
          setItemEditando(null);
          setTipoAdicionar(null);
        }}
        onSalvar={salvarItem}
        contas={contas}
        itemEditando={itemEditando}
        tipoInicial={tipoAdicionar}
      />
    </div>
  );
}

/** Seção com título e grade de itens; mostra estado vazio quando não há filhos. */
function Secao({ titulo, icone: Icone, vazio, children, className = "", acao = null }) {
  const temItens = Array.isArray(children)
    ? children.length > 0
    : Boolean(children);

  return (
    <section className={`${styles.secao} ${className}`}>
      <div className={styles.secaoTopo}>
        <div className={styles.secaoTitulo}>
          {Icone ? <Icone size={18} /> : null}
          <h2>{titulo}</h2>
        </div>
        {acao}
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

/** Normaliza o nome/banco da conta para a chave do mapa de bancos.
 *  Ex.: "Banco Inter" -> "inter", "Nubank" -> "nubank". */
function chaveBanco(item) {
  const base = item.banco || item.apelido || item.instituicao || "";
  return base
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .replace(/^banco\s+/, "") // tira "banco " inicial
    .replace(/\s+/g, ""); // remove espaços
}

/** Última movimentação (a lista do mock já vem com a mais recente primeiro). */
function ultimaMovimentacao(id) {
  const lista = movimentacoesPorItem[id];
  return Array.isArray(lista) && lista.length ? lista[0] : null;
}

/**
 * Card de conta/reserva no padrão da referência:
 * logo/ícone circular, nome, subtítulo, valor dentro, seta e rodapé
 * com a última movimentação. Apenas apresentação; não altera dados.
 */
function CardConta({ item, posicao, selecionado, onSelecionar }) {
  const ehReserva = item.tipo === "reserva";
  const banco = ehReserva ? null : bancoDe(chaveBanco(item));
  const nomeExibido = item.apelido || item.nome || banco?.nome || "Conta";

  const subtitulo = ehReserva
    ? "Reserva guardada"
    : posicao === 0
    ? "Conta principal"
    : "Conta secundária";

  const valor = ehReserva
    ? formatarBRL(item.valorReservado)
    : formatarBRL(item.saldo);

  const mov = ultimaMovimentacao(item.id);

  return (
    <div
      className={`${styles.contaCard} ${selecionado ? styles.contaCardSel : ""}`}
      role="button"
      tabIndex={0}
      onClick={onSelecionar}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelecionar();
        }
      }}
      aria-label={`Abrir detalhes de ${nomeExibido}`}
    >
      {banco ? (
        <span
          className={styles.contaFaixa}
          style={{ backgroundColor: banco.cor }}
          aria-hidden="true"
        />
      ) : null}

      <div className={styles.contaTopo}>
        {ehReserva ? (
          <span className={styles.contaIcone}>
            <PiggyBank size={22} />
          </span>
        ) : (
          <span
            className={styles.contaLogo}
            style={{ backgroundColor: `${banco.cor}1A` }}
          >
            <img
              src={banco.logo}
              alt={banco.nome}
              className={styles.contaLogoImg}
              onError={(e) => {
                if (!e.currentTarget.dataset.fallback) {
                  e.currentTarget.dataset.fallback = "1";
                  e.currentTarget.src = "/bancos/padrao.png";
                }
              }}
            />
          </span>
        )}
        <ChevronRight size={18} className={styles.contaSeta} />
      </div>

      <div className={styles.contaInfo}>
        <strong className={styles.contaNome}>{nomeExibido}</strong>
        <span className={styles.contaSub}>{subtitulo}</span>
        <strong className={styles.contaValor}>{valor}</strong>
      </div>

      {mov ? (
        <div className={styles.contaRodape}>
          <span className={styles.contaRodapeTexto}>
            Última movimentação
            <br />
            {mov.data} · {mov.entrada ? "Entrada" : "Saída"}
          </span>
          <ChevronRight size={16} className={styles.contaSeta} />
        </div>
      ) : null}
    </div>
  );
}

/** Card "Adicionar conta" no padrão da referência. */
function CardAdicionarConta({ onClick }) {
  return (
    <button
      type="button"
      className={`${styles.contaCard} ${styles.contaAdicionar}`}
      onClick={onClick}
    >
      <div className={styles.contaTopo}>
        <span className={styles.contaIcone}>
          <Plus size={22} />
        </span>
        <ChevronRight size={18} className={styles.contaSeta} />
      </div>
      <div className={styles.contaInfo}>
        <strong className={styles.contaNome}>Adicionar conta</strong>
        <span className={styles.contaSub}>Conecte outro banco</span>
      </div>
    </button>
  );
}

export default Carteiras;
