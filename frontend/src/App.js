import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';

export default function App() {
  const [user, setUser] = useState(null);
  if (!user) {
    return <Routes>
      <Route path="/login" element={<Login onLogin={setUser}/>} />
      <Route path="/register" element={<Register />} />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  }
  return <Dashboard user={user} onLogout={()=>setUser(null)}/>;
}