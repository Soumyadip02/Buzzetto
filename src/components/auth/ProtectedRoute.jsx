// src/components/Auth/ProtectedRoute.jsx
import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { auth } from '../../firebase';

function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe(); // Clean up the listener
  }, []);

  if (loading) {
    return <p>Loading...</p>; // Optional: replace with a spinner
  }

  return user ? children : <Navigate to="/login" replace />;
}

export default ProtectedRoute;
