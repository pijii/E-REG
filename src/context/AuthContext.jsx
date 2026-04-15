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

  const switchToOrganization = async (orgAccountId) => {
    setLoading(true);
    try {
      const { data: orgAccount, error: accError } = await supabase
        .from('account')
        .select('*')
        .eq('account_id', orgAccountId)
        .single();

      if (accError) throw accError;

      const { data: orgProfile, error: profError } = await supabase
        .from('organization')
        .select('*')
        .eq('account_id', orgAccountId)
        .single();

      if (profError) throw profError;

      const switchedUser = {
        role: 'organization',
        account: orgAccount,
        profile: orgProfile,
        isSwitched: true 
      };

      setUser(switchedUser);
      sessionStorage.setItem('switched_org_id', orgAccountId);
      return switchedUser;
    } catch (err) {
      console.error("Switching Error:", err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      if (!mounted) return;
      setLoading(true);

      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user && mounted) {
          const switchedOrgId = sessionStorage.getItem('switched_org_id');
          
          if (switchedOrgId) {
            const { data: orgAccount } = await supabase.from('account').select('*').eq('account_id', switchedOrgId).single();
            const { data: orgProfile } = await supabase.from('organization').select('*').eq('account_id', switchedOrgId).single();
            
            if (orgAccount && orgProfile) {
              setUser({ role: 'organization', account: orgAccount, profile: orgProfile, isSwitched: true });
            } else {
              const userData = await fetchUserData(session.user.id);
              setUser(userData);
            }
          } else {
            const userData = await fetchUserData(session.user.id);
            if (mounted) setUser(userData);
          }
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setLoading(true);
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
          sessionStorage.removeItem('switched_org_id');
          setUser(null);
          setLoading(false);
        }
      } 
      else {
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
      sessionStorage.removeItem('switched_org_id');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, switchToOrganization }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);