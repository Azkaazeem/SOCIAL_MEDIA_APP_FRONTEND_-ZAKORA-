import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { AuthContextProvider } from "./context/AuthContext";
import { SocketContextProvider } from "./context/SocketContext";
import { ThemeContextProvider } from "./context/ThemeContext";
import "./theme.css";
import axios from "axios";

// local link || deploy link
let API_URL = import.meta.env.VITE_API_URL;

if (import.meta.env.DEV) {
  API_URL = "http://localhost:8800/api";
} else {
  // In production, guard against stale temporary deployment hashes
  if (!API_URL || API_URL.includes("n76p5e555") || API_URL.includes("lqhqmwhkm") || API_URL.includes("9oqaddnz5")) {
    API_URL = "https://social-media-app-backend-tan.vercel.app/api";
  }
}

axios.defaults.baseURL = API_URL;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthContextProvider>
      <SocketContextProvider>
        <ThemeContextProvider>
          <App/>
        </ThemeContextProvider>
      </SocketContextProvider>
    </AuthContextProvider>
  </StrictMode>,
)
