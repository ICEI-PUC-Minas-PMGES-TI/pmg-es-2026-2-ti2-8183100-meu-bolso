import { createContext, useContext } from "react";

// Contexto da conversa do assistente. Fica separado do provedor por causa
// da regra react-refresh (um arquivo não deve exportar componente e não-componente).
export const AssistenteContext = createContext(null);

export function useAssistente() {
  const contexto = useContext(AssistenteContext);
  if (!contexto) {
    throw new Error("useAssistente deve ser usado dentro de AssistenteProvider.");
  }
  return contexto;
}
