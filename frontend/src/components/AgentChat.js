import { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/Chat.css'; 
import { FaSearch } from 'react-icons/fa'; 

const AgentChat = () => {
  const { userId } = useParams(); 
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [unassignedMessages, setUnassignedMessages] = useState([]);
  const [activeUser, setActiveUser] = useState(userId); 
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState(''); 
  const [isSearchActive, setIsSearchActive] = useState(false); 
  const [messageSearchTerm, setMessageSearchTerm] = useState(''); 
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  // Fetch assigned and unassigned users
  useEffect(() => {
    const fetchAssignedUsers = async () => {
      try {
        const response = await axios.get('http://localhost:5000/agents/assigned-users', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setAssignedUsers(response.data.users);
      } catch (err) {
        console.error('Error fetching assigned users:', err);
      }
    };

    const fetchUnassignedMessages = async () => {
      try {
        const response = await axios.get('http://localhost:5000/unassigned-messages', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUnassignedMessages(response.data.unassignedMessages);
      } catch (err) {
        console.error('Error fetching unassigned messages:', err);
      }
    };

    fetchAssignedUsers();
    fetchUnassignedMessages();
  }, [token]);

  // Fetch unique unassigned users for display
  const uniqueUnassignedUsers = unassignedMessages.reduce((unique, user) => {
    if (!unique.some((u) => u.user_id === user.user_id)) {
      unique.push(user);
    }
    return unique;
  }, []);

  // Fetch chat history whenever activeUser changes
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

  // Handle selecting a user from the list and immediately update activeUser
  const handleUserSelect = (userId) => {
    setActiveUser(userId);  
    navigate(`/agent/chat/${userId}`);  
  };

  // Handle sending a message
  const handleSendMessage = async () => {
    try {
      const isUnassigned = unassignedMessages.some((message) => message.user_id === activeUser);
      const endpoint = isUnassigned ? '/respond-and-assign' : '/messages/respond-by-user';

      const response = await axios.post(
        `http://localhost:5000${endpoint}`,
        { user_id: activeUser, response_body: newMessage },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        }
      );

      if (isUnassigned) {
        setAssignedUsers((prevAssigned) => [
          ...prevAssigned,
          { user_id: activeUser, username: response.data.username }
        ]);

        setUnassignedMessages((prevUnassigned) =>
          prevUnassigned.filter((message) => message.user_id !== activeUser)
        );
      }

      setNewMessage(''); 
      setMessages((prevMessages) => [
        ...prevMessages,
        { message_body: newMessage, sender: 'agent' }
      ]);

    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  // Filter assigned users and unassigned users based on the search term
  const filteredAssignedUsers = assignedUsers.filter((user) =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUnassignedUsers = uniqueUnassignedUsers.filter((message) =>
    message.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredMessages = messages.filter((message) =>
    message.message_body.toLowerCase().includes(messageSearchTerm.toLowerCase())
  );

  return (
    <div className="chat-container">
      <div className="left-pane">
        <input
          type="text"
          className="search-input"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)} 
        />

        <h3>Assigned Chats</h3>
        <div className="assigned-chats">
          {filteredAssignedUsers.map((user) => (
            <button
              key={user.user_id}
              className={`chat-button ${activeUser === user.user_id ? 'active' : ''}`} 
              onClick={() => handleUserSelect(user.user_id)}
            >
              {user.username}
            </button>
          ))}
        </div>

        <h3>Unassigned Chats</h3>
        <div className="unassigned-chats">
          {filteredUnassignedUsers.map((message) => (
            <button
              key={message.message_id}
              className={`chat-button ${activeUser === message.user_id ? 'active' : ''}`} 
              onClick={() => handleUserSelect(message.user_id)}
            >
              {message.username}
            </button>
          ))}
        </div>
      </div>

      <div className="chat-card">
        <div className="chat-header">
          <h2>
            Chat with {filteredAssignedUsers.find(user => user.user_id === activeUser)?.username || 
            filteredUnassignedUsers.find(message => message.user_id === activeUser)?.username || 'User'}
          </h2>

          {!isSearchActive && (
            <FaSearch 
              className="search-icon" 
              onClick={() => setIsSearchActive(true)} 
              style={{ cursor: 'pointer', color: 'white' }} 
            />
          )}

          {isSearchActive && (
            <input 
              type="text" 
              className="message-search-input"
              placeholder="Search messages..." 
              value={messageSearchTerm}
              onChange={(e) => setMessageSearchTerm(e.target.value)}
              onBlur={() => setIsSearchActive(false)} 
            />
          )}
        </div>

        <div className="chat-history">
          {filteredMessages.map((message, index) => (
            <div
              key={index}
              className={`message ${message.sender === 'agent' ? 'user-message' : 'agent-message'}`}
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
          <button className="chat-input-button" onClick={handleSendMessage}>Send</button>
        </div>
      </div>
    </div>
  );
};

export default AgentChat;
