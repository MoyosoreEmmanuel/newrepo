import { createContext, useContext } from 'react';

interface AuthContextType {
  userId: string | null;
}

const AuthContext = createContext<AuthContextType>({ userId: null });

export const useAuth = () => useContext(AuthContext);