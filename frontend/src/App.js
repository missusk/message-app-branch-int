import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import SignUp from './components/SignUp';
import SignIn from './components/SignIn';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/signup/:role" element={<SignUp />} />
          <Route path="/login/customers" element={<SignIn role="customers" />} />
          <Route path="/login/agents" element={<SignIn role="agents" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
