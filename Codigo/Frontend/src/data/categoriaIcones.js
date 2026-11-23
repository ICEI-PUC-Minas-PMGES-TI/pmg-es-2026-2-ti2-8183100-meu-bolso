/**
 * Registro central de ícones de categoria.
 *
 * As categorias vivem no banco (biblioteca personalizável) e guardam o nome de
 * um ícone lucide-react como texto (ex.: "Utensils"). Este módulo resolve esse
 * texto para o componente React e oferece a lista de ícones que o usuário pode
 * escolher ao criar/editar uma categoria, com rótulos em português para busca.
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
  TrendingDown,
  Gift,
  Undo2,
  Tags,
  Tag,
  ShoppingCart,
  ShoppingBag,
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
  Smartphone,
  Landmark,
  Banknote,
  CreditCard,
  Coins,
  Heart,
  Music,
  BookOpen,
  Book,
  Wrench,
  Hammer,
  Car,
  Bus,
  Bike,
  Train,
  Home,
  Building2,
  Lightbulb,
  Droplet,
  Flame,
  Zap,
  Tv,
  Film,
  Headphones,
  Camera,
  Gamepad,
  Pizza,
  Beer,
  Wine,
  Apple,
  Carrot,
  Cake,
  IceCream,
  Stethoscope,
  Pill,
  Cross,
  Activity,
  Scissors,
  Sparkles,
  Dog,
  Cat,
  Trees,
  Sun,
  Umbrella,
  Luggage,
  MapPin,
  Ticket,
  Trophy,
  Medal,
  Palette,
  Brush,
  PenTool,
  Monitor,
  Keyboard,
  Mouse,
  HardDrive,
  Cpu,
  Printer,
  Mail,
  DollarSign,
  Euro,
  Receipt,
  Calculator,
  Wallet2,
  HandCoins,
  Handshake,
  Building,
  Factory,
  Store,
  Warehouse,
  Footprints,
  Watch,
  Glasses,
  Gem,
  Crown,
  Star,
  Flower2,
  Leaf,
  Bone,
  Fish,
  Bird,
  Ellipsis,
} from "lucide-react";

/**
 * Catálogo: cada entrada tem o componente e um rótulo em português usado na
 * busca. A chave é o nome guardado no banco.
 */
export const CATALOGO = {
  // Dinheiro e finanças
  Wallet: { Icone: Wallet, rotulo: "carteira dinheiro" },
  Wallet2: { Icone: Wallet2, rotulo: "carteira" },
  PiggyBank: { Icone: PiggyBank, rotulo: "cofrinho poupança reserva" },
  Banknote: { Icone: Banknote, rotulo: "nota dinheiro cédula" },
  Coins: { Icone: Coins, rotulo: "moedas dinheiro" },
  CreditCard: { Icone: CreditCard, rotulo: "cartão crédito" },
  DollarSign: { Icone: DollarSign, rotulo: "dólar dinheiro" },
  Euro: { Icone: Euro, rotulo: "euro dinheiro" },
  HandCoins: { Icone: HandCoins, rotulo: "pagamento moedas mão" },
  Handshake: { Icone: Handshake, rotulo: "acordo negócio aperto de mão" },
  Receipt: { Icone: Receipt, rotulo: "recibo comprovante nota fiscal" },
  Calculator: { Icone: Calculator, rotulo: "calculadora contas" },
  TrendingUp: { Icone: TrendingUp, rotulo: "alta investimento subir ganho" },
  TrendingDown: { Icone: TrendingDown, rotulo: "queda perda baixa" },
  Landmark: { Icone: Landmark, rotulo: "banco instituição governo" },

  // Alimentação
  Utensils: { Icone: Utensils, rotulo: "comida restaurante almoço talher" },
  Pizza: { Icone: Pizza, rotulo: "pizza lanche comida" },
  Coffee: { Icone: Coffee, rotulo: "café bebida" },
  Beer: { Icone: Beer, rotulo: "cerveja bebida bar" },
  Wine: { Icone: Wine, rotulo: "vinho bebida" },
  Apple: { Icone: Apple, rotulo: "maçã fruta saudável" },
  Carrot: { Icone: Carrot, rotulo: "cenoura verdura mercado" },
  Cake: { Icone: Cake, rotulo: "bolo aniversário doce" },
  IceCream: { Icone: IceCream, rotulo: "sorvete doce" },

  // Transporte
  CarFront: { Icone: CarFront, rotulo: "carro transporte" },
  Car: { Icone: Car, rotulo: "carro automóvel" },
  Bus: { Icone: Bus, rotulo: "ônibus transporte público" },
  Bike: { Icone: Bike, rotulo: "bicicleta bike" },
  Train: { Icone: Train, rotulo: "trem metrô" },
  Plane: { Icone: Plane, rotulo: "avião viagem voo" },
  Fuel: { Icone: Fuel, rotulo: "combustível gasolina posto" },

  // Moradia e contas
  House: { Icone: House, rotulo: "casa moradia lar" },
  Home: { Icone: Home, rotulo: "casa lar" },
  Building2: { Icone: Building2, rotulo: "prédio apartamento" },
  Building: { Icone: Building, rotulo: "prédio empresa" },
  Lightbulb: { Icone: Lightbulb, rotulo: "luz energia lâmpada" },
  Zap: { Icone: Zap, rotulo: "energia elétrica raio" },
  Droplet: { Icone: Droplet, rotulo: "água conta gota" },
  Flame: { Icone: Flame, rotulo: "gás fogo chama" },
  Wifi: { Icone: Wifi, rotulo: "internet wifi" },
  Tv: { Icone: Tv, rotulo: "tv televisão streaming" },

  // Lazer e cultura
  Gamepad2: { Icone: Gamepad2, rotulo: "jogo videogame lazer" },
  Gamepad: { Icone: Gamepad, rotulo: "jogo controle" },
  Clapperboard: { Icone: Clapperboard, rotulo: "cinema filme assinatura" },
  Film: { Icone: Film, rotulo: "filme cinema" },
  Music: { Icone: Music, rotulo: "música som" },
  Headphones: { Icone: Headphones, rotulo: "fone música áudio" },
  Camera: { Icone: Camera, rotulo: "câmera foto" },
  Ticket: { Icone: Ticket, rotulo: "ingresso evento show" },
  Trophy: { Icone: Trophy, rotulo: "troféu prêmio" },
  Medal: { Icone: Medal, rotulo: "medalha prêmio" },

  // Saúde
  HeartPulse: { Icone: HeartPulse, rotulo: "saúde batimento coração" },
  Stethoscope: { Icone: Stethoscope, rotulo: "médico consulta saúde" },
  Pill: { Icone: Pill, rotulo: "remédio farmácia" },
  Cross: { Icone: Cross, rotulo: "saúde hospital cruz" },
  Activity: { Icone: Activity, rotulo: "atividade saúde" },
  Dumbbell: { Icone: Dumbbell, rotulo: "academia exercício peso" },

  // Educação e trabalho
  GraduationCap: { Icone: GraduationCap, rotulo: "educação faculdade formatura estudo" },
  BookOpen: { Icone: BookOpen, rotulo: "livro leitura estudo" },
  Book: { Icone: Book, rotulo: "livro" },
  Briefcase: { Icone: Briefcase, rotulo: "trabalho emprego maleta" },
  Laptop: { Icone: Laptop, rotulo: "notebook trabalho freelance" },
  Monitor: { Icone: Monitor, rotulo: "computador tela" },
  Keyboard: { Icone: Keyboard, rotulo: "teclado" },
  Printer: { Icone: Printer, rotulo: "impressora" },
  Cpu: { Icone: Cpu, rotulo: "processador tecnologia" },
  Mail: { Icone: Mail, rotulo: "email correio" },

  // Compras e vestuário
  ShoppingCart: { Icone: ShoppingCart, rotulo: "compras mercado carrinho" },
  ShoppingBag: { Icone: ShoppingBag, rotulo: "compras sacola" },
  Store: { Icone: Store, rotulo: "loja comércio" },
  Tags: { Icone: Tags, rotulo: "etiquetas preço" },
  Tag: { Icone: Tag, rotulo: "etiqueta" },
  Shirt: { Icone: Shirt, rotulo: "roupa camisa vestuário" },
  Footprints: { Icone: Footprints, rotulo: "calçado sapato pegadas" },
  Watch: { Icone: Watch, rotulo: "relógio acessório" },
  Glasses: { Icone: Glasses, rotulo: "óculos" },
  Gem: { Icone: Gem, rotulo: "joia diamante" },
  Crown: { Icone: Crown, rotulo: "coroa luxo" },

  // Pessoas e presentes
  Gift: { Icone: Gift, rotulo: "presente gift" },
  Baby: { Icone: Baby, rotulo: "bebê filho criança" },
  Heart: { Icone: Heart, rotulo: "coração amor doação" },
  Star: { Icone: Star, rotulo: "estrela favorito" },
  Sparkles: { Icone: Sparkles, rotulo: "brilho beleza especial" },
  Scissors: { Icone: Scissors, rotulo: "salão cabeleireiro corte" },
  Undo2: { Icone: Undo2, rotulo: "reembolso devolução estorno" },

  // Pets e natureza
  Dog: { Icone: Dog, rotulo: "cachorro pet" },
  Cat: { Icone: Cat, rotulo: "gato pet" },
  PawPrint: { Icone: PawPrint, rotulo: "pet animal pata" },
  Fish: { Icone: Fish, rotulo: "peixe pet" },
  Bird: { Icone: Bird, rotulo: "pássaro pet" },
  Bone: { Icone: Bone, rotulo: "osso pet" },
  Leaf: { Icone: Leaf, rotulo: "folha natureza planta" },
  Flower2: { Icone: Flower2, rotulo: "flor planta" },
  Trees: { Icone: Trees, rotulo: "árvores natureza" },
  Sun: { Icone: Sun, rotulo: "sol clima" },

  // Serviços e outros
  Wrench: { Icone: Wrench, rotulo: "ferramenta reparo manutenção" },
  Hammer: { Icone: Hammer, rotulo: "martelo reforma obra" },
  Factory: { Icone: Factory, rotulo: "fábrica indústria" },
  Warehouse: { Icone: Warehouse, rotulo: "depósito armazém" },
  Luggage: { Icone: Luggage, rotulo: "mala viagem" },
  Umbrella: { Icone: Umbrella, rotulo: "guarda-chuva seguro" },
  MapPin: { Icone: MapPin, rotulo: "local mapa endereço" },
  Phone: { Icone: Phone, rotulo: "telefone ligação" },
  Smartphone: { Icone: Smartphone, rotulo: "celular telefone" },
  Palette: { Icone: Palette, rotulo: "arte tinta paleta" },
  Brush: { Icone: Brush, rotulo: "pincel arte pintura" },
  PenTool: { Icone: PenTool, rotulo: "caneta design" },
  Ellipsis: { Icone: Ellipsis, rotulo: "outros reticências diversos" },
};

// Nome (string guardada no banco) -> componente, derivado do catálogo.
export const ICONES = Object.fromEntries(
  Object.entries(CATALOGO).map(([nome, { Icone }]) => [nome, Icone]),
);

// Ícone usado quando o nome guardado não existe no registro.
export const ICONE_PADRAO = "Tag";

// Lista para o seletor de ícones (ordem do catálogo).
export const ICONES_DISPONIVEIS = Object.keys(CATALOGO);

/** Resolve o nome do ícone para o componente (cai no padrão se não achar). */
export function iconeDe(nome) {
  return ICONES[nome] ?? ICONES[ICONE_PADRAO];
}

/** Normaliza texto para busca (sem acento, minúsculo). */
function normalizar(texto) {
  return (texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Filtra os nomes de ícone por um termo de busca, comparando com o rótulo em
 * português e com o próprio nome do ícone. Sem termo, devolve todos.
 */
export function buscarIcones(termo) {
  const t = normalizar(termo);
  if (!t) return ICONES_DISPONIVEIS;
  return ICONES_DISPONIVEIS.filter((nome) => {
    const rotulo = normalizar(CATALOGO[nome].rotulo);
    return rotulo.includes(t) || normalizar(nome).includes(t);
  });
}
