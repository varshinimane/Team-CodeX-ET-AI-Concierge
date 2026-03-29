import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authLogin, authSignup, saveAuthLocally, loadAuthLocally, clearAuth, saveProfileLocally } from "../utils/api.js";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser]     = useState(null);
  const [ready, setReady]   = useState(false);

  useEffect(() => {
    const saved = loadAuthLocally();
    if (saved?.user) setUser(saved.user);
    setReady(true);
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await authLogin(email, password);
    setUser(data.user);
    saveAuthLocally({ user: data.user, token: data.session?.accessToken });
    if (data.profile) saveProfileLocally(data.profile);
    return data;
  }, []);

  const signup = useCallback(async (email, password) => {
    const data = await authSignup(email, password);
    if (data.user && data.session) {
      setUser(data.user);
      saveAuthLocally({ user: data.user, token: data.session.accessToken });
    }
    return data;
  }, []);

  const logout = useCallback(() => { setUser(null); clearAuth(); }, []);

  return (
    <AuthCtx.Provider value={{ user, ready, login, signup, logout, isLoggedIn: !!user }}>
      {children}
    </AuthCtx.Provider>
  );
}
