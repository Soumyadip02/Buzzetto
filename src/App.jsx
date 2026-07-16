import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import Login from "./components/login";
import Register from "./components/register";
import Dashboard from "./components/dashboard";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { AuthProvider } from "./contexts/AuthContext.jsx";

function App() {
  useEffect(() => {
    const existingScript = document.getElementById("gtag-js");
    if (!existingScript) {
      const script = document.createElement("script");
      script.id = "gtag-js";
      script.async = true;
      script.src = "https://www.googletagmanager.com/gtag/js?id=G-KRDZCX48BB";
      document.head.appendChild(script);
      script.onload = () => {
        window.dataLayer = window.dataLayer || [];
        function gtag(...args) {
          window.dataLayer.push(args);
        }
        window.gtag = window.gtag || gtag;
        window.gtag("js", new Date());
        window.gtag("config", "G-KRDZCX48BB");
      };
    }
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
