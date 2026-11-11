import { useState } from "react";

import styles from "./AvatarUsuario.module.css";

// ============================================================
// AVATAR DO USUÁRIO
// ------------------------------------------------------------
// Mostra a foto do usuário quando há uma válida; senão (ou se a
// imagem falhar ao carregar) cai num círculo verde com as iniciais.
// Decorativo (aria-hidden): o nome do usuário já aparece ao lado.
// ============================================================

// Iniciais: primeira letra do primeiro e do último nome, maiúsculas.
// Sem nome utilizável, usa "?".
function iniciaisDe(nome) {
  const partes = (nome || "").trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  const primeira = partes[0][0];
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : "";
  return (primeira + ultima).toUpperCase();
}

function AvatarUsuario({ foto, nome, tamanho = 36, className }) {
  // Guarda a foto que falhou ao carregar. Quando `foto` muda, o estado
  // antigo deixa de bater e o erro é "resetado" sem useEffect/setState.
  const [fotoComErro, setFotoComErro] = useState(null);

  const classe = `${styles.avatar} ${className || ""}`.trim();
  const estilo = { width: tamanho, height: tamanho };
  const mostrarImagem = foto && fotoComErro !== foto;

  if (mostrarImagem) {
    return (
      <img
        src={foto}
        alt=""
        aria-hidden="true"
        className={classe}
        style={estilo}
        onError={() => setFotoComErro(foto)}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`${classe} ${styles.iniciais}`}
      style={{ ...estilo, fontSize: tamanho * 0.4 }}
    >
      {iniciaisDe(nome)}
    </span>
  );
}

export default AvatarUsuario;
