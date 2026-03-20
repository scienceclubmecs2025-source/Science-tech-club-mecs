import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, Loader2, Trash2, Sparkles } from 'lucide-react';
import api from '../services/api';

export default function ChatbotPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    const userMessage = input.trim()
    if (!userMessage || loading) return;

    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/chatbot', { message: userMessage });
      setMessages(prev => [...prev, { role: 'assistant', content: res.reply || 'No response received.' }]);
    } catch (error) {
      const msg = error.response?.data?.message || 'Chatbot unavailable, please try again later.';
      setMessages(prev => [...prev, { role: 'assistant', content: `❌ ${msg}` }]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => setMessages([]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black pt-20">
      <div className="max-w-2xl mx-auto px-4 pb-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-3 rounded-2xl mb-4 shadow-2xl">
            <MessageCircle className="w-8 h-8 text-white" />
            <div>
              <h1 className="text-2xl font-bold text-white">Club Assistant</h1>
              <p className="text-sm text-blue-100 flex items-center gap-1 justify-center">
                <Sparkles className="w-3 h-3" /> S&T Club Guide + Gemini AI
              </p>
            </div>
          </div>
          {messages.length > 0 && (
            <button onClick={clearChat} className="flex items-center gap-2 mx-auto text-sm text-gray-400 hover:text-white transition">
              <Trash2 className="w-4 h-4" /> Clear Chat
            </button>
          )}
        </div>

        {/* Quick suggestions */}
        {messages.length === 0 && (
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              '📅 How do I view events?',
              '🚀 How do I create a project?',
              '📚 Where are the courses?',
              '💬 How do I send a message?',
              '👤 How do I edit my profile?',
              '⚙️ What is my dashboard?'
            ].map((suggestion, i) => (
              <button
                key={i}
                onClick={() => setInput(suggestion.slice(3))}
                className="text-left text-sm px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-gray-300 hover:border-blue-500 hover:text-white transition"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        {/* Messages */}
        <div className="space-y-4 mb-6 max-h-[70vh] overflow-y-auto bg-gray-900/50 backdrop-blur-xl rounded-3xl p-6 border border-gray-700 shadow-2xl">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-16">
              <MessageCircle className="w-20 h-20 mx-auto mb-6 opacity-40" />
              <h3 className="text-xl font-medium mb-2">Ready to help!</h3>
              <p className="text-lg">Ask me anything about the S&T Club platform</p>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-2xl shadow-lg ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                    : 'bg-gray-800/80 backdrop-blur text-white border border-gray-700'
                }`}>
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                </div>
              </div>
            ))
          )}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-800/80 backdrop-blur text-white p-4 rounded-2xl border border-gray-700 shadow-lg">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                  <span className="font-medium">Thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="flex gap-3 p-6 bg-gray-900/50 backdrop-blur-xl rounded-3xl border border-gray-700 shadow-2xl">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Ask about events, projects, courses, or anything..."
            rows="1"
            className="flex-1 max-h-32 resize-none bg-black/50 border border-gray-600 rounded-2xl px-5 py-4 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all"
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="group p-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-2xl text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center hover:scale-105 active:scale-95"
          >
            <Send className={`w-6 h-6 transition-transform ${loading || !input.trim() ? '' : 'group-hover:rotate-12'}`} />
          </button>
        </div>
      </div>
    </div>
  );
}
