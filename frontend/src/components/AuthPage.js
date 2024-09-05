import { useState } from 'react';
import { useParams } from 'react-router-dom';
import SignUp from './SignUp';
import SignIn from './SignIn';
import '../styles/AuthPage.css'; 

const AuthPage = () => {
  const { role } = useParams();
  const [activeTab, setActiveTab] = useState('signup');

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="tabs">
          <button 
            className={activeTab === 'signup' ? 'active' : ''}
            onClick={() => setActiveTab('signup')}
          >
            Sign Up
          </button>
          <button 
            className={activeTab === 'signin' ? 'active' : ''}
            onClick={() => setActiveTab('signin')}
          >
            Sign In
          </button>
        </div>
        <div className="form-content">
          {activeTab === 'signup' ? <SignUp role={role} /> : <SignIn role={role} />}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
