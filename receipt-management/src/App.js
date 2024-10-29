import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import ChurchReceiptPage from './components/ChurchReceiptPage/ChurchReceiptPage';
import AdminPage from './components/AdminPage/AdminPage';
import AdminEventPage from './components/AdminPage/AdminEventPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/" element={<ChurchReceiptPage />} />
        <Route path="/admin/events" element={<AdminEventPage />} />
      </Routes>
    </Router>
  );
}

export default App;
