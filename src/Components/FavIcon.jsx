import { useEffect } from 'react';
import logo from '../img/logo/E-Reg.png'; // make sure this path matches your src structure

export default function Favicon() {
  useEffect(() => {
    // Create a <link> element
    const link = document.createElement('link');
    link.rel = 'icon';
    link.type = 'image/png';
    link.href = logo; // use the imported logo from src

    // Remove any existing favicons
    const existing = document.querySelectorAll('link[rel="icon"]');
    existing.forEach(e => e.parentNode.removeChild(e));

    // Append the new favicon
    document.head.appendChild(link);

    // Cleanup on unmount
    return () => {
      const current = document.querySelectorAll('link[rel="icon"]');
      current.forEach(e => e.parentNode.removeChild(e));
    };
  }, []);

  return null; // This component does not render anything visible
}