import { useNavigate } from 'react-router-dom';
import '../styles/LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      <h1>Welcome! Choose Your Role</h1>
      <div className="role-cards">
        <div className="role-card" onClick={() => navigate('/auth/customers')}>
          <h2>Customer</h2>
          <p>If you're a customer, sign up or log in here to get started and manage your services. You can chat with our agents.</p>
          <button>Select Customer</button>
        </div>

        <div className="role-card" onClick={() => navigate('/auth/agents')}>
          <h2>Agent</h2>
          <p>If you're an agent, sign up or log in here to manage customer requests. You will see all the assigned and unassigned customers.</p>
          <button>Select Agent</button>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
