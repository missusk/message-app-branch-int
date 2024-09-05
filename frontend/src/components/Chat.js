import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import '../styles/Chat.css'; // Optional for styling

const Chat = () => {
  const { userId } = useParams(); // Get userId from the URL
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const token = localStorage.getItem('token'); // Get the stored token

  // Fetch chat history when the component mounts
  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/messages/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setMessages(response.data.messages);
      } catch (err) {
        console.error('Error fetching chat history:', err);
      }
    };

    fetchChatHistory();
  }, [userId, token]);

  // Handle sending a message
  const handleSendMessage = async () => {
    try {
      // Send the message to the server
      const response = await axios.post(
        `http://localhost:5000/messages/send`,
        { message_body: newMessage },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      // Clear the input after sending the message
      setNewMessage('');

      // Add the newly sent message to the state to reflect it in the chat UI
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          message_body: newMessage,
          sender: 'user', // Mark this as sent by the user
        },
      ]);
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  return (
    <div>
        <div className="chat-history">
        {messages.map((message, index) => (
            <div 
            key={index} 
            className={`message ${message.sender === 'user' ? 'user-message' : 'agent-message'}`}
            >
            <p className='text-in-message'>{message.message_body}</p>
            </div>
        ))}
        </div>

      <div className="chat-input">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
        />
        <button onClick={handleSendMessage}>Send</button>
      </div>
    </div>
  );
};

export default Chat;
