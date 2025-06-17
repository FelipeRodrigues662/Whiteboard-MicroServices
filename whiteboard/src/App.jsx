import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Welcome from './pages/Welcome';
import Login from './pages/Login';
import Register from './pages/Register';
import Room from './pages/Room';
import Whiteboard from './pages/Whiteboard';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } 
        />
        <Route 
          path="/register" 
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          } 
        />
        <Route 
          path="/room" 
          element={
            <ProtectedRoute>
              <Room />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/whiteboard/:sessionId" 
          element={
            <ProtectedRoute>
              <Whiteboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/whiteboard" 
          element={<Navigate to="/room" replace />} 
        />
      </Routes>
    </Router>
  );
};

export default App;