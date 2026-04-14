import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import 'bootstrap/dist/css/bootstrap.min.css';
import './../Styles/Login-SignUp.css';
import logo from '../img/logo/E-Reg.png';

const SignupPage = () => {
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  
  // School State
  const [schools, setSchools] = useState([]);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [isNewSchool, setIsNewSchool] = useState(false);
  const [newSchoolName, setNewSchoolName] = useState('');
  const [newSchoolLocation, setNewSchoolLocation] = useState('');
  const [newSchoolZip, setNewSchoolZip] = useState('');

  // UI State
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    const { data, error } = await supabase
      .from('school')
      .select('school_id, name, location, zip_code')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) console.error('Error fetching schools:', error.message);
    else setSchools(data || []);
  };

  const handleSchoolChange = (e) => {
    const id = e.target.value;
    const school = schools.find(s => s.school_id.toString() === id);
    setSelectedSchool(school || null);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) return setError('Passwords do not match.');
    if (!isNewSchool && !selectedSchool) return setError('Please select your school.');
    if (isNewSchool && !newSchoolName) return setError('Please enter the school name.');

    setLoading(true);

    try {
      // 1. Auth Signup
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      if (authData.user) {
        let finalSchoolId = selectedSchool?.school_id;

        // 2. Handle New School Creation if toggled
        if (isNewSchool) {
          const { data: newSchoolData, error: newSchoolError } = await supabase
            .from('school')
            .insert([{ 
                name: newSchoolName, 
                location: newSchoolLocation, 
                zip_code: newSchoolZip, 
                is_active: true 
            }])
            .select().single();
          
          if (newSchoolError) throw newSchoolError;
          finalSchoolId = newSchoolData.school_id;
        }

        // 3. Account Table (Use 'admin' role if they created the school, else 'student')
        const { data: accData, error: accError } = await supabase
          .from('account')
          .insert([
            {
              auth_id: authData.user.id,
              email: email,
              role: isNewSchool ? 'admin' : 'student',
              school_id: finalSchoolId,
            },
          ])
          .select().single();

        if (accError) throw accError;

        // 4. Create Profile (Admin or Student)
        const profileTable = isNewSchool ? 'admin' : 'student';
        const { error: profileError } = await supabase
          .from(profileTable)
          .insert([
            {
              name: fullName,
              account_id: accData.account_id,
              ...(isNewSchool ? { school_id: finalSchoolId } : {})
            },
          ]);

        if (profileError) throw profileError;

        setSuccess('Account created successfully! Redirecting...');
        setTimeout(() => navigate('/'), 3000);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid p-0 login-container">
      <div className="row g-0 min-vh-100 justify-content-center">
        <div className="col-md-5 brand-section d-flex flex-column justify-content-center align-items-center text-center p-4">
          <img src={logo} alt="E-Reg Logo" className="brand-logo mb-3" />
          <h1 className="brand-title">E-Reg</h1>
          <p className="text-white-50">Secure School Event Management</p>
        </div>

        <div className="col-md-6 align-items-center justify-content-center m-1 my-4">
          <div className="hero-wrapper w-100 p-4">
            <div className="login-card mx-auto" style={{ maxWidth: '500px' }}>
              <h2 className="text-center mb-4">Registration</h2>

              {error && <div className="alert alert-danger">{error}</div>}
              {success && <div className="alert alert-success">{success}</div>}

              <form onSubmit={handleSignup}>
                <div className="mb-3">
                  <label className="form-label-custom">Full Name</label>
                  <input type="text" className="form-control" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                </div>

                <div className="mb-3">
                  <label className="form-label-custom">Email</label>
                  <input type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>

                {/* SCHOOL SECTION */}
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <label className="form-label-custom mb-0">School Details</label>
                    <div className="form-check form-switch">
                      <input 
                        className="form-check-input" 
                        type="checkbox" 
                        id="newSchoolToggle" 
                        checked={isNewSchool} 
                        onChange={() => setIsNewSchool(!isNewSchool)}
                      />
                      <label className="form-check-label small text-muted" htmlFor="newSchoolToggle">Register New School</label>
                    </div>
                  </div>

                  {!isNewSchool ? (
                    <>
                      <select className="form-select mb-2" onChange={handleSchoolChange} value={selectedSchool?.school_id || ""} required>
                        <option value="">Select your School</option>
                        {schools.map((s) => (
                          <option key={s.school_id} value={s.school_id}>{s.name}</option>
                        ))}
                      </select>
                      {selectedSchool && (
                        <div className="p-2 rounded bg-light border border-info-subtle small text-muted">
                          <strong>Loc:</strong> {selectedSchool.location} | <strong>Zip:</strong> {selectedSchool.zip_code}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="p-3 border rounded bg-light">
                      <input type="text" className="form-control mb-2" placeholder="New School Name" value={newSchoolName} onChange={(e) => setNewSchoolName(e.target.value)} required />
                      <input type="text" className="form-control mb-2" placeholder="Location (City/Address)" value={newSchoolLocation} onChange={(e) => setNewSchoolLocation(e.target.value)} />
                      <input type="text" className="form-control" placeholder="Zip Code" value={newSchoolZip} onChange={(e) => setNewSchoolZip(e.target.value)} />
                    </div>
                  )}
                </div>

                <div className="row">
                  <div className="col-6 mb-3">
                    <label className="form-label-custom">Password</label>
                    <input type="password" class="form-control" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  </div>
                  <div className="col-6 mb-3">
                    <label className="form-label-custom">Confirm</label>
                    <input type="password" class="form-control" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                  </div>
                </div>

                <button type="submit" className="btn btn-login w-100 mb-3" disabled={loading}>
                  {loading ? 'Processing...' : 'Complete Signup'}
                </button>

                <div className="text-center">
                  <span className="text-muted">Already have an account? </span>
                  <Link to="/" className="signup-link">Login</Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;