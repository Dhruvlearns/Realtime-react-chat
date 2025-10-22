import React, { useState, useEffect, useRef, use } from 'react';
import { io } from 'socket.io-client';
import tailwindConfig from '../../tailwind.config';

const ChatPage = () => {
  const [messages, setMessages] = useState([]);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const socketRef = useRef();
  const messagesEndRef = useRef(null);
  // Missing initialization
const typingTimeout=useRef(null);

const activeTypers = useRef({}); // This Ref holds the names of users currently typing. // Updating this does NOT cause a re-render.


const [, setTypersUpdated] = useState(0); // This state is ONLY used to force the component to re-render // when the activeTypers Ref is updated, displaying the names.


  useEffect(() => {
    // Connect to the backend server
    socketRef.current = io('http://localhost:3000');

    // Listener for incoming chat messages
    socketRef.current.on('chat message', (msg) => {
      setMessages((prevMessages) => [...prevMessages, msg]);
    });

// ... inside your main useEffect hook

    // ADD THESE LISTENERS:
    socketRef.current.on('user typing', (username) => {
      activeTypers.current[username] = true;
      // Force a re-render to display the indicator
      setTypersUpdated(prev => prev + 1); 
    });

    socketRef.current.on('user stop typing', (username) => {
      delete activeTypers.current[username];
      // Force a re-render to hide the indicator
      setTypersUpdated(prev => prev + 1); 
    });

// ... rest of the cleanup function

    // Cleanup function to disconnect the socket when the component unmounts
    return () => {
      socketRef.current.disconnect();
    };
  }, []);

  useEffect(() => {
    // Scroll to the bottom of the messages div when a new message is added
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);



  const handleTyping = () => {
    // 1. Emit 'typing' only if the user wasn't marked as typing before
    // We use the Ref to check if the current user is active
    if (!activeTypers.current[name]) { 
      // We don't update the local Ref here, as the server broadcast will handle it.
      socketRef.current.emit('typing', name); 
    }
  
    // 2. Clear any existing timeout (the debounce mechanism)
    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
    }
  
    // 3. Set a new timeout to send 'stop typing' after a pause (1000ms)
    typingTimeout.current = setTimeout(() => {
      // When the timeout finishes, tell the server you stopped typing
      socketRef.current.emit('stop typing', name); 
    }, 1000);
  };



  // Handle form submission
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (name && message) {
      // Emit a single 'chat message' event with both the name and content
      socketRef.current.emit('chat message', { name, content: message, socketId: socketRef.current.id });
      setMessage(''); // Clear the message input field after sending
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 font-sans">
      <header className="bg-white shadow-md p-4 text-center">
        <h1 className="text-2xl font-bold text-gray-800">Chat App using Socket.io & Nodejs</h1>
      </header>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => {
          const isMyMessage = msg.socketId === socketRef.current?.id;
          return (
            <div key={index} className={`flex items-start space-x-2 ${isMyMessage ? 'justify-end' : ''}`}>
              {!isMyMessage && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-white font-bold text-sm">
                  {msg.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className={`p-3 rounded-lg shadow-sm max-w-lg ${isMyMessage ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
                <div className={`font-semibold ${isMyMessage ? 'text-white' : 'text-gray-700'}`}>
                  {msg.name}
                </div>
                <p className={`text-sm ${isMyMessage ? 'text-white' : 'text-gray-600'}`}>
                  {msg.content}
                </p>
              </div>
              {isMyMessage && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">
                  {msg.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
            {/* Extract the keys (usernames) from the activeTypers object */}
            {Object.keys(activeTypers.current).length > 0 && (
              <div className="text-sm text-gray-500 italic px-4 pb-2">
                {Object.keys(activeTypers.current).join(', ')}{' '}
                {Object.keys(activeTypers.current).length > 1 ? 'are' : 'is'} typing...
              </div>
            )}
      </div>

      <form onSubmit={handleSendMessage} className="bg-white p-4 shadow-t-md flex space-x-2">
        <input
          type="text"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-1/4"
        />
        <input
          type="text"
          placeholder="Type a message..."
          value={message}
          onChange={(e) => {setMessage(e.target.value);
          handleTyping();
          }}
          className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1"
        />
        <button
          type="submit"
          className="bg-blue-500 text-white p-2 rounded-lg font-semibold hover:bg-blue-600 transition duration-200"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatPage;
