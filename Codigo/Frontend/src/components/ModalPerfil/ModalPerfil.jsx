import { useEffect, useRef, useState } from "react";
import { X, Pencil, KeyRound } from "lucide-react";

import {
  buscarPerfil,
  atualizarPerfil,
  atualizarFoto,
  trocarSenha,
  obterUsuario,
} from "../../service/Api";
import styles from "./ModalPerfil.module.css";
import ResumoSemanalConfig from "./ResumoSemanalConfig";
import AvatarUsuario from "../AvatarUsuario/AvatarUsuario";

/**
 * Modal de edição de perfil (sobrepõe a tela atual, sem mudar de rota).
 *
 * Edita nome, telefone e e-mail e, opcionalmente, troca a senha
 * (exige a senha atual). Ao salvar, persiste no back-end via Api.js,
 * que também atualiza o token/sessão local (o e-mail é a identidade
 * no JWT, então o back-end reemite o token).
 *
 * O avatar tem só o visual com lápis no hover; o upload de foto ainda
 * não está implementado.
 *
 * props:
 *  - aberto: boolean
 *  - onFechar: fecha o modal
 *  - onAtualizado: (perfil) => void — avisa o pai que o perfil mudou
 */
function ModalPerfil({ aberto, onFechar, onAtualizado }) {
  const [form, setForm] = useState({
    nome: "",
    email: "",
    telefone: "",
    senhaAtual: "",
    novaSenha: "",
    confirmarSenha: "",
  });
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  // Campos de senha ficam ocultos até o usuário clicar em "Alterar senha".
  const [mostrarSenha, setMostrarSenha] = useState(false);
  // Foto de perfil atual e estado de envio do upload.
  const [foto, setFoto] = useState(() => obterUsuario()?.foto ?? null);
  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const inputFotoRef = useRef(null);

  // Busca o perfil completo (inclui telefone, que não está no localStorage).
  useEffect(() => {
    if (!aberto) return;
    let ativo = true;
    (async () => {
      setCarregando(true);
      setErro("");
      // Toda abertura começa limpa: senha recolhida e campos zerados.
      setMostrarSenha(false);
      try {
        const p = await buscarPerfil();
        if (ativo) {
          setForm({
            nome: p.nome ?? "",
            email: p.email ?? "",
            telefone: p.telefone ?? "",
            senhaAtual: "",
            novaSenha: "",
            confirmarSenha: "",
          });
          setFoto(p.foto ?? null);
        }
      } catch (e) {
        if (ativo) setErro(e.message || "Não foi possível carregar o perfil.");
      } finally {
        if (ativo) setCarregando(false);
      }
    })();
    return () => {
      ativo = false;
    };
  }, [aberto]);

  if (!aberto) return null;

  function atualizar(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");

    const nome = form.nome.trim();
    const email = form.email.trim();
    const telefone = form.telefone.trim();

    if (!nome) return setErro("Informe seu nome.");
    if (!email) return setErro("Informe seu e-mail.");
    if (!telefone) return setErro("Informe seu telefone.");

    // A troca de senha só acontece se a seção estiver aberta e preenchida.
    const querTrocarSenha =
      mostrarSenha &&
      (form.senhaAtual || form.novaSenha || form.confirmarSenha);

    if (querTrocarSenha) {
      if (!form.senhaAtual) return setErro("Informe a senha atual.");
      if (form.novaSenha.length < 8)
        return setErro("A nova senha deve ter ao menos 8 caracteres.");
      if (form.novaSenha !== form.confirmarSenha)
        return setErro("A confirmação da nova senha não confere.");
    }

    setSalvando(true);
    try {
      // 1) Dados básicos (também reemite o token se o e-mail mudou).
      const perfil = await atualizarPerfil({ nome, email, telefone });

      // 2) Senha, se solicitado.
      if (querTrocarSenha) {
        await trocarSenha({
          senhaAtual: form.senhaAtual,
          novaSenha: form.novaSenha,
        });
      }

      if (onAtualizado) onAtualizado(perfil);
      onFechar();
    } catch (e2) {
      setErro(e2.message || "Não foi possível salvar as alterações.");
    } finally {
      setSalvando(false);
    }
  }

  // Recorta o quadrado central da imagem e redimensiona para 256x256,
  // exportando JPEG (qualidade 0.85). Devolve uma data URL.
  function processarImagem(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        try {
          const lado = Math.min(img.width, img.height);
          const sx = (img.width - lado) / 2;
          const sy = (img.height - lado) / 2;
          const canvas = document.createElement("canvas");
          canvas.width = 256;
          canvas.height = 256;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, sx, sy, lado, lado, 0, 0, 256, 256);
          resolve(canvas.toDataURL("image/jpeg", 0.85));
        } catch (e) {
          reject(e);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Não foi possível ler a imagem."));
      };
      img.src = url;
    });
  }

  async function aoEscolherFoto(ev) {
    const file = ev.target.files?.[0];
    ev.target.value = ""; // permite reescolher o mesmo arquivo
    if (!file) return;

    setErro("");
    if (!file.type.startsWith("image/")) {
      setErro("Escolha um arquivo de imagem.");
      return;
    }

    setEnviandoFoto(true);
    try {
      const dataUrl = await processarImagem(file);
      const resposta = await atualizarFoto(dataUrl);
      setFoto(resposta?.foto ?? null);
      if (onAtualizado) onAtualizado();
    } catch (e) {
      setErro(e.message || "Não foi possível atualizar a foto.");
    } finally {
      setEnviandoFoto(false);
    }
  }

  async function removerFoto() {
    setErro("");
    setEnviandoFoto(true);
    try {
      await atualizarFoto(null);
      setFoto(null);
      if (onAtualizado) onAtualizado();
    } catch (e) {
      setErro(e.message || "Não foi possível remover a foto.");
    } finally {
      setEnviandoFoto(false);
    }
  }

  return (
    <div className={styles.overlay} onClick={onFechar}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label="Editar perfil"
        onClick={(ev) => ev.stopPropagation()}
      >
        <header className={styles.cabecalho}>
          <h2>Editar perfil</h2>
          <button
            className={styles.botaoFechar}
            type="button"
            onClick={onFechar}
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </header>

        {/* Avatar: clique abre o seletor de arquivo e envia a nova foto. */}
        <div className={styles.avatarArea}>
          <button
            type="button"
            className={styles.avatarBotao}
            title="Alterar foto"
            aria-label="Alterar foto"
            onClick={() => inputFotoRef.current?.click()}
            disabled={enviandoFoto}
          >
            <AvatarUsuario
              foto={foto}
              nome={form.nome}
              tamanho={96}
              className={styles.avatarImg}
            />
            <span className={styles.avatarOverlay}>
              <Pencil size={22} aria-hidden="true" />
            </span>
          </button>
          <input
            ref={inputFotoRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            hidden
            onChange={aoEscolherFoto}
          />
          <span className={styles.avatarDica}>
            {enviandoFoto ? "Enviando..." : "Alterar foto"}
          </span>
          {foto && !enviandoFoto && (
            <button
              type="button"
              className={styles.btnCancelarSenha}
              onClick={removerFoto}
            >
              Remover foto
            </button>
          )}
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          {/* Dados básicos */}
          <div className={styles.secao}>
            <span className={styles.secaoTitulo}>Dados pessoais</span>

            <div className={styles.campo}>
              <label htmlFor="perfil-nome">Nome</label>
              <input
                id="perfil-nome"
                type="text"
                value={form.nome}
                onChange={(ev) => atualizar("nome", ev.target.value)}
                disabled={carregando}
              />
            </div>

            <div className={styles.linha}>
              <div className={styles.campo}>
                <label htmlFor="perfil-email">E-mail</label>
                <input
                  id="perfil-email"
                  type="email"
                  value={form.email}
                  onChange={(ev) => atualizar("email", ev.target.value)}
                  disabled={carregando}
                />
              </div>

              <div className={styles.campo}>
                <label htmlFor="perfil-telefone">Telefone</label>
                <input
                  id="perfil-telefone"
                  type="tel"
                  value={form.telefone}
                  onChange={(ev) => atualizar("telefone", ev.target.value)}
                  disabled={carregando}
                />
              </div>
            </div>
          </div>

          <div className={styles.separador} />

          {/* Troca de senha (opcional): escondida atrás de um botão */}
          <div className={styles.secao}>
            <span className={styles.secaoTitulo}>Alterar senha</span>

            {!mostrarSenha ? (
              <button
                type="button"
                className={styles.btnAlterarSenha}
                onClick={() => setMostrarSenha(true)}
                disabled={carregando}
              >
                <KeyRound size={16} aria-hidden="true" />
                Alterar senha
              </button>
            ) : (
              <>
                <p className={styles.dica}>
                  Preencha para definir uma nova senha.
                </p>

                <div className={styles.campo}>
                  <label htmlFor="perfil-senha-atual">Senha atual</label>
                  <input
                    id="perfil-senha-atual"
                    type="password"
                    autoComplete="current-password"
                    value={form.senhaAtual}
                    onChange={(ev) => atualizar("senhaAtual", ev.target.value)}
                  />
                </div>

                <div className={styles.linha}>
                  <div className={styles.campo}>
                    <label htmlFor="perfil-nova-senha">Nova senha</label>
                    <input
                      id="perfil-nova-senha"
                      type="password"
                      autoComplete="new-password"
                      value={form.novaSenha}
                      onChange={(ev) => atualizar("novaSenha", ev.target.value)}
                    />
                  </div>

                  <div className={styles.campo}>
                    <label htmlFor="perfil-confirmar-senha">Confirmar nova senha</label>
                    <input
                      id="perfil-confirmar-senha"
                      type="password"
                      autoComplete="new-password"
                      value={form.confirmarSenha}
                      onChange={(ev) => atualizar("confirmarSenha", ev.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  className={styles.btnCancelarSenha}
                  onClick={() => {
                    setMostrarSenha(false);
                    atualizar("senhaAtual", "");
                    atualizar("novaSenha", "");
                    atualizar("confirmarSenha", "");
                  }}
                >
                  Cancelar alteração de senha
                </button>
              </>
            )}
          </div>

          <div className={styles.separador} />

          <ResumoSemanalConfig />

          {erro && <p className={styles.erro}>{erro}</p>}

          <div className={styles.formAcoes}>
            <button
              type="button"
              className={styles.btnVoltar}
              onClick={onFechar}
              disabled={salvando}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.btnSalvar}
              disabled={carregando || salvando}
            >
              {salvando ? "Salvando..." : "Confirmar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ModalPerfil;
