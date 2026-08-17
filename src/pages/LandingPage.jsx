// src/pages/LandingPage.jsx
import Navbar from "../components/Navbar";
import HeroLp from "../components/HeroLp";
import HowItWork from "../components/HowItWork";
import Features from "../components/Features";
import Pricing from "../components/Pricing";
import Footer from "../components/Footer";

function LandingPage() {
  return (
    <div>
      <Navbar />
      <HeroLp />
      <HowItWork />
      <Features />
      <Pricing />
      <Footer />
    </div>
  );
}

export default LandingPage; // MUST be at the end, outside the function