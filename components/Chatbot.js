// components/Chatbot.js
'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { askAI } from '@/lib/ai-service';
import { getPlatformContext } from '@/lib/platform-tools';

// Optional: small markdown sanitizer for clean UI
function sanitizeForUI(s) {
  return s.replace(/\*\*/g, '').replace(/\*([^\*]+)\*/g, '$1').trim();
}

export default function Chatbot() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [platformContext, setPlatformContext] = useState(null);

  const messagesEndRef = useRef(null);

  // Initial welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content:
            "👋 Hi! I'm your AI assistant.\n\nI can help you:\n• Find videos & playlists\n• Navigate the platform\n• Answer academic questions\n• Suggest study paths\n\nWhat would you like to know?",
          timestamp: new Date(),
        },
      ]);
    }
  }, []);

  // Fetch platform context when chat opens
  useEffect(() => {
    if (user && isOpen && !platformContext) {
      (async () => {
        try {
          const context = await getPlatformContext(user?.role || 'student');
          setPlatformContext(context);
        } catch (err) {
          console.error('Error fetching context:', err);
        }
      })();
    }
  }, [user, isOpen, platformContext]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await askAI(userMessage.content, platformContext);
      const cleanAnswer = sanitizeForUI(response.answer || '');

      const assistantMessage = {
        role: 'assistant',
        content: response.success
          ? cleanAnswer
          : '❌ Sorry, I encountered an error. Please try again.',
        model: response.model,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            '❌ Something went wrong. Please try again or rephrase your question.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickActions = [
    { emoji: '🎥', label: 'Find Videos', prompt: 'How do I find and watch videos?' },
    { emoji: '📋', label: 'Playlists', prompt: 'Show me all available playlists' },
    { emoji: '📚', label: 'Study Path', prompt: 'Suggest a study path for data structures' },
    { emoji: '❓', label: 'Help', prompt: 'How do I use this platform?' },
  ];

  const handleQuickAction = (prompt) => {
    setInput(prompt);
  };

  // Closed state → Floating button
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white w-16 h-16 rounded-full shadow-2xl hover:shadow-blue-500/50 hover:scale-110 transition-all flex items-center justify-center text-3xl z-50 animate-pulse"
        aria-label="Open AI Assistant"
      >
        🤖
      </button>
    );
  }

  // Open state → Chat window
  return (
    <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col z-50 border-2 border-blue-500/20 dark:border-blue-400/20">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-2xl flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="text-3xl animate-bounce">🤖</span>
          <div>
            <h3 className="font-bold text-lg">AI Assistant</h3>
            <p className="text-xs opacity-90">Powered by Perplexity Pro</p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-white hover:bg-white/20 w-8 h-8 rounded-full flex items-center justify-center transition"
          aria-label="Close chat"
        >
          ✕
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-md ${
                msg.role === 'user'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-br-none'
                  : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-bl-none border border-gray-200 dark:border-gray-600'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                {msg.content}
              </p>
              {msg.model && (
                <p className="text-xs opacity-70 mt-2 italic">
                  via {msg.model}
                </p>
              )}
            </div>
          </div>
        ))}

        {/* Typing animation */}
        {loading && (
          <div className="flex justify-start animate-fadeIn">
            <div className="bg-white dark:bg-gray-700 rounded-2xl rounded-bl-none px-4 py-3 shadow-md border border-gray-200 dark:border-gray-600">
              <div className="flex gap-1">
                <span
                  className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                  style={{ animationDelay: '0ms' }}
                ></span>
                <span
                  className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
                  style={{ animationDelay: '150ms' }}
                ></span>
                <span
                  className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                  style={{ animationDelay: '300ms' }}
                ></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions (initial only) */}
      {messages.length === 1 && (
        <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 font-medium">
            Quick Actions:
          </p>
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => handleQuickAction(action.prompt)}
                className="text-xs bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-3 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 transition border border-gray-200 dark:border-gray-600 flex items-center gap-2 shadow-sm hover:shadow-md"
              >
                <span className="text-base">{action.emoji}</span>
                <span className="font-medium">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 bg-white dark:bg-gray-800 border-t-2 border-gray-200 dark:border-gray-700 rounded-b-2xl">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything..."
            rows={2}
            className="flex-1 px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 placeholder-gray-500"
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center min-w-[48px]"
            aria-label="Send message"
          >
            <span className="text-xl">{loading ? '⏳' : '📤'}</span>
          </button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
          Press Enter to send • Shift+Enter for new line
        </p>
      </div>

      {/* Animation */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
