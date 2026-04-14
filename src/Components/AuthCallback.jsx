import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuth = async () => {
      // 1. Get the session from Supabase (Google just signed them in)
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        navigate('/login', { state: { error: 'Session failed. Please try again.' } });
        return;
      }

      const userEmail = session.user.email;

      try {
        // 2. Check if this email exists in your admin table's gmail column
        const { data: adminProfile, error: adminError } = await supabase
          .from('admin')
          .select('profile_id, account_id, account:account_id(role)')
          .eq('gmail', userEmail)
          .single();

        if (adminError || !adminProfile) {
          // If NOT in admin table, sign them out immediately
          await supabase.auth.signOut();
          navigate('/login', { 
            state: { error: 'Access Denied: This Gmail is not authorized as an Admin.' } 
          });
          return;
        }

        // 3. Successful Login: Route based on the role found in the account table
        const role = adminProfile.account?.role || 'admin';
        navigate(`/${role}`);
        
      } catch (err) {
        console.error('Auth Callback Error:', err);
        navigate('/login', { state: { error: 'An unexpected error occurred.' } });
      }
    };

    handleAuth();
  }, [navigate]);

  return (
    <div className="d-flex justify-content-center align-items-center vh-100">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Verifying Admin Access...</span>
      </div>
    </div>
  );
};

export default AuthCallback;