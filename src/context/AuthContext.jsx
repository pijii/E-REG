// AuthContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = useCallback(async (authId) => {
    try {
      const { data: account } = await supabase
        .from('Account')
        .select('*')
        .eq('auth_id', authId)
        .maybeSingle();

      if (!account) return null;

      const tableMap = { admin: 'Admin', student: 'Student', organization: 'Organization' };
      const { data: profile } = await supabase
        .from(tableMap[account.role])
        .select('*')
        .eq('account_id', account.account_id)
        .maybeSingle();

      return { role: account.role, account, profile };
    } catch (err) {
      console.error("Auth Error:", err.message);
      return null;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && mounted) {
        const userData = await fetchUserData(session.user.id);
        setUser(userData);
      }
      setLoading(false);
    };

    init();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const userData = await fetchUserData(session.user.id);
        if (mounted) setUser(userData);
      } else if (event === 'SIGNED_OUT') {
        if (mounted) setUser(null);
      }
      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [fetchUserData]);

  const login = async (email, password, schoolId) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password.trim(),
    });
    if (error) { setLoading(false); throw error; }

    const userData = await fetchUserData(data.user.id);
    if (!userData) {
      setUser(null);
      setLoading(false);
      throw new Error("No account found for this user.");
    }

    if (userData.account.school_id && userData.account.school_id !== Number(schoolId)) {
      await supabase.auth.signOut();
      setUser(null);
      setLoading(false);
      throw new Error("This account belongs to a different school.");
    }

    setUser(userData);
    setLoading(false);
    return userData;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);