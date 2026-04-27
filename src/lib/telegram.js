export const tg = window.Telegram?.WebApp;

export function initTelegramWebApp() {
  if (!tg) return;

  tg.ready();
  tg.expand();

  tg.setHeaderColor?.("#0b0f0c");
  tg.setBackgroundColor?.("#0b0f0c");

  document.documentElement.style.setProperty(
    "--tg-viewport-height",
    `${tg.viewportHeight}px`,
  );

  tg.onEvent?.("viewportChanged", () => {
    document.documentElement.style.setProperty(
      "--tg-viewport-height",
      `${tg.viewportHeight}px`,
    );
  });
}
