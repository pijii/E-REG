import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import '../Styles/Login-SignUp.css';
import logo from '../img/logo/E-Reg.png';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [school, setSchool] = useState('');
  const [schools, setSchools] = useState([]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const fetchSchools = async () => {
      const { data, error } = await supabase
        .from('school')
        .select('school_id, name')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) console.error('Error fetching schools:', error.message);
      else setSchools(data || []);
    };
    fetchSchools();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password || !school) {
      setError('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const userData = await login(email, password, school);

      if (userData.role === 'admin') navigate('/admin');
      else if (userData.role === 'organization') navigate('/organization');
      else navigate('/student');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
      console.log('Supabase URL:', process.env.REACT_APP_SUPABASE_URL);
      console.log('Supabase Key:', process.env.REACT_APP_SUPABASE_ANON_KEY ? 'Exists' : 'Missing');
    }
  };

  return (
    <div className="login-container d-flex flex-column min-vh-100">
      <div className="container-fluid flex-grow-1">
        <div className="row flex-column flex-lg-row">
          {/* Logo Section */}
          <div className="brand-section col-12 col-lg-6 d-flex flex-column align-items-center justify-content-center">
            <img src={logo} alt="E-Reg Logo" className="brand-logo" />
            <h1 className="brand-title">E-Reg</h1>
          </div>

          {/* Login Form */}
          <div className="col-12 col-lg-6 d-flex justify-content-center align-items-center">
            <div className="hero-wrapper w-100 p-4">
              <div className="login-card">
                <h2>Login</h2>
                {error && <div className="alert alert-danger">{error}</div>}

                <form onSubmit={handleSubmit}>
                  <div className="mb-3 text-start">
                    <label className="form-label">Email</label>
                    <input
                      type="text"
                      className="form-control"
                      value={email}
                      placeholder="Enter your email"
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-3 text-start">
                    <label className="form-label">Password</label>
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
                      <option value="">Select your school</option>
                      {schools.map((s) => (
                        <option key={s.school_id} value={s.school_id}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  <button type="submit" className="btn btn-login w-100" disabled={isSubmitting}>
                    {isSubmitting ? 'Logging in...' : 'Log in'}
                  </button>
                </form>

                <p className="mt-3 signup-link">
                  Don't have an account? <Link to="/signup">Sign up here</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-dark text-light text-center py-4 mt-auto w-100">
        <p>&copy; {new Date().getFullYear()} E-Reg System. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Login;