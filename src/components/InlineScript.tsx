// Script inline que roda só no HTML do servidor (padrão da doc do Next:
// "preventing flash before hydration"). No cliente vira text/plain e o React
// não avisa sobre <script> renderizado.
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
