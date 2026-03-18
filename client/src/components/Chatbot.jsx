import { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Trash2, Loader } from 'lucide-react';
import api from '../services/api';

export default function Chatbot() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      text: "👋 Hi! I'm the Science & Tech Club assistant. Ask me about **events**, **announcements**, **courses**, or **projects**!"
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load history on mount
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data } = await api.get('/chatbot/history');  // ✅ fixed
        if (data && data.length > 0) {
          const historyMessages = data.flatMap((h, i) => [
            { id: `h-user-${i}`, type: 'user', text: h.message },
            { id: `h-bot-${i}`, type: 'bot', text: h.reply }
          ]);
          setMessages(prev => [...prev, ...historyMessages]);
        }
      } catch {
        // History fetch is optional — fail silently
      }
    };
    fetchHistory();
  }, []);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMsg = { id: Date.now(), type: 'user', text: trimmed };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const { data } = await api.post('/chatbot', { message: trimmed });  // ✅ fixed
      const botMsg = { id: Date.now() + 1, type: 'bot', text: data.reply };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      const errMsg = {
        id: Date.now() + 1,
        type: 'bot',
        text: '❌ Sorry, something went wrong. Please try again.'
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearHistory = async () => {
    if (!confirm('Clear chat history?')) return;
    try {
      await api.delete('/chatbot/history');  // ✅ fixed
      setMessages([{
        id: Date.now(),
        type: 'bot',
        text: "History cleared! How can I help you?"
      }]);
    } catch {
      alert('Failed to clear history');
    }
  };

  const renderText = (text) => {
    return text.split('\n').map((line, i) => {
      const parts = line.split(/\*\*(.*?)\*\*/g);
      return (
        <p key={i} className={i > 0 ? 'mt-1' : ''}>
          {parts.map((part, j) =>
            j % 2 === 1 ? <strong key={j}>{part}</strong> : part
          )}
        </p>
      );
    });
  };

  return (
    <div className="min-h-screen bg-black pt-20 px-4 pb-6">
      <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-6rem)]">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg">Club Assistant</h1>
              <p className="text-green-400 text-xs">● Online</p>
            </div>
          </div>
          <button
            onClick={handleClearHistory}
            className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-red-400 rounded-lg text-sm transition"
          >
            <Trash2 className="w-4 h-4" />
            Clear
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-hide">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.type === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.type === 'bot'
                  ? 'bg-gradient-to-br from-blue-500 to-purple-600'
                  : 'bg-gradient-to-br from-green-500 to-teal-600'
              }`}>
                {msg.type === 'bot'
                  ? <Bot className="w-4 h-4 text-white" />
                  : <User className="w-4 h-4 text-white" />
                }
              </div>
              <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.type === 'bot'
                  ? 'bg-gray-800 text-gray-100 rounded-tl-sm'
                  : 'bg-blue-600 text-white rounded-tr-sm'
              }`}>
                {renderText(msg.text)}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-gray-800 px-4 py-3 rounded-2xl rounded-tl-sm">
                <Loader className="w-4 h-4 text-gray-400 animate-spin" />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Quick suggestions */}
        <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide pb-1">
          {['Upcoming events', 'Latest announcements', 'Available courses', 'Active projects'].map(s => (
            <button
              key={s}
              onClick={() => setInput(s)}
              className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded-full whitespace-nowrap transition"
            >
              {s}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="flex gap-3 mt-3">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about events, courses, projects..."
            className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="w-12 h-12 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl flex items-center justify-center transition"
          >
            <Send className="w-5 h-5 text-white" />
          </button>
        </div>

      </div>
    </div>
  );
}
