import { createContext, useEffect, useState } from "react";
import axios from "axios";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(localStorage.getItem("username") || null);
  const [token, setToken] = useState(
    localStorage.getItem("access_token") || null,
  );

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      localStorage.setItem("access_token", token);
    } else {
      delete axios.defaults.headers.common["Authorization"];
      localStorage.removeItem("access_token");
      localStorage.removeItem("username");
    }
  }, [token]);

  const login = async (username, password) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/auth/login/`,
        {
          username,
          password,
        },
      );
      setToken(response.data.access);
      setUser(username);
      localStorage.setItem("username", username);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || "login Failed",
      };
    }
  };
  const logout = () => {
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, token, login, logout, setToken, setUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};
