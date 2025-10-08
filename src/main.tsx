import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

const root = createRoot(document.getElementById("root")!);

async function bootstrap() {
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("Supabase env missing", { SUPABASE_URL, hasKey: !!SUPABASE_KEY });
    root.render(
      <React.StrictMode>
        <div style={{ padding: 24 }}>
          <h1>Configuração do backend ausente</h1>
          <p>As variáveis de ambiente do backend não foram carregadas. Tente atualizar a página (Ctrl/Cmd+Shift+R). Se persistir, abra o Backend para verificar as configurações.</p>
        </div>
      </React.StrictMode>
    );
    return;
  }

  const App = (await import("./App.tsx")).default;
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

bootstrap();
