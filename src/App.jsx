import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage"; // 1. Preloads the AuthPage code

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 2. React Router checks the browser URL */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;