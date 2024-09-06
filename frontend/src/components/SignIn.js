import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const SignIn = ({ role }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/${role}/login`, {
        username,
        password,
      }, 
    {withCredentials: true});

      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
        const userId = response.data.user_id || response.data.agent_id; 
        localStorage.setItem("userId", userId);  
        
        if (role === 'customers') {
          // Redirect customers to the user chat page
          navigate(`/chat/${userId}`);
        } else if (role === 'agents') {
          // Redirect agents to the agent chat page
          navigate(`/agent/chat/0`);
        }
      } else {
        alert("Login failed. Please try again.");
      }
    } catch (err) {
      console.error("Login failed:", err.response ? err.response.data : err.message);
      alert("Login failed. Please try again.");
    }
  };

  return (
    <div>
      <h2>Sign In as {role === 'customers' ? 'Customer' : 'Agent'}</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">Sign In</button>
      </form>
    </div>
  );
};

export default SignIn;
