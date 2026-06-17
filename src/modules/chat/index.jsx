import React from "react";
import { Navigate, Route } from "react-router";
import ChatView from "@/modules/chat/pages/chat-view/index.jsx";
import ChatLayout from "@/modules/chat/layout/index.jsx";
import ProfileAwareRoutes from "@/modules/profile/components/profile-aware-routes.jsx";

const CHAT_MOBILE_QUERY = "(max-width: 767px)";
const CHAT_DESKTOP_FALLBACK = "/user/dashboard";

const getIsMobileChatViewport = () => {
  if (typeof window === "undefined") {
    return false;
  }

  return window.matchMedia?.(CHAT_MOBILE_QUERY).matches ?? false;
};

const useIsMobileChatViewport = () => {
  const [isMobile, setIsMobile] = React.useState(getIsMobileChatViewport);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia?.(CHAT_MOBILE_QUERY);

    if (!mediaQuery) {
      setIsMobile(false);
      return undefined;
    }

    const handleChange = () => {
      setIsMobile(mediaQuery.matches);
    };

    handleChange();
    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return isMobile;
};

const ChatModule = () => {
  const isMobileViewport = useIsMobileChatViewport();

  if (!isMobileViewport) {
    return <Navigate to={CHAT_DESKTOP_FALLBACK} replace />;
  }

  return (
    <ProfileAwareRoutes>
      <Route element={<ChatLayout />}>
        <Route index element={<ChatView />} />
        <Route path=":chatId" element={<ChatView />} />
      </Route>
    </ProfileAwareRoutes>
  );
};

export default ChatModule;
