import type { Metadata, Viewport } from "next";
import { Dela_Gothic_One, Shippori_Mincho, Zen_Kaku_Gothic_New } from "next/font/google";
import { Suspense, ViewTransition } from "react";
import { AppNav, NavShell } from "@/components/AppNav";
import { InlineScript } from "@/components/InlineScript";
import { LogDrawer } from "@/components/LogDrawer";
import { themeBootScript } from "@/lib/theme";
import { t } from "@/messages";
import "./globals.css";

const dela = Dela_Gothic_One({
  variable: "--font-dela",
  weight: "400",
  subsets: ["latin", "latin-ext"],
});

const zen = Zen_Kaku_Gothic_New({
  variable: "--font-zen",
  weight: ["400", "500", "700"],
  subsets: ["latin", "latin-ext"],
});

// só a frase curta embaixo do nome no perfil: um peso, sem pré-carregar
const shippori = Shippori_Mincho({
  variable: "--font-shippori",
  weight: "600",
  subsets: ["latin", "latin-ext"],
  preload: false,
});

export const metadata: Metadata = {
  title: { default: "Aniora", template: "%s · Aniora" },
  description: t.app.tagline,
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f1ec" },
    { media: "(prefers-color-scheme: dark)", color: "#14161c" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${dela.variable} ${zen.variable} ${shippori.variable} antialiased`} suppressHydrationWarning>
      <head>
        <InlineScript html={themeBootScript} />
      </head>
      <body className="min-h-dvh">
        <Suspense fallback={<NavShell path={null} />}>
          <AppNav />
        </Suspense>
        {/* troca de página com transição (.page em globals.css); sem suporte no navegador, troca direto */}
        <ViewTransition default="page">
          <main className="mx-auto w-full max-w-3xl px-4 pt-6 pb-28 md:pb-12">{children}</main>
        </ViewTransition>
        <LogDrawer />
      </body>
    </html>
  );
}
