import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useToast } from "@/hooks/use-toast";
import { authApi, clearToken, isAuthenticated, setToken } from "@/lib/api";

interface AuthContextType {
  isLoggedIn: boolean;
  user: any;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(isAuthenticated());
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const storedUser = localStorage.getItem("auth_user");
    if (storedUser) {
      try { setUser(JSON.parse(storedUser)); } catch {}
    }
  }, []);

  const login = async (username: string, password: string) => {
    setLoading(true);
    try {
      const res = await authApi.login({ username, password }) as any;
      console.log(res);
      setToken(res.token);
      setUser(res.userId);
      localStorage.setItem("auth_user", JSON.stringify(res.userId));
      setIsLoggedIn(true);
    } catch (err: any) {
      toast({ title: "Đăng nhập thất bại", description: err.message, variant: "destructive" });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    clearToken();
    localStorage.removeItem("auth_user");
    setUser(null);
    setIsLoggedIn(false);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
