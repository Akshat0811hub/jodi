import { Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import AuthPage from "./pages/AuthPage";
import PublicForm from "./components/publicForm";


function App() {
  return (
    <Routes>
      <Route path="/" element={<AuthPage />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/public-form" element={<PublicForm />} />
    </Routes>
  );
}

export default App;
