import Navbar from "./components/Navbar";
import HeroLp from "./components/HeroLp";
import HowItwork from "./components/HowItWork";
import Features from "./components/Features";
import Pricing from "./components/Pricing";
import Footer from "./components/Footer";
function App() {
  return (
       <div>
          <Navbar/>
          <HeroLp/>
          <HowItwork/>
          <Features/>
          <Pricing/>
          <Footer/>
       </div>
  );
}

export default App
