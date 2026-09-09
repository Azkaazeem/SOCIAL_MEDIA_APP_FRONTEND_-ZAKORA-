import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { AuthContextProvider } from "./context/AuthContext";
import { SocketContextProvider } from "./context/SocketContext";
import { ThemeContextProvider } from "./context/ThemeContext";
import "./theme.css";
import axios from "axios";

// local link || deploy link
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD 
  ? "https://social-media-app-backend-azka-azeems-projects.vercel.app/api" 
  : "http://localhost:8800/api");

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
