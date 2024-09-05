import { useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const SignUp = () => {
  const { role } = useParams();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(`http://localhost:5000/${role}/signup`, {
        username,
        password
      });

      if (response.status === 201) {
        alert('Sign up successful! Please log in.');
      } else {
        alert('Sign up failed. Please try again.');
      }
    } catch (err) {
      console.error('Sign up failed:', err.response ? err.response.data : err.message);
      alert('Sign up failed. Please try again.');
    }
  };

  return (
    <div>
      <h2>Sign Up as {role === 'customers' ? 'Customer' : 'Agent'}</h2>
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
        <button type="submit">Sign Up</button>
      </form>
    </div>
  );
};

export default SignUp;
