import { createContext, useState, useEffect, useContext } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem("token"));

  // Configure axios defaults
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      loadUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const loadUser = async () => {
    try {
      const response = await axios.get("/api/auth/profile");
      setUser(response.data);
    } catch (error) {
      console.error("Load user error:", error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post("/api/auth/login", { email, password });
      const { token, user } = response.data;

      localStorage.setItem("token", token);
      setToken(token);
      setUser(user);
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      toast.success(`Welcome back, ${user.username}! 🔥`);
      return true;
    } catch (error) {
      const message = error.response?.data?.error || "Login failed";
      toast.error(message);
      return false;
    }
  };

  const register = async (username, email, password) => {
    try {
      const response = await axios.post("/api/auth/register", {
        username,
        email,
        password,
      });
      const { token, user } = response.data;

      localStorage.setItem("token", token);
      setToken(token);
      setUser(user);
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      toast.success(`Welcome to CodeNest, ${user.username}! 🚀`);
      return true;
    } catch (error) {
      const message = error.response?.data?.error || "Registration failed";
      toast.error(message);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common["Authorization"];
    toast.success("Logged out successfully");
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateUser,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
