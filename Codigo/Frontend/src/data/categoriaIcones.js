/**
 * Registro central de ícones de categoria.
 *
 * As categorias agora vivem no banco (biblioteca personalizável) e guardam o
 * nome de um ícone lucide-react como texto (ex.: "Utensils"). Este módulo
 * resolve esse texto para o componente React e oferece a lista de ícones que
 * o usuário pode escolher ao criar/editar uma categoria.
 */
import {
  Utensils,
  CarFront,
  Gamepad2,
  House,
  GraduationCap,
  HeartPulse,
  Clapperboard,
  Wallet,
  Laptop,
  TrendingUp,
  Gift,
  Undo2,
  Tags,
  Tag,
  ShoppingCart,
  Plane,
  Dumbbell,
  PiggyBank,
  Briefcase,
  Coffee,
  Fuel,
  Shirt,
  Baby,
  PawPrint,
  Wifi,
  Phone,
  Landmark,
  Banknote,
  CreditCard,
  Heart,
  Music,
  BookOpen,
  Wrench,
  Ellipsis,
} from "lucide-react";

// Nome (string guardada no banco) -> componente.
export const ICONES = {
  Utensils,
  CarFront,
  Gamepad2,
  House,
  GraduationCap,
  HeartPulse,
  Clapperboard,
  Wallet,
  Laptop,
  TrendingUp,
  Gift,
  Undo2,
  Tags,
  Tag,
  ShoppingCart,
  Plane,
  Dumbbell,
  PiggyBank,
  Briefcase,
  Coffee,
  Fuel,
  Shirt,
  Baby,
  PawPrint,
  Wifi,
  Phone,
  Landmark,
  Banknote,
  CreditCard,
  Heart,
  Music,
  BookOpen,
  Wrench,
  Ellipsis,
};

// Ícone usado quando o nome guardado não existe no registro.
export const ICONE_PADRAO = "Tag";

// Lista para o seletor de ícones (ordem amigável).
export const ICONES_DISPONIVEIS = Object.keys(ICONES);

/** Resolve o nome do ícone para o componente (cai no padrão se não achar). */
export function iconeDe(nome) {
  return ICONES[nome] ?? ICONES[ICONE_PADRAO];
}
