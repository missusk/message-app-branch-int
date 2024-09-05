import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import AuthPage from './components/AuthPage';
import Chat from './components/Chat';  // User-side chat
import AgentChat from './components/AgentChat';  // Agent-side chat

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth/:role" element={<AuthPage />} />
          <Route path="/chat/:userId" element={<Chat />} /> {/* User chat route */}
          <Route path="/agent/chat/:userId" element={<AgentChat />} /> {/* Agent chat route */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
