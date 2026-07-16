// src/components/MahaChatInterface.tsx
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, MicOff, Image as ImageIcon, Loader2 } from 'lucide-react';
import { mahaApi } from '../lib/mahaApi';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export const MahaChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: 'Systems online. How may I assist you today, Sir?', timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsProcessing(true);
    setActiveAgent('Planner Agent');

    try {
      const res = await mahaApi.sendMessage(input, 'default-session');
      const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: res.response, timestamp: new Date() };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'system', content: 'Error connecting to Maha Core.', timestamp: new Date() }]);
    } finally {
      setIsProcessing(false);
      setActiveAgent(null);
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        const chunks: Blob[] = [];

        mediaRecorder.ondataavailable = e => chunks.push(e.data);
        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(chunks, { type: 'audio/webm' });
          setIsProcessing(true);
          setActiveAgent('Voice Runtime');
          
          try {
            const res = await mahaApi.processVoice(audioBlob, 'default-session');
            setMessages(prev => [
              ...prev,
              { id: Date.now().toString(), role: 'user', content: res.transcript, timestamp: new Date() },
              { id: (Date.now() + 1).toString(), role: 'assistant', content: res.response, timestamp: new Date() }
            ]);
          } catch (error) {
            console.error('Voice processing failed:', error);
          } finally {
            setIsProcessing(false);
            setActiveAgent(null);
          }
        };

        mediaRecorder.start();
        mediaRecorderRef.current = mediaRecorder;
        setIsRecording(true);
      } catch (error) {
        console.error('Microphone access denied:', error);
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950/80 backdrop-blur-xl border border-cyan-500/20 rounded-2xl shadow-[0_0_30px_rgba(6,182,212,0.1)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-cyan-500/20 bg-slate-900/50">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_#22d3ee]" />
          <h2 className="text-cyan-400 font-mono text-lg tracking-widest uppercase">Maha Core Interface</h2>
        </div>
        {activeAgent && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }}
            className="text-xs font-mono text-amber-400 flex items-center gap-2"
          >
            <Loader2 className="w-3 h-3 animate-spin" />
            {activeAgent} Processing...
          </motion.div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] rounded-2xl px-5 py-3 ${
                msg.role === 'user' 
                  ? 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-50' 
                  : 'bg-slate-800/50 border border-slate-700/50 text-slate-200'
              }`}>
                <p className="text-sm leading-relaxed">{msg.content}</p>
                <span className="text-[10px] text-slate-500 mt-2 block font-mono">
                  {msg.timestamp.toLocaleTimeString()}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {isProcessing && !activeAgent?.includes('Voice') && (
          <div className="flex justify-start">
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl px-5 py-3 flex gap-1">
              <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-cyan-500/20 bg-slate-900/50">
        <div className="flex items-center gap-3 bg-slate-950/50 border border-slate-700/50 rounded-xl p-2 focus-within:border-cyan-500/50 transition-colors">
          <button className="p-2 text-slate-400 hover:text-cyan-400 transition-colors">
            <ImageIcon className="w-5 h-5" />
          </button>
          
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Enter command or query..."
            className="flex-1 bg-transparent text-slate-100 placeholder-slate-500 outline-none font-mono text-sm px-2"
            disabled={isProcessing}
          />

          <button
            onClick={toggleRecording}
            className={`p-2 rounded-lg transition-all ${
              isRecording 
                ? 'bg-red-500/20 text-red-400 animate-pulse' 
                : 'text-slate-400 hover:text-cyan-400'
            }`}
          >
            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <button
            onClick={handleSend}
            disabled={!input.trim() || isProcessing}
            className="p-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};