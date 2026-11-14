// Ícones desenhados para o Aniora: traço único (1.75), cantos arredondados,
// 24×24. Substituem os símbolos de texto (⌂ ⌕ ☰ ◯) da navegação.
import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };

function Svg({ size = 22, children, ...rest }: P & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

/** Início: telhado baixo, como uma casa japonesa vista de frente. */
export const IconHome = (p: P) => (
  <Svg {...p}>
    <path d="M3 10.5 12 4l9 6.5" />
    <path d="M5.5 9v10.5h13V9" />
    <path d="M10 19.5v-5h4v5" />
  </Svg>
);

export const IconSearch = (p: P) => (
  <Svg {...p}>
    <circle cx="10.5" cy="10.5" r="6" />
    <path d="m15 15 5 5" />
  </Svg>
);

export const IconPlus = (p: P) => (
  <Svg {...p}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);

/** Listas: linhas com marcador, como um caderno. */
export const IconLists = (p: P) => (
  <Svg {...p}>
    <path d="M9 6.5h11M9 12h11M9 17.5h11" />
    <circle cx="4.75" cy="6.5" r="0.9" fill="currentColor" stroke="none" />
    <circle cx="4.75" cy="12" r="0.9" fill="currentColor" stroke="none" />
    <circle cx="4.75" cy="17.5" r="0.9" fill="currentColor" stroke="none" />
  </Svg>
);

export const IconProfile = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="8.5" r="3.75" />
    <path d="M4.5 20c1.2-3.6 4-5.5 7.5-5.5s6.3 1.9 7.5 5.5" />
  </Svg>
);

export const IconHeart = ({ filled, ...p }: P & { filled?: boolean }) => (
  <Svg {...p} fill={filled ? "currentColor" : "none"}>
    <path d="M12 19.5s-7.5-4.4-7.5-10A4.25 4.25 0 0 1 12 7a4.25 4.25 0 0 1 7.5 2.5c0 5.6-7.5 10-7.5 10Z" />
  </Svg>
);

export const IconArrowRight = (p: P) => (
  <Svg {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Svg>
);

/** Tema claro. */
export const IconSun = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
  </Svg>
);

/** Tema escuro. */
export const IconMoon = (p: P) => (
  <Svg {...p}>
    <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
  </Svg>
);

/** Tema do sistema. */
export const IconMonitor = (p: P) => (
  <Svg {...p}>
    <rect x="3" y="4.5" width="18" height="12" rx="2" />
    <path d="M9 20h6M12 16.5V20" />
  </Svg>
);

/** Trocar foto. */
export const IconCamera = (p: P) => (
  <Svg {...p}>
    <path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1.5-2h6l1.5 2h2A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5Z" />
    <circle cx="12" cy="12.5" r="3.25" />
  </Svg>
);

export const IconCheck = (p: P) => (
  <Svg {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Svg>
);

/** Assistindo agora. */
export const IconPlay = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M10.5 9v6l4.5-3z" />
  </Svg>
);

/** Quero ver (watchlist). */
export const IconBookmark = (p: P) => (
  <Svg {...p}>
    <path d="M7 4.5h10v15l-5-3.5-5 3.5z" />
  </Svg>
);

/** Capa / imagem larga. */
export const IconImage = (p: P) => (
  <Svg {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <circle cx="9" cy="10" r="1.75" />
    <path d="m21 15.5-4.5-4.5L7 19" />
  </Svg>
);

/** Cor do perfil: gota de tinta. */
export const IconDrop = (p: P) => (
  <Svg {...p}>
    <path d="M12 3.5s-6 6.4-6 10.5a6 6 0 0 0 12 0c0-4.1-6-10.5-6-10.5Z" />
  </Svg>
);

/** Cor do nome: letra A sublinhada. */
export const IconLetter = (p: P) => (
  <Svg {...p}>
    <path d="m6.5 16 5.5-12 5.5 12M8.6 11.5h6.8M5 20h14" />
  </Svg>
);

/** Sem anúncios: megafone cortado. */
export const IconNoAds = (p: P) => (
  <Svg {...p}>
    <path d="M4 10v4h3l6 4V6L7 10Z" />
    <path d="M3 3l18 18" />
  </Svg>
);

/** Reviews primeiro: balão com seta para cima. */
export const IconReviewUp = (p: P) => (
  <Svg {...p}>
    <path d="M20 12.5a7.5 7.5 0 0 1-11 6.6L4 20l1-4.4A7.5 7.5 0 1 1 20 12.5Z" />
    <path d="M12.5 16V9.5M9.75 12l2.75-2.75L15.25 12" />
  </Svg>
);

/** Anime em destaque: alfinete. */
export const IconPin = (p: P) => (
  <Svg {...p}>
    <path d="M9 3.5h6l-1 5 3 3v2H7v-2l3-3Z" />
    <path d="M12 13.5V21" />
  </Svg>
);

/** Selo Premium: estrela de quatro pontas. */
export const IconSpark = (p: P) => (
  <Svg {...p}>
    <path d="M12 3c.6 4.6 3.4 7.4 8 8-4.6.6-7.4 3.4-8 8-.6-4.6-3.4-7.4-8-8 4.6-.6 7.4-3.4 8-8Z" />
  </Svg>
);
