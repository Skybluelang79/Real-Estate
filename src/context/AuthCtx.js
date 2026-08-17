import { createContext, useContext } from 'react';

const AuthContext = createContext(null);

export default AuthContext;

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
