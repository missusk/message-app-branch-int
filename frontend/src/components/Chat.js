import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import '../styles/Chat.css'; 
import io from 'socket.io-client';

const socket = io(`${process.env.REACT_APP_API_URL}`, {
  withCredentials: true,
  transports: ['websocket'],
});

const Chat = () => {
  const { userId } = useParams(); 
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const token = localStorage.getItem('token'); 

  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/messages/${userId}`, {   
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true
        });
        setMessages(response.data.messages);
      } catch (err) {
        console.error('Error fetching chat history:', err);
      }
    };

    fetchChatHistory();
  }, [userId, token]);

  // socket.io to update messages in real time

  useEffect(() => {

    socket.on('message', (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });
    return () => {
      socket.off('message');
    };
  }, []);

  const handleSendMessage = async () => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/messages/send`,
        { message_body: newMessage },
        { 
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true
        }
      );
      
      setNewMessage('');

      // Update the chat history with the new message

      setMessages((prevMessages) => [
        ...prevMessages,
        {
          message_body: newMessage,
          sender: 'user',
        },
      ]);
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  return (
    <div className='user'>
        <h1>Chat with an Agent</h1>
        <div className="chat-history-user">
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
