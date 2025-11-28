import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./Pages/Home";
import InvoicePage from "./Pages/InvoicePage";
import Transactions from "./Pages/Transactions";
import Insights from "./Pages/Insights";
import Quote from "./Pages/Quote";
import Projects from "./Pages/Projects";
import AppNavigation from "./Components/AppNavigation";
import Schedule from "./Pages/Schedule";
import Expenses from "./Pages/Expenses";
import TaxAssistant from "./Pages/TaxAssistant";
import "./App.css";

function App() {
  return (
    <Router>
      <AppNavigation />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/invoice" element={<InvoicePage />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/insights" element={<Insights />} />
        <Route path="/quote" element={<Quote />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/expenses" element={<Expenses />} />
        <Route path="/tax" element={<TaxAssistant />} />
      </Routes>
    </Router>
  );
}

export default App;
