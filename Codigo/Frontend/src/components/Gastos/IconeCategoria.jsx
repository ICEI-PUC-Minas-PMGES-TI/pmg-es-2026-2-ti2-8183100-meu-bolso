    import { ICONES_CATEGORIAS } from "../../pages/Gastos/Constantes";

    export default function IconeCategoria({ categoria, tamanho = 18 }) {
    const Icone = ICONES_CATEGORIAS[categoria] ?? ICONES_CATEGORIAS.Outros;

    return <Icone size={tamanho} strokeWidth={2} aria-hidden="true" />;
    }
