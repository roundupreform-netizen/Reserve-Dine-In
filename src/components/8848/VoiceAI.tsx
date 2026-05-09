import 'regenerator-runtime/runtime';
import React, { useEffect } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { useAIStore } from '../../store/useAIStore';
import { Mic, MicOff } from 'lucide-react';
import toast from 'react-hot-toast';

const VoiceAI = () => {
  const { transcript, listening, resetTranscript, browserSupportsSpeechRecognition } = useSpeechRecognition();
  const { setIsListening, isListening, addMessage, setIsThinking } = useAIStore();

  useEffect(() => {
    setIsListening(listening);
  }, [listening]);

  if (!browserSupportsSpeechRecognition) {
    return null;
  }

  const startListening = () => {
    resetTranscript();
    SpeechRecognition.startListening({ continuous: false });
  };

  const stopListening = () => {
    SpeechRecognition.stopListening();
  };

  useEffect(() => {
    if (!listening && transcript) {
       // Voice command captured
       handleVoiceCommand(transcript);
    }
  }, [listening, transcript]);

  const handleVoiceCommand = async (command: string) => {
    addMessage({ role: 'user', content: `[VOICE] ${command}` });
    toast.success(`Voice Command Received: ${command}`);
    // The main ChatPanel logic will take over if we integrate this better
    // For now, it's a bridge to the AI
  };

  return (
    <button 
      onMouseDown={startListening}
      onMouseUp={stopListening}
      className={`p-3 rounded-xl transition-all ${listening ? 'bg-red-500 text-white animate-pulse' : 'bg-white/5 text-white/40 hover:text-white'}`}
    >
      {listening ? <Mic size={18} /> : <MicOff size={18} />}
    </button>
  );
};

export default VoiceAI;
