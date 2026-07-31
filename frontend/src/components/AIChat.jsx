// frontend/src/components/AIChat.jsx - CLEAN DISPLAY WITH NO "0" RATINGS

import React, { useState, useRef, useEffect } from 'react';
import { aiService } from '../services/aiService';

export default function AIChat() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        setMessages([
            {
                role: 'assistant',
                content: "👋 Hi! I'm your Kerala travel assistant.\n\nI can help you find the best places to visit, plan itineraries, and discover hidden gems.",
                suggestions: [
                   
                    "Best hill stations for trekking",
                    "Plan a 4-day backwater escape in Alleppey",
                    "Hidden gems in Wayanad",
                    "Budget trekking itinerary for Munnar",
                    "Best places in Kannur district"
                ]
            }
        ]);
        inputRef.current?.focus();
    }, []);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);
        setError(null);

        try {
            const result = await aiService.ask(input);
            
            // Clean the response - remove any leftover markdown
            let cleanedContent = result.answer || 'No response';
            // Remove ** ** pairs
            cleanedContent = cleanedContent.replace(/\*\*/g, '');
            // Remove __ __ pairs
            cleanedContent = cleanedContent.replace(/__/g, '');
            
            // Clean destination data - remove items with 0 rating or fix display
            let cleanedDestinations = (result.destinations || []).map(dest => ({
                ...dest,
                // Only keep rating if it's greater than 0
                rating: dest.rating && dest.rating > 0 ? dest.rating : null,
                // Fix district display - remove "0" if it appears
                district: dest.district && dest.district !== '0' ? dest.district : ''
            }));
            
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: cleanedContent,
                destinations: cleanedDestinations
            }]);
            
        } catch (err) {
            setError(err.message || 'Something went wrong');
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `❌ Error: ${err.message || 'Failed to process your request'}`,
                isError: true
            }]);
        } finally {
            setIsLoading(false);
            inputRef.current?.focus();
        }
    };

    const handleSuggestionClick = (suggestion) => {
        setInput(suggestion);
        setTimeout(() => handleSend(), 100);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const formatMessage = (text) => {
        if (!text) return null;
        const lines = text.split('\n');
        return lines.map((line, i) => {
            if (!line.trim()) return <br key={i} />;
            // Check if line starts with number and dot (like "1. ")
            if (line.match(/^\d+\.\s/)) {
                return <p key={i} className="list-item">{line}</p>;
            }
            // Check if line starts with bullet (•)
            if (line.trim().startsWith('•')) {
                return <p key={i} className="bullet-item">{line}</p>;
            }
            return <p key={i}>{line}</p>;
        });
    };

    return (
        <div className="ai-chat-container">
            {/* Header */}
            <div className="chat-header">
                <div className="chat-title">
                    <span className="chat-icon">✨</span>
                    <span>Travel Assistant</span>
                    <span className="status-dot online"></span>
                </div>
            </div>

            {/* Messages */}
            <div className="messages-container">
                {messages.map((msg, index) => (
                    <div key={index} className={`message-wrapper ${msg.role}`}>
                        <div className={`message-bubble ${msg.role}`}>
                            {msg.role === 'assistant' && (
                                <div className="assistant-avatar">🤖</div>
                            )}
                            <div className="message-content">
                                <div className="message-text">
                                    {formatMessage(msg.content)}
                                </div>
                                
                                {msg.destinations && msg.destinations.length > 0 && (
                                    <div className="destinations-grid">
                                        {msg.destinations.slice(0, 5).map((dest, i) => (
                                            <div key={i} className="destination-card">
                                                <h4>{dest.name || 'Unknown'}</h4>
                                                {dest.district && dest.district !== '0' && (
                                                    <span className="district">{dest.district}</span>
                                                )}
                                                {dest.rating && dest.rating > 0 && (
                                                    <span className="rating">⭐ {dest.rating}</span>
                                                )}
                                                {dest.description && (
                                                    <p className="desc">{dest.description.slice(0, 60)}...</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="message-wrapper assistant">
                        <div className="message-bubble assistant">
                            <div className="assistant-avatar">🤖</div>
                            <div className="message-content">
                                <div className="typing-dots">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="message-wrapper assistant">
                        <div className="message-bubble assistant error">
                            <div className="assistant-avatar">⚠️</div>
                            <div className="message-content">
                                <div className="message-text error-text">{error}</div>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Suggestions */}
            {messages.length === 1 && (
                <div className="suggestions">
                    {messages[0].suggestions?.map((suggestion, i) => (
                        <button 
                            key={i} 
                            className="suggestion-btn"
                            onClick={() => handleSuggestionClick(suggestion)}
                        >
                            {suggestion}
                        </button>
                    ))}
                </div>
            )}

            {/* Input */}
            <div className="input-container">
                <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask about Kerala travel..."
                    disabled={isLoading}
                />
                <button 
                    className="send-btn" 
                    onClick={handleSend} 
                    disabled={isLoading || !input.trim()}
                >
                    {isLoading ? '⏳' : '➤'}
                </button>
            </div>

            <style jsx>{`
                .ai-chat-container {
                    display: flex;
                    flex-direction: column;
                    height: 520px;
                    max-width: 100%;
                    background: #ffffff;
                    border-radius: 12px;
                    border: 1px solid #e8e4de;
                    overflow: hidden;
                    box-shadow: 0 4px 24px rgba(0,0,0,0.06);
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                }
                
                .chat-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 12px 16px;
                    background: linear-gradient(135deg, #072E2A 0%, #0a3d38 100%);
                    color: white;
                    flex-shrink: 0;
                }
                
                .chat-title {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-weight: 600;
                    font-size: 15px;
                }
                
                .chat-icon { font-size: 18px; }
                
                .status-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    display: inline-block;
                    margin-left: 6px;
                    background: #4ade80;
                    animation: pulse-dot 2s infinite;
                }
                
                @keyframes pulse-dot {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.3; }
                }
                
                .messages-container {
                    flex: 1;
                    overflow-y: auto;
                    padding: 16px;
                    background: #f8f6f1;
                    scroll-behavior: smooth;
                }
                
                .messages-container::-webkit-scrollbar {
                    width: 4px;
                }
                .messages-container::-webkit-scrollbar-thumb {
                    background: #C79A3E;
                    border-radius: 4px;
                }
                
                .message-wrapper {
                    margin-bottom: 12px;
                    display: flex;
                    animation: fadeIn 0.3s ease;
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                .message-wrapper.user { justify-content: flex-end; }
                .message-wrapper.assistant { justify-content: flex-start; }
                
                .message-bubble {
                    display: flex;
                    gap: 10px;
                    max-width: 88%;
                    align-items: flex-start;
                }
                
                .message-bubble.user { flex-direction: row-reverse; }
                
                .assistant-avatar {
                    width: 28px;
                    height: 28px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #072E2A 0%, #0a3d38 100%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 14px;
                    flex-shrink: 0;
                    color: white;
                    border: 1px solid rgba(199,154,62,0.3);
                }
                
                .message-content {
                    padding: 10px 14px;
                    border-radius: 12px;
                    background: white;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
                    min-width: 40px;
                }
                
                .message-bubble.user .message-content {
                    background: linear-gradient(135deg, #072E2A 0%, #0a3d38 100%);
                    color: white;
                    border-bottom-right-radius: 4px;
                }
                
                .message-bubble.assistant .message-content {
                    background: white;
                    border-bottom-left-radius: 4px;
                }
                
                .message-bubble.assistant.error .message-content {
                    background: #fef2f2;
                    border: 1px solid #fecaca;
                }
                
                .message-text p {
                    margin: 0 0 4px 0;
                    line-height: 1.6;
                    font-size: 14px;
                    color: #1a1a1a;
                }
                .message-text p:last-child { margin-bottom: 0; }
                .message-text .list-item {
                    font-weight: 500;
                    color: #072E2A;
                }
                .message-text .bullet-item {
                    padding-left: 8px;
                    color: #4A5F5A;
                }
                .message-bubble.user .message-text p { color: white; }
                .error-text { color: #dc2626 !important; }
                
                .destinations-grid {
                    margin-top: 10px;
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
                    gap: 8px;
                }
                
                .destination-card {
                    background: #f8f6f1;
                    padding: 10px 12px;
                    border-radius: 8px;
                    border: 1px solid #eee;
                    transition: all 0.3s ease;
                }
                
                .destination-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.06);
                    border-color: #C79A3E;
                }
                
                .destination-card h4 {
                    margin: 0 0 2px 0;
                    font-size: 13px;
                    color: #072E2A;
                    font-weight: 600;
                }
                .destination-card .district { 
                    font-size: 10px; 
                    color: #8a9a95; 
                    display: block; 
                }
                .destination-card .rating {
                    font-size: 10px;
                    color: #C79A3E;
                    display: block;
                    margin-top: 2px;
                    font-weight: 500;
                }
                .destination-card .desc { 
                    font-size: 11px; 
                    color: #5c6e69; 
                    margin: 4px 0 0 0; 
                    line-height: 1.4; 
                }
                
                .typing-dots {
                    display: flex; 
                    align-items: center; 
                    gap: 4px; 
                    padding: 4px 0;
                }
                .typing-dots span {
                    width: 8px; 
                    height: 8px; 
                    border-radius: 50%; 
                    background: #C79A3E;
                    animation: dot 1.4s infinite;
                }
                .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
                .typing-dots span:nth-child(3) { animation-delay: 0.4s; }
                
                @keyframes dot {
                    0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
                    40% { opacity: 1; transform: scale(1.2); }
                }
                
                .suggestions {
                    display: flex; 
                    flex-wrap: wrap; 
                    gap: 6px;
                    padding: 10px 14px 12px;
                    background: #fcfaf7;
                    border-top: 1px solid #e8e4de;
                    flex-shrink: 0;
                }
                
                .suggestion-btn {
                    padding: 5px 14px;
                    border: 1px solid #e8e4de;
                    border-radius: 20px;
                    background: white;
                    color: #072E2A;
                    font-size: 12px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    font-family: inherit;
                    white-space: nowrap;
                }
                .suggestion-btn:hover {
                    border-color: #C79A3E;
                    background: #f8f6f1;
                    transform: translateY(-1px);
                    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
                }
                
                .input-container {
                    display: flex;
                    padding: 10px 14px 14px;
                    background: white;
                    border-top: 1px solid #e8e4de;
                    gap: 8px;
                    flex-shrink: 0;
                }
                
                .input-container input {
                    flex: 1;
                    padding: 9px 14px;
                    border: 1.5px solid #e0dcd6;
                    border-radius: 24px;
                    font-size: 14px;
                    outline: none;
                    transition: all 0.3s ease;
                    background: #fcfaf7;
                    font-family: inherit;
                }
                .input-container input:focus {
                    border-color: #C79A3E;
                    box-shadow: 0 0 0 3px rgba(199,154,62,0.1);
                    background: white;
                }
                .input-container input:disabled { opacity: 0.6; }
                .input-container input::placeholder { color: #b0a8a0; }
                
                .send-btn {
                    width: 40px; 
                    height: 40px;
                    border: none; 
                    border-radius: 50%;
                    background: linear-gradient(135deg, #C79A3E 0%, #b08a2e 100%);
                    color: white; 
                    font-size: 16px;
                    cursor: pointer; 
                    transition: all 0.3s ease;
                    flex-shrink: 0; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center;
                }
                .send-btn:hover:not(:disabled) {
                    transform: scale(1.05);
                    box-shadow: 0 4px 12px rgba(199,154,62,0.3);
                }
                .send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
                
                @media (max-width: 640px) {
                    .ai-chat-container { 
                        height: 440px; 
                        border-radius: 0; 
                        max-width: 100%; 
                    }
                    .message-bubble { max-width: 92%; }
                    .destinations-grid { grid-template-columns: 1fr; }
                    .suggestions { 
                        padding: 8px 10px 10px; 
                        justify-content: center; 
                    }
                    .suggestion-btn { 
                        font-size: 11px; 
                        padding: 4px 12px; 
                    }
                }
            `}</style>
        </div>
    );
}