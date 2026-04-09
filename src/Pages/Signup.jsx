import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './../Styles/Login-SignUp.css';
import logo from '../img/logo/E-Reg.png';

const LoginPage = () => {
  return (
    <div className="container-fluid p-0 login-container">
      <div className="row g-0 min-vh-100">

        {/* LEFT SIDE */}
        <div className="col-md-6 brand-section d-flex flex-column justify-content-center align-items-center text-center">
          <img 
            src={logo} 
            alt="E-Reg Logo" 
            className="brand-logo mb-3"
          />
          <h1 className="brand-title">E-Reg</h1>
        </div>

        {/* RIGHT SIDE */}
        <div className="col-md-6 d-flex align-items-center justify-content-center">
          <div className="hero-wrapper w-100">
            <div className="login-card mx-auto">

              <h2 className="text-center mb-4">Sign Up</h2>

              <form>

                {/* EMAIL */}
                <div className="mb-3">
                  <label className="form-label-custom">Email</label>
                  <input 
                    type="email" 
                    className="form-control shadow-sm" 
                    placeholder="Enter your email"
                  />
                </div>

                {/* PASSWORD */}
                <div className="mb-3">
                  <label className="form-label-custom">Password</label>
                  <input 
                    type="password" 
                    className="form-control shadow-sm" 
                    placeholder="Enter your password"
                  />
                </div>

                {/* CONFIRM PASSWORD */}
                <div className="mb-3">
                  <label className="form-label-custom">Confirm Password</label>
                  <input 
                    type="password" 
                    className="form-control shadow-sm" 
                    placeholder="Confirm password"
                  />
                </div>

                {/* SCHOOL */}
                <div className="mb-4">
                  <label className="form-label-custom">School</label>
                  <select className="form-select shadow-sm">
                    <option value="">Select School</option>
                    <option value="1">School A</option>
                    <option value="2">School B</option>
                  </select>
                </div>

                {/* BUTTON */}
                <button type="submit" className="btn btn-login w-100 mb-3">
                  Sign Up
                </button>

                {/* LINK */}
                <div className="text-center">
                  <span className="text-muted">Already have an account? </span>
                  <a href="#" className="signup-link">Login</a>
                </div>

              </form>
            </div>
          </div>
        </div>

      </div>

      {/* FOOTER */}
      <footer className="login-footer text-center py-5">
        <small>© 2026 E-Reg | School Event System</small>
      </footer>
    </div>
  );
};

export default LoginPage;