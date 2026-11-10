export const themes = ["light", "dark", "system"] as const;
export type Theme = (typeof themes)[number];

export const themeInitializer = `(()=>{try{const match=document.cookie.match(/(?:^|; )theme=([^;]*)/);const preference=match?decodeURIComponent(match[1]):"dark";const dark=preference==="dark"||(preference==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",dark);document.documentElement.classList.toggle("light",!dark);document.documentElement.style.colorScheme=dark?"dark":"light"}catch{}})()`;
