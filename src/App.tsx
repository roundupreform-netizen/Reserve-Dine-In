/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ReservationScreen from './views/ReservationScreen';
import DashboardScreen from './views/DashboardScreen';
import AuthScreen from './views/AuthScreen';

function AppRoutes() {
  const { user, userData, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/auth" element={!user ? <AuthScreen /> : <Navigate to="/" />} />
      <Route 
        path="/" 
        element={
          user ? (
            userData?.role === 'admin' ? <Navigate to="/admin" /> : <ReservationScreen />
          ) : (
            <Navigate to="/auth" />
          )
        } 
      />
      <Route 
        path="/admin" 
        element={
          user && userData?.role === 'admin' ? (
            <DashboardScreen />
          ) : (
            <Navigate to="/" />
          )
        } 
      />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
