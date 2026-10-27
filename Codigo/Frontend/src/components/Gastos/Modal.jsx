    import { useEffect, useId } from "react";
    import { X } from "lucide-react";

    import styles from "../../pages/Gastos/Gastos.module.css";

    /**
     * Casca padrão de todos os modais da página: overlay, título acessível,
     * fechar com Esc ou clique fora, e devolve o foco ao botão que abriu.
     */
    export default function Modal({ titulo, onFechar, largura, children }) {
    const idTitulo = useId();

    useEffect(() => {
        function aoPressionarTecla(event) {
        if (event.key === "Escape") onFechar();
        }

        document.addEventListener("keydown", aoPressionarTecla);
        return () => document.removeEventListener("keydown", aoPressionarTecla);
    }, [onFechar]);

    useEffect(() => {
        const abertoPor = document.activeElement;
        return () => abertoPor?.focus?.();
    }, []);

    return (
        <div
        className={styles["gastos-modal-overlay"]}
        onMouseDown={(event) => {
            if (event.target === event.currentTarget) onFechar();
        }}
        >
        <div
            className={styles["gastos-modal"]}
            role="dialog"
            aria-modal="true"
            aria-labelledby={idTitulo}
            style={largura ? { maxWidth: largura } : undefined}
        >
            <div className={styles["gastos-modal-cabecalho"]}>
            <h2 id={idTitulo}>{titulo}</h2>

            <button
                type="button"
                className={styles["gastos-modal-fechar"]}
                onClick={onFechar}
                aria-label="Fechar"
            >
                <X size={20} aria-hidden="true" />
            </button>
            </div>

            {children}
        </div>
        </div>
    );
    }