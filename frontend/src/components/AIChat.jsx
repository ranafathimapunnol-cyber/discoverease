// components/AIChat.jsx - FIXED

import React, { useState, useRef, useEffect } from 'react';
import aiService from '../services/aiService';

const AIChat = ({ chatMode = 'standard', category = null, onMessageSend }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: `👋 Hi! I'm your Kerala travel assistant. ${category ? `I can help you explore ${category}!` : ''}\n\nI can help you with:\n• Finding peaceful destinations\n• Planning itineraries\n• Budget recommendations\n• Hidden gems\n\nWhat would you like to explore today?`
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [apiStatus, setApiStatus] = useState('checking');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Check API connection
  useEffect(() => {
    const checkAPI = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/health/');
        if (response.ok) {
          setApiStatus('online');
          console.log('✅ Backend API is online');
        } else {
          setApiStatus('offline');
          console.warn('⚠️ Backend API responded but with error');
        }
      } catch (error) {
        setApiStatus('offline');
        console.warn('⚠️ Backend API is offline');
      }
    };
    checkAPI();
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: input
    };

    setMessages(prev => [...prev, userMessage]);
    if (onMessageSend) onMessageSend(userMessage);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      console.log('📡 Sending query to API:', input);
      
      // Call the API
      const response = await aiService.ask(input);
      console.log('📡 API Response:', response);

      let botContent = '';

      // Check if we got a valid response from API
      if (response && response.answer) {
        botContent = response.answer;
        console.log('✅ Using API response');
      } else {
        // Fallback: use the response or show error
        botContent = response?.answer || '⚠️ No response from API. Please try again.';
        console.warn('⚠️ API response missing answer field');
      }

      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: botContent
      };

      setMessages(prev => [...prev, botMessage]);

    } catch (error) {
      console.error('❌ Error:', error);
      
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: `⚠️ Error: ${error.message}\n\nPlease check if Django server is running on port 8000.`
      };
      setMessages(prev => [...prev, errorMessage]);
      setError(error.message);

    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getPlaceholder = () => {
    if (isLoading) return "Thinking... 🤔";
    if (apiStatus === 'offline') return "⚠️ API offline - using local data";
    if (chatMode === 'detailed') return "Be specific... e.g., 'Plan a 3-day trekking itinerary in Munnar'";
    if (chatMode === 'quick') return "Quick query... e.g., 'Best places without beaches'";
    return "Ask me about Kerala travel... 🌴";
  };

  return (
    <div className="flex flex-col h-[500px] bg-transparent">
      
      {/* Status Bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-white/50 rounded-t-xl border-b border-[#0E5C53]/10">
        <div className="flex items-center gap-3">
          <span className={`text-xs font-medium ${
            apiStatus === 'online' ? 'text-green-600' : 
            apiStatus === 'checking' ? 'text-yellow-600' :
            'text-red-500'
          }`}>
            {apiStatus === 'online' ? '🟢 API Online' : 
             apiStatus === 'checking' ? '🟡 Checking...' :
             '🔴 Offline Mode'}
          </span>
          {isLoading && (
            <span className="text-xs text-[#8A9A95] animate-pulse">Processing...</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[#8A9A95]">
            {apiStatus === 'online' ? 'Backend connected' : 'Using fallback'}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 px-2 py-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                msg.type === 'user'
                  ? 'bg-[#0E5C53] text-white'
                  : 'bg-white/95 backdrop-blur-sm border border-[#0E5C53]/10 text-[#0B2422]'
              }`}
            >
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {msg.content}
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white/95 backdrop-blur-sm border border-[#0E5C53]/10 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-[#0E5C53] rounded-full animate-pulse" />
                <span className="w-2 h-2 bg-[#C79A3E] rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                <span className="w-2 h-2 bg-[#E4C77B] rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-[#0E5C53]/10 pt-4 bg-white/30 backdrop-blur-sm rounded-b-2xl">
        <div className="flex items-end gap-2 px-2">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={getPlaceholder()}
              rows={1}
              disabled={isLoading}
              className="w-full px-4 py-2.5 rounded-xl border border-[#0E5C53]/20 bg-white/80 text-sm text-[#0B2422] placeholder-[#8A9A95] focus:outline-none focus:border-[#0E5C53] transition-all resize-none min-h-[44px] max-h-[100px] disabled:opacity-50"
              style={{ fontFamily: 'Inter, sans-serif' }}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={`p-2.5 rounded-xl transition-all ${
              input.trim() && !isLoading
                ? 'bg-[#0E5C53] text-white hover:bg-[#0B2422] shadow-lg shadow-[#0E5C53]/20'
                : 'bg-[#E8EDEB] text-[#8A9A95] cursor-not-allowed'
            }`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 2L11 13" />
              <path d="M22 2L15 22L11 13L2 9L22 2Z" />
            </svg>
          </button>
        </div>
        
        {/* Quick suggestions */}
        <div className="flex gap-2 px-2 mt-3 overflow-x-auto pb-1">
          <button
            onClick={() => {
              setInput("14 districts best places list");
              inputRef.current?.focus();
            }}
            className="flex-shrink-0 text-[10px] px-3 py-1 rounded-full bg-white/80 border border-[#0E5C53]/10 text-[#0E5C53] hover:bg-white hover:border-[#0E5C53]/30 transition-all"
          >
            🗺️ All Districts
          </button>
          <button
            onClick={() => {
              setInput("Best hill stations for trekking in Kerala");
              inputRef.current?.focus();
            }}
            className="flex-shrink-0 text-[10px] px-3 py-1 rounded-full bg-white/80 border border-[#0E5C53]/10 text-[#0E5C53] hover:bg-white hover:border-[#0E5C53]/30 transition-all"
          >
            ⛰️ Hill Stations
          </button>
          <button
            onClick={() => {
              setInput("the best places in kannur district");
              inputRef.current?.focus();
            }}
            className="flex-shrink-0 text-[10px] px-3 py-1 rounded-full bg-white/80 border border-[#0E5C53]/10 text-[#0E5C53] hover:bg-white hover:border-[#0E5C53]/30 transition-all"
          >
            📍 Kannur
          </button>
          <button
            onClick={() => {
              setInput("Suggest peaceful places without beaches in Kerala");
              inputRef.current?.focus();
            }}
            className="flex-shrink-0 text-[10px] px-3 py-1 rounded-full bg-white/80 border border-[#0E5C53]/10 text-[#0E5C53] hover:bg-white hover:border-[#0E5C53]/30 transition-all"
          >
            🌿 No Beaches
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIChat;