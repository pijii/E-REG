import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import '../Styles/Login-SignUp.css';
import logo from '../img/logo/E-Reg.png';

const googleIcon = "https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png";

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [school, setSchool] = useState('');
  const [schools, setSchools] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  // Show errors passed from the AuthCallback (e.g., "Access Denied: Gmail not found in Admin table")
  useEffect(() => {
    if (location.state?.error) {
      setError(location.state.error);
    }
  }, [location]);

  // Fetch active schools for the dropdown
  useEffect(() => {
    const fetchSchools = async () => {
      const { data, error } = await supabase
        .from('school')
        .select('school_id, name')
        .eq('is_active', true)
        .order('name', { ascending: true });
      
      if (error) {
        console.error('Error fetching schools:', error.message);
      } else {
        setSchools(data || []);
      }
    };
    fetchSchools();
  }, []);

  /**
   * handleGoogleLogin
   * Initiates Supabase OAuth with Google.
   * Logic: The user is redirected to Google. After signing in, they return to /auth/callback.
   * In the AuthCallback component, you should verify if the Google email exists 
   * in the 'admin' table's 'gmail' column before allowing access.
   */
  const handleGoogleLogin = async () => {
    setError('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // MUST match the redirect URI set in Supabase Dashboard
        redirectTo: `${window.location.origin}/E-REG/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account',
        },
      },
    });

    if (error) {
      setError(error.message);
    }
  };

  /**
   * handleForgotPassword
   * Checks the 'admin' table to see if the entered email matches a 'gmail' entry.
   * If found, it sends the reset link to the primary account email linked to that admin.
   */
  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email/gmail first');
      return;
    }
    setError('');
    setMessage('');
    try {
      // Look up the admin table to find the associated account email
      const { data, error: dbError } = await supabase
        .from('admin')
        .select('account:account_id(email)')
        .eq('gmail', email)
        .single();

      const resetEmail = data?.account?.email || email;

      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/E-REG/update-password`,
      });

      if (error) throw error;
      setMessage('Reset link sent! Please check your email inbox.');
    } catch (err) {
      setError(err.message);
    }
  };

  /**
   * handleSubmit
   * Standard Email/Password login logic.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const userData = await login(email, password, school);
      const paths = { 
        admin: '/admin', 
        organization: '/organization', 
        student: '/student' 
      };
      navigate(paths[userData.role] || '/student');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-container d-flex flex-column min-vh-100">
      <div className="container-fluid flex-grow-1">
        <div className="row flex-column flex-lg-row p-lg-4">
          
          <div className="brand-section col-12 col-lg-6 d-flex flex-column align-items-center justify-content-center">
            <img src={logo} alt="E-Reg Logo" className="brand-logo" />
            <h1 className="brand-title">E-Reg</h1>
          </div>

          <div className="col-12 col-lg-6 d-flex justify-content-center align-items-center my-5 my-lg-0">
            <div className="hero-wrapper w-100 p-4">
              <div className="login-card">
                <h2>Login</h2>
                
                {error && <div className="alert alert-danger">{error}</div>}
                {message && <div className="alert alert-success">{message}</div>}

                <form onSubmit={handleSubmit}>
                  <div className="mb-3 text-start">
                    <label className="form-label">Email / Admin Gmail</label>
                    <input
                      type="email"
                      className="form-control"
                      value={email}
                      placeholder="Enter your email"
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-3 text-start">
                    <div className="d-flex justify-content-between">
                      <label className="form-label">Password</label>
                      <button 
                        type="button" 
                        className="btn btn-link p-0 text-decoration-none" 
                        onClick={handleForgotPassword} 
                        style={{ fontSize: '0.8rem' }}
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <input
                      type="password"
                      className="form-control"
                      value={password}
                      placeholder="Enter your password"
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-3 text-start">
                    <label className="form-label">School</label>
                    <select 
                      className="form-select" 
                      value={school} 
                      onChange={(e) => setSchool(e.target.value)} 
                      required
                    >
                      <option value="" disabled selected hidden>Select your school</option>
                      {schools.map((s) => (
                        <option key={s.school_id} value={s.school_id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button 
                    type="submit" 
                    className="btn btn-login w-100 mb-3" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Logging in...' : 'Log in'}
                  </button>
                </form>

                <div className="divider d-flex align-items-center my-3">
                  <hr className="flex-grow-1" />
                  <span className="mx-2 text-muted">OR</span>
                  <hr className="flex-grow-1" />
                </div>

                <button 
                  type="button" 
                  className="btn btn-outline-dark w-100 d-flex align-items-center justify-content-center" 
                  onClick={handleGoogleLogin}
                >
                  <img src={googleIcon} alt="G" style={{ width: '20px', marginRight: '10px' }} />
                  Continue with Admin Gmail
                </button>

                <p className="mt-4 signup-link">
                  Don't have an account? <Link to="/signup">Sign up here</Link>
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};

export default Login;