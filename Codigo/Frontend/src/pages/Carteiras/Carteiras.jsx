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
import PainelContas from "../../components/PainelContas/PainelContas";
import ModalAdicionar from "../../components/ModalAdicionar/ModalAdicionar";
import ModalCedulas from "../../components/ModalCedulas/ModalCedulas";

import {
  contas as contasMock,
  cartoes as cartoesMock,
  dinheiroEReservas as dinheiroEReservasMock,
  movimentacoesPorItem,
  formatarBRL,
} from "./carteirasMock";

import { BANCOS, bancoDe, chaveDoBanco, FUNDO_LOGO } from "../../data/bancos";
import { posicaoEfetiva, ORDEM_POSICAO } from "../../data/posicaoContas";
import {
  normalizarDinheiro,
  saldoDaContagem,
  totalCentavos,
} from "../../data/denominacoes";
import { obterCarteiras, salvarCarteiras } from "../../service/Api";

import styles from "./Carteiras.module.css";

// Normaliza a lista de dinheiro/reservas (itens de dinheiro ganham contagem/saldo).
function normalizarListaDinheiro(lista) {
  return (lista ?? []).map((item) =>
    item.tipo === "dinheiro" ? normalizarDinheiro(item) : item
  );
}

function Carteiras() {
  const [itemSelecionado, setItemSelecionado] = useState(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [painelContasAberto, setPainelContasAberto] = useState(false);
  // Quando preenchido, o modal abre direto no formulário desse tipo
  // (ex.: botão "Adicionar" exclusivo de cartões na seção da carteira).
  const [tipoAdicionar, setTipoAdicionar] = useState(null);

  // Estado inicial = dados fictícios; substituídos pela carteira do usuário
  // assim que a API responde.
  const [cartoes, setCartoes] = useState(cartoesMock);
  const [contas, setContas] = useState(contasMock);
  const [dinheiroEReservas, setDinheiroEReservas] = useState(() =>
    normalizarListaDinheiro(dinheiroEReservasMock)
  );

  // Controle de carga/salvamento com a API.
  const [carregado, setCarregado] = useState(false);
  const [erroSalvar, setErroSalvar] = useState(false);

  // Carrega a carteira do usuário na montagem. Se vierem listas com itens,
  // aplica-as (normalizando o dinheiro); se vierem vazias, mantém os mocks.
  // Em qualquer caso (inclusive erro) marca carregado=true.
  useEffect(() => {
    let ativo = true;
    obterCarteiras()
      .then((dados) => {
        if (!ativo || !dados) return;
        if (Array.isArray(dados.cartoes) && dados.cartoes.length > 0) {
          setCartoes(dados.cartoes);
        }
        if (Array.isArray(dados.contas) && dados.contas.length > 0) {
          setContas(dados.contas);
        }
        if (
          Array.isArray(dados.dinheiroEReservas) &&
          dados.dinheiroEReservas.length > 0
        ) {
          setDinheiroEReservas(normalizarListaDinheiro(dados.dinheiroEReservas));
        }
        if (Array.isArray(dados.movsDinheiro) && dados.movsDinheiro.length > 0) {
          setMovsDinheiro(dados.movsDinheiro);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (ativo) setCarregado(true);
      });
    return () => {
      ativo = false;
    };
  }, []);

  // Salva as listas na API quando mudarem, com debounce de 800ms.
  // Só roda depois que a carga inicial terminou (carregado=true).
  useEffect(() => {
    if (!carregado) return;
    const id = setTimeout(() => {
      salvarCarteiras({ cartoes, contas, dinheiroEReservas, movsDinheiro })
        .then(() => setErroSalvar(false))
        .catch(() => setErroSalvar(true));
    }, 800);
    return () => clearTimeout(id);
  }, [carregado, cartoes, contas, dinheiroEReservas, movsDinheiro]);

  // Resumo recalculado a partir do estado atual.
  const saldoContas =
    contas.reduce((acc, c) => acc + (c.saldo || 0), 0) +
    dinheiroEReservas
      .filter((i) => i.tipo === "dinheiro")
      .reduce((acc, d) => acc + (d.saldo || 0), 0);

  const faturasCartoes = cartoes
    .filter((c) => c.subtipo === "credito")
    .reduce((acc, c) => acc + (c.faturaAtual || 0), 0);

  // Contas em destaque (principal, secundária, terciária) pela posição efetiva:
  // posições livres são preenchidas pelas contas sem posição salva.
  const contasEfetivas = posicaoEfetiva(contas);
  const contasDestaque = ORDEM_POSICAO.map((p) =>
    contasEfetivas.find((c) => c.posicaoEfetiva === p)
  ).filter(Boolean);

  // Item em edição (null = modal em modo "adicionar").
  const [itemEditando, setItemEditando] = useState(null);

  // Movimentações do dinheiro em espécie (começam com as do mock e crescem
  // a cada adicionar/retirar). Só o dinheiro precisa ser dinâmico aqui.
  const [movsDinheiro, setMovsDinheiro] = useState(
    () => movimentacoesPorItem["dinheiro-especie"] || []
  );

  // Modal de cédulas/moedas: { modo, item } ou null.
  const [modalCedulas, setModalCedulas] = useState(null);

  // Aplica uma contagem escolhida no modal ao item de dinheiro, somando
  // (adicionar) ou subtraindo (retirar) por denominação, e registra a
  // movimentação no extrato. Tudo em centavos inteiros.
  function confirmarCedulas(item, modo, escolhida) {
    const entrada = modo === "adicionar";
    const valor = saldoDaContagem(escolhida);
    if (totalCentavos(escolhida) === 0) return;

    setDinheiroEReservas((lista) =>
      lista.map((i) => {
        if (i.id !== item.id) return i;
        const atual = i.contagem || {};
        const nova = { ...atual };
        for (const chave of Object.keys(escolhida)) {
          const base = Number(nova[chave]) || 0;
          const delta = Number(escolhida[chave]) || 0;
          nova[chave] = entrada ? base + delta : Math.max(0, base - delta);
        }
        return { ...i, contagem: nova, saldo: saldoDaContagem(nova) };
      })
    );

    const mov = {
      id: Date.now(),
      descricao: entrada ? "Entrada em dinheiro" : "Retirada em dinheiro",
      categoria: "Dinheiro",
      data: new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
      valor: entrada ? valor : -valor,
      entrada,
    };
    setMovsDinheiro((lista) => [mov, ...lista]);
  }

  function setListaPorTipo(tipo, atualizador) {
    if (tipo === "cartao") setCartoes(atualizador);
    else if (tipo === "conta") setContas(atualizador);
    else setDinheiroEReservas(atualizador); // dinheiro e reserva
  }

  // Troca de posição: a conta `alvoId` passa a ocupar `novaPosicao`. Quem já
  // ocupava essa posição (pela posição efetiva) assume a posição anterior da
  // conta alvo (ou null). Persiste a posição efetiva de todas as contas para
  // que nunca haja duas iguais e as demais não percam o destaque.
  function reatribuirPosicoes(lista, alvoId, novaPosicao) {
    const efetivas = posicaoEfetiva(lista);
    const alvo = efetivas.find((c) => c.id === alvoId);
    const posAnterior = alvo?.posicaoEfetiva ?? null;
    const ocupante =
      novaPosicao &&
      efetivas.find((c) => c.id !== alvoId && c.posicaoEfetiva === novaPosicao);

    return efetivas.map((c) => {
      const resto = { ...c };
      delete resto.posicaoEfetiva;
      if (c.id === alvoId) resto.posicao = novaPosicao || null;
      else if (ocupante && c.id === ocupante.id) resto.posicao = posAnterior;
      return resto;
    });
  }

  function salvarItem(dados) {
    if (dados.id) {
      setListaPorTipo(dados.tipo, (lista) => {
        let nova = lista.map((i) => (i.id === dados.id ? { ...i, ...dados } : i));
        if (dados.tipo === "conta") {
          nova = reatribuirPosicoes(nova, dados.id, dados.posicao);
        }
        return nova;
      });
      setItemSelecionado((atual) =>
        atual && atual.id === dados.id ? { ...atual, ...dados } : atual
      );
    } else {
      const item = { ...dados, id: `${dados.tipo}-${Date.now()}` };
      setListaPorTipo(dados.tipo, (lista) => {
        const base = [...lista, item];
        return dados.tipo === "conta"
          ? reatribuirPosicoes(base, item.id, item.posicao)
          : base;
      });
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

  // Item de dinheiro sempre na versão mais recente do estado (saldo/contagem).
  const dinheiroAtual =
    itemSelecionado?.tipo === "dinheiro"
      ? dinheiroEReservas.find((i) => i.id === itemSelecionado.id) || itemSelecionado
      : null;

  const itemPainel = dinheiroAtual ?? itemSelecionado;

  const movimentacoes = !itemSelecionado
    ? []
    : itemSelecionado.tipo === "dinheiro"
    ? movsDinheiro
    : movimentacoesPorItem[itemSelecionado.id] || [];

  if (!carregado) {
    return (
      <div className={styles.carteiras}>
        <p className="texto-secundario">Carregando carteira...</p>
      </div>
    );
  }

  return (
    <div className={styles.carteiras}>
      {erroSalvar && (
        <p className="texto-secundario" role="alert">
          Não foi possível salvar. Tentando novamente na próxima alteração.
        </p>
      )}
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

      <div className={styles.colunaDireita}>
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

        <Secao
          titulo="Contas"
          icone={Landmark}
          vazio="Nenhuma conta cadastrada."
          className={styles.secaoContas}
          acao={
            <span
              className={styles.verTodas}
              role="button"
              tabIndex={0}
              onClick={() => setPainelContasAberto(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setPainelContasAberto(true);
                }
              }}
            >
              Ver todas <ChevronRight size={14} />
            </span>
          }
        >
          {contasDestaque.map((item) => (
            <CardConta
              key={item.id}
              item={item}
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

        {/* Seção: Dinheiro (em espécie) */}
        <Secao
          titulo="Dinheiro"
          icone={Coins}
          vazio="Nenhum dinheiro cadastrado."
          className={styles.secaoDinheiro}
        >
          {dinheiroEReservas
            .filter((item) => item.tipo === "dinheiro")
            .map((item) => (
              <CardDinheiro
                key={item.id}
                item={item}
                onAdicionar={() => setModalCedulas({ modo: "adicionar", item })}
                onRetirar={() => setModalCedulas({ modo: "retirar", item })}
              />
            ))}
        </Secao>
      </div>
      </div>

      <PainelDetalhes
        item={itemPainel}
        movimentacoes={movimentacoes}
        contaAssociada={contaAssociada}
        onFechar={() => setItemSelecionado(null)}
        onVerMovimentacoes={() => {
          // Depende da página de movimentações com filtro por item (futuro).
        }}
        onEditar={() => abrirEdicao(itemSelecionado)}
        onExcluir={() => excluirItem(itemSelecionado)}
      />

      <PainelContas
        aberto={painelContasAberto}
        contas={contas}
        onFechar={() => setPainelContasAberto(false)}
        onEditar={(conta) => {
          setPainelContasAberto(false);
          abrirEdicao(conta);
        }}
        onAdicionar={() => {
          setPainelContasAberto(false);
          setItemEditando(null);
          setTipoAdicionar("conta");
          setModalAberto(true);
        }}
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

      <ModalCedulas
        key={modalCedulas ? `${modalCedulas.modo}-${modalCedulas.item.id}` : "cedulas"}
        aberto={Boolean(modalCedulas)}
        modo={modalCedulas?.modo}
        disponivel={
          modalCedulas
            ? dinheiroEReservas.find((i) => i.id === modalCedulas.item.id)?.contagem || {}
            : {}
        }
        onFechar={() => setModalCedulas(null)}
        onConfirmar={(escolhida) =>
          confirmarCedulas(modalCedulas.item, modalCedulas.modo, escolhida)
        }
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
        banco={item.banco}
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
  // conta.banco salvo e válido tem prioridade; senão deduz do texto (contas antigas)
  if (item.banco && BANCOS[item.banco]) return item.banco;
  return chaveDoBanco(item.instituicao || item.apelido);
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
function CardConta({ item, selecionado, onSelecionar }) {
  const ehReserva = item.tipo === "reserva";
  const chave = ehReserva ? null : chaveBanco(item);
  const banco = ehReserva ? null : bancoDe(chave);
  const nomeExibido = item.apelido || item.nome || banco?.nome || "Conta";

  // Fundo do círculo da logo: exceções de contraste (BTG, Caixa) ou tom da cor.
  const fundoLogo = chave ? FUNDO_LOGO[chave] : null;
  const estiloLogoCirculo = fundoLogo
    ? {
        backgroundColor: fundoLogo.fundo,
        ...(fundoLogo.anel
          ? { boxShadow: `inset 0 0 0 1.5px ${fundoLogo.anel}` }
          : {}),
      }
    : { backgroundColor: `${banco?.cor}1A` };

  const rotuloPosicao = {
    principal: "Conta principal",
    secundaria: "Conta secundária",
    terciaria: "Conta terciária",
  };
  const subtitulo = ehReserva
    ? "Reserva guardada"
    : rotuloPosicao[item.posicaoEfetiva ?? item.posicao] || "Conta";

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
            style={estiloLogoCirculo}
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

/**
 * Card "Dinheiro na carteira" (visual escuro, largura total da seção).
 * Os botões Adicionar/Retirar abrem o modal de contagem de cédulas/moedas.
 */
function CardDinheiro({ item, onAdicionar, onRetirar }) {
  return (
    <div className={styles.cardDinheiro}>
      <CarteiraVisual
        tipo="dinheiro"
        apelido={item.apelido}
        valor={formatarBRL(item.saldo)}
        contagem={item.contagem}
      />

      <div className={styles.dinheiroAcoes}>
        <button
          type="button"
          className={`${styles.dinheiroBtn} ${styles.dinheiroBtnPreenchido}`}
          onClick={onAdicionar}
        >
          Adicionar
        </button>
        <button
          type="button"
          className={`${styles.dinheiroBtn} ${styles.dinheiroBtnContorno}`}
          onClick={onRetirar}
        >
          Retirar
        </button>
      </div>
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
