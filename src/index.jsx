import React from 'react';
import ReactDOM from 'react-dom/client';
import './Styles/index.css';
import App from './Pages/App';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import { HashRouter, Router } from 'react-router-dom';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <HashRouter>          // ← changed here
      <App />
    </HashRouter>
  </React.StrictMode>
);
