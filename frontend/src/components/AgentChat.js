import { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/Chat.css'; 
import { FaSearch } from 'react-icons/fa'; 
import io from 'socket.io-client';

const socket = io(`${process.env.REACT_APP_API_URL}`, {
  withCredentials: true,
  transports: ['websocket'],
});

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

      const fetchAssignedUsers = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/agents/assigned-users`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true
        });
        setAssignedUsers(response.data.users);
      } catch (err) {
        console.error('Error fetching assigned users:', err);
      }
    };

    const fetchUnassignedMessages = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/unassigned-messages`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true
        });
        setUnassignedMessages(response.data.unassignedMessages);
      } catch (err) {
        console.error('Error fetching unassigned messages:', err);
      }
    };
  
  useEffect(() => {
    fetchAssignedUsers();
    fetchUnassignedMessages();
  }, [token]);

  // socket.io to update messages in real time

  useEffect(() => {
    socket.on('new_message', (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });
    
    return () => {
      socket.off('new_message');
    };
  }, []);

  const uniqueUnassignedUsers = unassignedMessages.reduce((unique, user) => {
    if (!unique.some((u) => u.user_id === user.user_id)) {
      unique.push(user);
    }
    return unique;
  }, []);


  useEffect(() => {
    if (activeUser) {
      const fetchChatHistory = async () => {
        try {
          const response = await axios.get(`${process.env.REACT_APP_API_URL}/messages/${activeUser}`, {
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
    }
  }, [activeUser, token]);

  // open chat history from left menu

  const handleUserSelect = (userId) => {
    setActiveUser(userId);  
    navigate(`/agent/chat/${userId}`);  
  };

  const handleSendMessage = async () => {
  try {
    const isUnassigned = unassignedMessages.some((message) => message.user_id === activeUser);
    const endpoint = isUnassigned ? '/respond-and-assign' : '/messages/respond-by-user';

    const response = await axios.post(
      `${process.env.REACT_APP_API_URL}${endpoint}`,
      { user_id: activeUser, response_body: newMessage },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true
      }
    );

    // change position of user from unassigned to assigned

    if (isUnassigned) {
      setAssignedUsers((prevAssigned) => [
        ...prevAssigned,
        { user_id: activeUser, username: response.data.username }
      ]);

      setUnassignedMessages((prevUnassigned) =>
        prevUnassigned.filter((message) => message.user_id !== activeUser)
      );

      fetchAssignedUsers(); 
    }

    setNewMessage(''); 

    // show sent message in chat

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
    user.username?.toLowerCase().includes(searchTerm?.toLowerCase())
  );

  const filteredUnassignedUsers = uniqueUnassignedUsers.filter((message) =>
    message.username?.toLowerCase().includes(searchTerm?.toLowerCase())
  );

  const filteredMessages = messages.filter((message) =>
    message.message_body?.toLowerCase().includes(messageSearchTerm?.toLowerCase())
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
