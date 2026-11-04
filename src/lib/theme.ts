export const THEME_KEY = "aniora:theme";
/** Nome antigo do app (Cour); migrado no primeiro carregamento. */
export const LEGACY_THEME_KEY = "cour:theme";

/** Roda no <head>, antes da hidratação, para não piscar o tema errado. */
export const themeBootScript = `try{var s=localStorage,t=s.getItem("${THEME_KEY}");if(!t){t=s.getItem("${LEGACY_THEME_KEY}");if(t){s.setItem("${THEME_KEY}",t);s.removeItem("${LEGACY_THEME_KEY}")}}if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;
