import React from "react";
import { Route, Routes } from "react-router";
import ChatView from "@/modules/chat/pages/chat-view/index.jsx";
import ChatLayout from "@/modules/chat/layout/index.jsx";

const ChatModule = () => {
  return (
    <Routes>
      <Route element={<ChatLayout />}>
        <Route index element={<ChatView />} />
        <Route path=":chatId" element={<ChatView />} />
      </Route>
    </Routes>
  );
};

export default ChatModule;
