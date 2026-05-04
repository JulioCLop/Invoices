import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./Pages/Home";
import InvoicePage from "./Pages/InvoicePage";
import QuotePage from "./Pages/QuotePage";
import "./App.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/invoice" element={<InvoicePage />} />
        <Route path="/quote" element={<QuotePage />} />
      </Routes>
    </Router>
  );
}

export default App;
