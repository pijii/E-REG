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
        .from('account')
        .select('*')
        .eq('auth_id', authId)
        .maybeSingle();

      if (!account) return null;

      const tableMap = { admin: 'admin', student: 'student', organization: 'organization' };
      const { data: profile } = await supabase
        .from(tableMap[account.role])
        .select('*')
        .eq('account_id', account.account_id)
        .maybeSingle();

      return { role: account.role, account, profile };
    } catch (err) {
      console.error("Fetch User Data Error:", err.message);
      return null;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      if (!mounted) return;
      setLoading(true);

      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user && mounted) {
          const userData = await fetchUserData(session.user.id);
          if (mounted) setUser(userData);
        } else if (mounted) {
          setUser(null);
        }
      } catch (err) {
        console.error("Auth init error:", err);
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initializeAuth();

    // Lightweight listener - avoid deadlock
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth event:", event);   // ← Check this in console!

      if (event === 'SIGNED_IN' && session?.user) {
        setLoading(true);
        // Defer heavy work to prevent deadlock
        setTimeout(async () => {
          if (!mounted) return;
          const userData = await fetchUserData(session.user.id);
          if (mounted) {
            setUser(userData);
            setLoading(false);
          }
        }, 0);
      } 
      else if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
      } 
      else {
        // INITIAL_SESSION and other events
        if (mounted) setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserData]);

  const login = async (email, password, schoolId) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });
      if (error) throw error;

      const userData = await fetchUserData(data.user.id);
      if (!userData) throw new Error("No account found for this user.");

      if (userData.account.school_id && userData.account.school_id !== Number(schoolId)) {
        await supabase.auth.signOut();
        throw new Error("This account belongs to a different school.");
      }

      setUser(userData);
      return userData;
    } catch (err) {
      setUser(null);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);