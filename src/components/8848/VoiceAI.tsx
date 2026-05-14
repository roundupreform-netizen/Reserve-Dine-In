import 'regenerator-runtime/runtime';
import React from 'react';
import { realtimeVoice } from '../../voice/8848RealtimeVoice';
import { use8848VoiceStore } from '../../store/8848/use8848VoiceStore';
import { Mic, MicOff } from 'lucide-react';

const VoiceAI = () => {
  const { state } = use8848VoiceStore();

  const handleMicClick = () => {
    realtimeVoice.handleMicClick();
  };

  return (
    <button 
      onClick={handleMicClick}
      className={`p-3 rounded-xl transition-all ${state === 'listening' ? 'bg-blue-500 text-white animate-pulse' : state === 'speaking' ? 'bg-amber-500 text-black' : 'bg-white/5 text-white/40 hover:text-white'}`}
    >
      {state === 'listening' || state === 'speaking' ? <Mic size={18} /> : <MicOff size={18} />}
    </button>
  );
};


export default VoiceAI;
