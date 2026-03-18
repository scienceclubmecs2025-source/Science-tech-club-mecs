import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, Loader2, Trash2 } from 'lucide-react';
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
    if (!input.trim() || loading) return;
    
    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setLoading(true);

    try {
      const { data } = await api.post('/chatbot', { message: userMessage });
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `❌ ${error.response?.data?.message || 'Club assistant unavailable'}` 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = async () => {
    try {
      await api.delete('/chatbot/history');
      setMessages([]);
    } catch (error) {
      console.error('Clear failed:', error);
    }
  };

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
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-3 rounded-2xl mb-4 shadow-2xl">
            <MessageCircle className="w-8 h-8 text-white" />
            <div>
              <h1 className="text-2xl font-bold text-white">Club Assistant</h1>
              <p className="text-sm text-emerald-100">Powered by Ollama 🦙</p>
            </div>
          </div>
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="flex items-center gap-2 mx-auto text-sm text-gray-400 hover:text-emerald-400 transition-all p-2 rounded-lg hover:bg-emerald-500/10"
            >
              <Trash2 className="w-4 h-4" />
              Clear Chat
            </button>
          )}
        </div>

        {/* Messages */}
        <div className="space-y-4 mb-6 max-h-[70vh] overflow-y-auto bg-gray-900/50 backdrop-blur-xl rounded-3xl p-6 border border-gray-700 shadow-2xl">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-16">
              <MessageCircle className="w-20 h-20 mx-auto mb-6 opacity-40" />
              <h3 className="text-xl font-medium mb-2">Ready to help!</h3>
              <p className="text-lg">Ask about club events, projects, courses, robotics, AI, or web dev</p>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] p-4 rounded-2xl shadow-lg ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white'
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
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
                  <span className="font-medium">Club Assistant is thinking...</span>
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
            placeholder="Ask about events, projects, courses, robotics, AI, web dev..."
            rows="1"
            className="flex-1 max-h-32 resize-none bg-black/50 border border-gray-600 rounded-2xl px-5 py-4 text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 transition-all"
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="group p-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 rounded-2xl text-white shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center hover:scale-105 active:scale-95"
          >
            <Send className={`w-6 h-6 transition-transform ${loading || !input.trim() ? '' : 'group-hover:rotate-12'}`} />
          </button>
        </div>
      </div>
    </div>
  );
}
