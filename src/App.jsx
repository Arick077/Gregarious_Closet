import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import SignUpPage from "./pages/SignUp";
import DashboardPage from "./pages/DashboardPage";
import ReaderPage from "./pages/ReaderPage";
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 2. React Router checks the browser URL */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/reader/:bookId" element={<ReaderPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;