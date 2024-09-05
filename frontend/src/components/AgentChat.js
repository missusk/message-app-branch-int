import { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/Chat.css'; 

const AgentChat = () => {
  const { userId } = useParams(); 
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [unassignedMessages, setUnassignedMessages] = useState([]);
  const [activeUser, setActiveUser] = useState(userId);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const token = localStorage.getItem('token'); 
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch assigned users
    const fetchAssignedUsers = async () => {
      try {
        const response = await axios.get('http://localhost:5000/agents/assigned-users', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setAssignedUsers(response.data.users); // Now contains user_id and username
      } catch (err) {
        console.error('Error fetching assigned users:', err);
      }
    };
        
    // Fetch unassigned messages
    const fetchUnassignedMessages = async () => {
      try {
        const response = await axios.get('http://localhost:5000/unassigned-messages', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUnassignedMessages(response.data.unassignedMessages); // Now contains username
      } catch (err) {
        console.error('Error fetching unassigned messages:', err);
      }
    };

    fetchAssignedUsers();
    fetchUnassignedMessages();
  }, [token]);

  // Fetch unique unassigned users for display
  const uniqueUnassignedUsers = unassignedMessages.reduce((unique, message) => {
    if (!unique.some((u) => u.user_id === message.user_id)) {
      unique.push(message);
    }
    return unique;
  }, []);

  // Fetch chat history when activeUser changes
  useEffect(() => {
    if (activeUser) {
      const fetchChatHistory = async () => {
        try {
          const response = await axios.get(`http://localhost:5000/messages/${activeUser}`, {
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
    }
  }, [activeUser, token]);

  // Handle selecting a user from the list
  const handleUserSelect = (userId) => {
    setActiveUser(userId); 
    navigate(`/agent/chat/${userId}`); 
  };

  // Handle sending a message for both assigned and unassigned users
  const handleSendMessage = async () => {
    try {
      if (isUserUnassigned(activeUser)) {
        // Respond and assign if unassigned
        await axios.post(
          `http://localhost:5000/respond-and-assign`,
          { user_id: activeUser, response_body: newMessage },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        // Move the user from unassigned to assigned
        const updatedUnassigned = unassignedMessages.filter(message => message.user_id !== activeUser);
        setUnassignedMessages(updatedUnassigned);
        setAssignedUsers(prevAssignedUsers => [...prevAssignedUsers, { user_id: activeUser }]);
      } else {
        // Respond to assigned user
        await axios.post(
          `http://localhost:5000/messages/respond-by-user`,
          { user_id: activeUser, response_body: newMessage },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }

      // Clear message input
      setNewMessage('');
      setMessages((prevMessages) => [
        ...prevMessages,
        { message_body: newMessage, sender: 'agent' }, 
      ]);
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  // Check if a user is unassigned
  const isUserUnassigned = (userId) => {
    return uniqueUnassignedUsers.some(user => user.user_id === userId);
  };

  return (
    <div className="chat-container">
      <div className="left-pane">
        <h3>Assigned Chats</h3>
        <div className="assigned-chats">
          {assignedUsers.map((user) => (
            <button
              key={user.user_id}
              className={`chat-button ${activeUser === user.user_id ? 'active' : ''}`}
              onClick={() => handleUserSelect(user.user_id)}
            >
              {user.username} {/* Now displaying username */}
            </button>
          ))}
        </div>

        <h3>Unassigned Chats</h3>
        <div className="unassigned-chats">
          {uniqueUnassignedUsers.map((message) => (
            <button
              key={message.user_id}
              className={`chat-button ${activeUser === message.user_id ? 'active' : ''}`}
              onClick={() => handleUserSelect(message.user_id)}
            >
              {message.username} {/* Now displaying username */}
            </button>
          ))}
        </div>
      </div>

      <div className="chat-card">
        <div className="chat-history">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`message ${message.sender === 'user' ? 'agent-message' : 'user-message'}`}
            >
              <p className="text-in-message">{message.message_body}</p>
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
          <button className="chat-input-button" onClick={handleSendMessage}>Send</button>
        </div>
      </div>
    </div>
  );
};

export default AgentChat;
