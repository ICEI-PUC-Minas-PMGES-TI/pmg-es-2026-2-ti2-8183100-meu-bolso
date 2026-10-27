import { useState, useRef, useEffect } from "react";

// Hook que mede a largura real do elemento e a mantém atualizada
// quando a tela muda de tamanho. Retorna a ref a anexar ao
// container e a largura atual em px.
export function useLarguraGrafico(larguraInicial = 700) {
  const ref = useRef(null);
  const [largura, setLargura] = useState(larguraInicial);

  useEffect(() => {
    const elemento = ref.current;
    if (!elemento) return;

    const observador = new ResizeObserver(([entrada]) => {
      setLargura(entrada.contentRect.width);
    });

    observador.observe(elemento);
    setLargura(elemento.getBoundingClientRect().width);

    return () => observador.disconnect();
  }, []);

  return { ref, largura };
}
