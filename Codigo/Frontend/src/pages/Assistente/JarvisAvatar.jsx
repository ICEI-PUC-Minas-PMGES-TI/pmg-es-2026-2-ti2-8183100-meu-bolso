import styles from "./JarvisAvatar.module.css";

// Avatar do assistente. Decorativo (aria-hidden). O anel reage ao estado:
// "parado" (estático), "pensando" (pulso lento) e "falando" (pulso rápido).
// Numa etapa futura vira um orbe animado.
function JarvisAvatar({ estado = "parado" }) {
  return (
    <div className={styles.avatar} data-estado={estado} aria-hidden="true">
      Jarvis
    </div>
  );
}

export default JarvisAvatar;
