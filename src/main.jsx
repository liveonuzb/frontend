import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Router from "@/router/index.jsx";
import Providers from "@/providers/index.jsx";
import { BrowserRouter } from "react-router";
import "@/lib/i18n.js";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Providers>
        <Router />
      </Providers>
    </BrowserRouter>
  </StrictMode>,
);
