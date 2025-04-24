// src/components/Auth/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { auth } from '../../firebase';

function ProtectedRoute({ children }) {
  const user = auth.currentUser;
  return user ? children : <Navigate to="/login" replace />;
}

export default ProtectedRoute;