import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, MessageCircle } from 'lucide-react';
import { sendMessage, getChatHistory } from '../api/client';

export default function ChatWindow({ sessionId, currentLang, t }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const bottomRef = useRef(null);

  useEffect(() => {
    if (sessionId) {
      loadHistory();
    }
  }, [sessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const loadHistory = async () => {
    try {
      const res = await getChatHistory(sessionId);
      setMessages(res.data);
    } catch (err) {
      console.error("Failed to load chat history:", err);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput('');
    setError(null);
    
    setMessages((prev) => [...prev, {
      role: 'user',
      content: userText,
      timestamp: new Date().toISOString()
    }]);
    
    setLoading(true);

    try {
      const res = await sendMessage(sessionId, userText);
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: res.data.response,
        detected_language: res.data.language,
        timestamp: new Date().toISOString()
      }]);
    } catch (err) {
      setError(err.response?.data?.detail || "Connection issue. Please retry.");
    } finally {
      setLoading(false);
    }
  };

  const getPlaceholder = () => {
    switch (currentLang) {
      case 'ta': return 'உங்கள் வணிகத்தைப் பற்றி எதையும் கேளுங்கள்... (உதா: இந்த மாசம் எந்த பொருள் அதிகமா விற்பனை ஆச்சு?)';
      case 'hi': return 'अपने व्यवसाय के बारे में कुछ भी पूछें... (जैसे: इस महीने कौन सा उत्पाद सबसे ज़्यादा बिका?)';
      default: return 'Ask anything about your business... (e.g. Which product sold the most?)';
    }
  };

  return (
    <div className="bg-surface border border-outline-variant/65 rounded-2xl flex flex-col h-[500px] shadow-2xl overflow-hidden glass-panel">
      {/* Header */}
      <div className="px-5 py-4 bg-slate-950/40 border-b border-outline-variant/50 flex items-center gap-2">
        <MessageCircle className="w-5 h-5 text-indigo-400" />
        <div>
          <h3 className="font-extrabold text-slate-100 text-sm leading-none mb-1">
            {t('chatTitle')}
          </h3>
          <p className="text-[10px] text-slate-400 leading-none">
            {t('chatHint')}
          </p>
        </div>
      </div>

      {/* Messages list */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-950/20">
        {messages.length === 0 && !loading && (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-3">
            <div className="w-12 h-12 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center text-indigo-400 shadow-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-300 mb-1">No questions asked yet</p>
              <p className="text-[11px] text-slate-500 max-w-xs leading-relaxed">
                Type a question below in English, Tamil, or Hindi to query your database.
              </p>
            </div>
          </div>
        )}
        
        {messages.map((m, idx) => {
          const isUser = m.role === 'user';
          return (
            <div 
              key={idx}
              className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-md whitespace-pre-line ${
                isUser 
                  ? 'bg-indigo-600 text-white rounded-tr-none' 
                  : 'bg-slate-900 text-slate-200 border border-slate-800 rounded-tl-none'
              }`}>
                {m.content}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-none px-4 py-3 text-xs text-slate-400 shadow-md flex items-center gap-2">
              <span className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
              <span>Thinking...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="text-center text-[10px] text-red-400 font-medium">
            {error}
          </div>
        )}
        
        <div ref={bottomRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-3 border-t border-outline-variant/60 bg-slate-950 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={getPlaceholder()}
          className="flex-1 bg-slate-900 text-slate-200 border border-slate-800/80 focus:border-indigo-500 rounded-xl px-4 py-3 text-xs focus:outline-none transition-all placeholder:text-slate-650"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className={`p-3 rounded-xl transition-all cursor-pointer ${
            !input.trim() || loading
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:scale-105 shadow-md shadow-indigo-650/15'
          }`}
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
