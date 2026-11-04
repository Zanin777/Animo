export const THEME_KEY = "cour:theme";

/** Roda no <head>, antes da hidratação, para não piscar o tema errado. */
export const themeBootScript = `try{var t=localStorage.getItem("${THEME_KEY}");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;
