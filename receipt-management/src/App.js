import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import ChurchReceiptPage from "./components/ChurchReceiptPage/ChurchReceiptPage";
import AdminPage from "./components/AdminPage/AdminPage";
import AdminEventPage from "./components/AdminPage/AdminEventPage";
import ChurchRegisterPage from "./components/ChurchRegisterPage/ChurchRegisterPage";
import SendFilePage from "./components/ChurchRegisterPage/SendFilePage";
import MainPage from "./components/MainPage";
import EventFormRouter from "./components/ChurchRegisterPage/EventFormRouter";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/reciept" element={<ChurchReceiptPage />} />
        <Route path="/register" element={<ChurchRegisterPage />} />
        <Route path="/register/:eventCode" element={<EventFormRouter />} />
        <Route path="/check" element={<SendFilePage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/adminevent" element={<AdminEventPage />} />
      </Routes>
    </Router>
  );
}

export default App;
