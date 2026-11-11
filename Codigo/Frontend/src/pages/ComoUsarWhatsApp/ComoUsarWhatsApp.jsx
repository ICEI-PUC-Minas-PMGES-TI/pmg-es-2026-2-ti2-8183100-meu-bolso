import {
  MessageCircle,
  Phone,
  Landmark,
  Send,
  ListOrdered,
  CircleCheck,
  ArrowUpCircle,
  ArrowDownCircle,
  PiggyBank,
  HandCoins,
  ArrowLeftRight,
  BarChart3,
  Info,
} from "lucide-react";
import { obterUsuario } from "../../service/Api";
import styles from "./ComoUsarWhatsApp.module.css";

/**
 * Página estática com o passo a passo do chatbot do WhatsApp.
 *
 * Os textos seguem o comportamento real do bot (backend: whatsapp/FluxoChatbot
 * e WhatsAppService). Se o fluxo do bot mudar, atualize esta página junto.
 *
 * Número do bot: VITE_WHATSAPP_NUMERO (só dígitos, com DDI, ex.: 5531999990000).
 * Sem ele, a página não mostra o botão "Abrir no WhatsApp".
 */

// Palavra que inicia a conversa (mesmo padrão do backend: app.whatsapp.palavra-ativacao).
const PALAVRA_ATIVACAO = "meu bolso";

const NUMERO_BOT = (import.meta.env.VITE_WHATSAPP_NUMERO || "").replace(/\D/g, "");

// Exibido enquanto o bot não tem número próprio (VITE_WHATSAPP_NUMERO vazio).
const NUMERO_PROVISORIO = "xxxxxxx";

// "5531999990000" -> "+55 (31) 99999-0000"
function formatarNumeroBot(digitos) {
  const m = digitos.match(/^(\d{2})(\d{2})(\d{4,5})(\d{4})$/);
  return m ? `+${m[1]} (${m[2]}) ${m[3]}-${m[4]}` : `+${digitos}`;
}

const OPCOES = [
  {
    numero: 1,
    icone: ArrowUpCircle,
    titulo: "Registrar depósito (receita)",
    passos: ["Valor", "Categoria", "Descrição", "Conta onde entrou", "Confirmação"],
  },
  {
    numero: 2,
    icone: ArrowDownCircle,
    titulo: "Registrar gasto",
    passos: ["Valor", "Categoria", "Descrição", "Conta de onde saiu", "Confirmação"],
  },
  {
    numero: 3,
    icone: PiggyBank,
    titulo: "Depositar em uma meta",
    passos: ["Valor", "Meta", "Conta de onde sai", "Confirmação"],
  },
  {
    numero: 4,
    icone: HandCoins,
    titulo: "Retirar de uma meta",
    passos: ["Valor", "Meta", "Conta para onde vai", "Confirmação"],
  },
  {
    numero: 5,
    icone: ArrowLeftRight,
    titulo: "Transferir entre contas",
    passos: ["Valor", "Conta de origem", "Conta de destino", "Confirmação"],
  },
  {
    numero: 6,
    icone: BarChart3,
    titulo: "Ver saldos e metas",
    passos: ["Mostra o saldo de cada conta e o progresso das metas"],
  },
];

const COMANDOS = [
  { comando: "0", descricao: "Encerra a conversa a qualquer momento (também vale “sair” ou “cancelar”)." },
  { comando: "menu", descricao: "Descarta a operação em andamento e mostra o menu de novo." },
  { comando: "2", descricao: "Na tela de confirmação, cancela só aquela operação." },
  { comando: "-", descricao: "Na descrição, usa o nome da categoria escolhida." },
];

// Conversa de exemplo (registro de um gasto).
const EXEMPLO = [
  { de: "voce", texto: PALAVRA_ATIVACAO },
  { de: "bot", texto: "Olá! Eu sou o bot do Meu Bolso. 💰\nO que você deseja fazer?\n…\n2 - Registrar gasto\n…" },
  { de: "voce", texto: "2" },
  { de: "bot", texto: "Qual o valor do gasto? (ex.: 25,90)" },
  { de: "voce", texto: "25,90" },
  { de: "bot", texto: "Qual a categoria?\n1 - Alimentação\n2 - Transporte\n…" },
  { de: "voce", texto: "1" },
  { de: "bot", texto: "Escreva uma descrição curta (ex.: Mercado do mês).\nOu envie - para usar \"Alimentação\"." },
  { de: "voce", texto: "Mercado" },
  { de: "bot", texto: "De qual conta o dinheiro saiu?\n1 - Inter (saldo R$ 630,00)\n2 - Nubank (saldo R$ 291,00)" },
  { de: "voce", texto: "1" },
  { de: "bot", texto: "Confirma o gasto?\n💸 Valor: R$ 25,90\n🏷️ Categoria: Alimentação\n📝 Descrição: Mercado\n🏦 Conta: Inter\n📅 Data: (hoje)\n\n1 - Confirmar\n2 - Cancelar" },
  { de: "voce", texto: "1" },
  { de: "bot", texto: "✅ Gasto de R$ 25,90 registrado em Inter." },
];

function formatarTelefone(digitos) {
  const d = (digitos || "").replace(/\D/g, "").replace(/^55(?=\d{10,11}$)/, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return digitos || "";
}

function ComoUsarWhatsApp() {
  const usuario = obterUsuario();
  const telefone = formatarTelefone(usuario?.telefone);
  const linkWhatsApp = NUMERO_BOT
    ? `https://wa.me/${NUMERO_BOT}?text=${encodeURIComponent(PALAVRA_ATIVACAO)}`
    : null;

  return (
    <div className={styles.pagina}>
      {/* Cabeçalho */}
      <header className={styles.cabecalho}>
        <span className={styles.selo} aria-hidden="true">
          <MessageCircle size={28} />
        </span>
        <div>
          <h1>Meu Bolso no WhatsApp</h1>
          <p className="texto-secundario">
            Registre gastos, receitas, metas e transferências conversando com o nosso bot,
            sem abrir o site.
          </p>
        </div>
        {/* Número do bot em destaque */}
        <div className={`card ${styles.numeroBot}`}>
          <span className={styles.numeroRotulo}>Número do bot</span>
          <strong className={styles.numeroValor}>
            {NUMERO_BOT ? formatarNumeroBot(NUMERO_BOT) : NUMERO_PROVISORIO}
          </strong>
          {linkWhatsApp ? (
            <a className={`btn btn-verde ${styles.botaoAbrir}`} href={linkWhatsApp} target="_blank" rel="noopener noreferrer">
              <Send size={18} aria-hidden="true" />
              Abrir no WhatsApp
            </a>
          ) : (
            <span className="texto-secundario texto-pequeno">Em breve</span>
          )}
        </div>
      </header>

      {/* Antes de começar */}
      <section className={styles.secao} aria-labelledby="antes">
        <h2 id="antes">Antes de começar</h2>
        <div className={styles.grade2}>
          <article className={`card ${styles.requisito}`}>
            <Phone size={22} aria-hidden="true" className={styles.iconeRequisito} />
            <div>
              <h3>Use o mesmo telefone do seu perfil</h3>
              <p className="texto-secundario">
                O bot reconhece você pelo número. Ele precisa ser o mesmo cadastrado no seu perfil,
                com DDD.
                {telefone ? (
                  <>
                    {" "}Seu telefone cadastrado: <strong>{telefone}</strong>.
                  </>
                ) : null}{" "}
                Para trocar, use <strong>Editar perfil</strong> no menu do seu nome.
              </p>
            </div>
          </article>
          <article className={`card ${styles.requisito}`}>
            <Landmark size={22} aria-hidden="true" className={styles.iconeRequisito} />
            <div>
              <h3>Tenha uma conta bancária cadastrada</h3>
              <p className="texto-secundario">
                Todas as operações movimentam contas bancárias. Cadastre pelo menos uma na
                página <strong>Carteiras</strong>. Para transferências, são necessárias duas.
              </p>
            </div>
          </article>
        </div>
      </section>

      {/* Como funciona */}
      <section className={styles.secao} aria-labelledby="como">
        <h2 id="como">Como funciona</h2>
        <ol className={styles.passos}>
          <li className="card">
            <span className={styles.numeroPasso} aria-hidden="true">1</span>
            <Send size={20} aria-hidden="true" />
            <h3>Chame o bot</h3>
            <p className="texto-secundario">
              Envie <code className={styles.codigo}>{PALAVRA_ATIVACAO}</code> para o número do Meu Bolso.
              Mensagens sem essa palavra são ignoradas.
            </p>
          </li>
          <li className="card">
            <span className={styles.numeroPasso} aria-hidden="true">2</span>
            <ListOrdered size={20} aria-hidden="true" />
            <h3>Escolha a opção</h3>
            <p className="texto-secundario">Responda com o número da opção do menu (de 1 a 6).</p>
          </li>
          <li className="card">
            <span className={styles.numeroPasso} aria-hidden="true">3</span>
            <MessageCircle size={20} aria-hidden="true" />
            <h3>Responda as perguntas</h3>
            <p className="texto-secundario">
              O bot pergunta uma coisa por vez e mostra listas numeradas. É só responder com o número.
            </p>
          </li>
          <li className="card">
            <span className={styles.numeroPasso} aria-hidden="true">4</span>
            <CircleCheck size={20} aria-hidden="true" />
            <h3>Confirme</h3>
            <p className="texto-secundario">
              Antes de salvar, o bot mostra um resumo. Envie 1 para confirmar ou 2 para cancelar.
            </p>
          </li>
        </ol>
      </section>

      {/* Opções do menu */}
      <section className={styles.secao} aria-labelledby="opcoes">
        <h2 id="opcoes">O que dá para fazer</h2>
        <ul className={styles.opcoes}>
          {OPCOES.map(({ numero, icone: Icone, titulo, passos }) => (
            <li key={numero} className={`card ${styles.opcao}`}>
              <div className={styles.opcaoTopo}>
                <span className={styles.opcaoNumero} aria-hidden="true">{numero}</span>
                <Icone size={20} aria-hidden="true" className={styles.opcaoIcone} />
                <h3>
                  <span className={styles.srOnly}>Opção {numero}: </span>
                  {titulo}
                </h3>
              </div>
              <p className={`texto-secundario texto-pequeno ${styles.opcaoPassos}`}>
                {passos.join(" → ")}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* Exemplo + comandos */}
      <div className={styles.grade2}>
        <section className={styles.secao} aria-labelledby="exemplo">
          <h2 id="exemplo">Exemplo: registrando um gasto</h2>
          <ol className={styles.chat} aria-label="Conversa de exemplo com o bot">
            {EXEMPLO.map((m, i) => (
              <li
                key={i}
                className={`${styles.balao} ${m.de === "voce" ? styles.balaoVoce : styles.balaoBot}`}
              >
                <span className={styles.srOnly}>{m.de === "voce" ? "Você: " : "Bot: "}</span>
                {m.texto}
              </li>
            ))}
          </ol>
        </section>

        <div className={styles.coluna}>
          <section className={styles.secao} aria-labelledby="comandos">
            <h2 id="comandos">Comandos úteis</h2>
            <dl className={`card ${styles.comandos}`}>
              {COMANDOS.map(({ comando, descricao }) => (
                <div key={comando} className={styles.comando}>
                  <dt><code className={styles.codigo}>{comando}</code></dt>
                  <dd className="texto-secundario">{descricao}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className={styles.secao} aria-labelledby="valores">
            <h2 id="valores">Como escrever valores</h2>
            <div className="card">
              <p className="texto-secundario">Todos estes formatos funcionam:</p>
              <p className={styles.valores}>
                {["50", "25,90", "25.90", "R$ 1.234,56"].map((v) => (
                  <code key={v} className={styles.codigo}>{v}</code>
                ))}
              </p>
            </div>
          </section>

          <section className={styles.secao} aria-labelledby="saber">
            <h2 id="saber">Bom saber</h2>
            <ul className={`card ${styles.avisos}`}>
              <li><Info size={16} aria-hidden="true" /> A data registrada é sempre a de hoje.</li>
              <li><Info size={16} aria-hidden="true" /> Depois de 10 minutos sem resposta, a operação em andamento é cancelada.</li>
              <li><Info size={16} aria-hidden="true" /> O bot entende só mensagens de texto. Áudios, fotos e figurinhas são ignorados.</li>
              <li><Info size={16} aria-hidden="true" /> Mensagens em grupos não são respondidas.</li>
              <li><Info size={16} aria-hidden="true" /> Cartões e dinheiro em espécie continuam sendo controlados pelo site.</li>
              <li><Info size={16} aria-hidden="true" /> Tudo o que você registra pelo WhatsApp aparece no site na hora.</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}

export default ComoUsarWhatsApp;
