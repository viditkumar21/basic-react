import { useState, useEffect } from 'react';
import axios from 'axios';

export default function ModelStatus() {
    const [status, setStatus] = useState('checking'); // 'checking' | 'online' | 'offline'

    useEffect(() => {
        const checkOllamaStatus = async () => {
            try {
                // Ollama's default base endpoint returns 200 OK "Ollama is running"
                const response = await axios.get('http://localhost:11434/');
                if (response.status === 200) {
                    setStatus('online');
                } else {
                    setStatus('offline');
                }
            } catch (error) {
                setStatus('offline');
            }
        };

        checkOllamaStatus();

        // Poll every 30 seconds
        const interval = setInterval(checkOllamaStatus, 30000);
        return () => clearInterval(interval);
    }, []);

    let statusColor, statusText;

    switch (status) {
        case 'online':
            statusColor = 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]';
            statusText = 'Ollama Online';
            break;
        case 'offline':
            statusColor = 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]';
            statusText = 'Ollama Offline';
            break;
        case 'checking':
        default:
            statusColor = 'bg-amber-500 animate-pulse';
            statusText = 'Checking...';
            break;
    }

    return (
        <div className="absolute top-4 right-4 flex items-center gap-2 bg-slate-800/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-slate-700 z-10 transition-all cursor-default group">
            <div className={`w-2.5 h-2.5 rounded-full ${statusColor}`} />
            <span className="text-xs font-medium text-slate-300">{statusText}</span>

            {status === 'offline' && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-xl">
                    Ensure Ollama is running locally on port 11434 (`ollama serve`).
                </div>
            )}
        </div>
    );
}
