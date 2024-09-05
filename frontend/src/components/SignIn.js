import { useState } from 'react';
import axios from 'axios';

const SignIn = ({ role }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(`http://localhost:5000/${role}/login`, {
        username,
        password
      });

      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        alert('Login successful!');
      } else {
        alert('Login failed. Please try again.');
      }
    } catch (err) {
      console.error('Login failed:', err.response ? err.response.data : err.message);
      alert('Login failed. Please try again.');
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
          required
        />
        <button type="submit">Sign In</button>
      </form>
    </div>
  );
};

export default SignIn;
