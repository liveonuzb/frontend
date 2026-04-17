import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { useTelegram } from "@/hooks/use-telegram";

const ROOT_PATHS = ["/", "/user", "/user/home"];

export function useTelegramBackButton() {
  const { tg, isTelegramWebApp } = useTelegram();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isTelegramWebApp) return;

    const isRoot = ROOT_PATHS.includes(location.pathname);

    if (isRoot) {
      tg.BackButton.hide();
    } else {
      tg.BackButton.show();
      const handler = () => navigate(-1);
      tg.BackButton.onClick(handler);
      return () => tg.BackButton.offClick(handler);
    }
  }, [tg, isTelegramWebApp, location.pathname, navigate]);
}
