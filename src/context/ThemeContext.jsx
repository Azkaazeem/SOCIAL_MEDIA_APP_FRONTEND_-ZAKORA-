import { createContext, useState, useEffect } from "react";

export const ThemeContext = createContext();

export const ThemeContextProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(() => {
    try {
      const savedTheme = localStorage.getItem("zakora_theme");
      if (savedTheme) {
        return savedTheme === "dark";
      }
      return false; // default to light theme
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      const theme = darkMode ? "dark" : "light";
      localStorage.setItem("zakora_theme", theme);
      document.documentElement.setAttribute("data-theme", theme);
      if (darkMode) {
        document.body.classList.add("dark-theme");
        document.body.classList.remove("light-theme");
      } else {
        document.body.classList.add("light-theme");
        document.body.classList.remove("dark-theme");
      }
    } catch (e) {
      console.error("Failed to update theme:", e);
    }
  }, [darkMode]);

  const toggleTheme = () => {
    setDarkMode((prev) => !prev);
  };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
