import { useState, useRef, useEffect, useContext } from 'react';
import { Send, LoaderIcon, Trash2, ImagePlus, X, User, Square } from 'lucide-react';
import { ChatContext } from '../context/ChatContext';
import ReactMarkdown from 'react-markdown';

export default function ChatArea() {
    const {
        messages,
        sendMessage,
        stopGeneration,
        isStreaming,
        isWaiting,
        activeConversationId,
        deleteChat
    } = useContext(ChatContext);
    const [input, setInput] = useState('');
    const [imagePreview, setImagePreview] = useState(null);
    const [imageBase64, setImageBase64] = useState(null);
    const scrollRef = useRef(null);
    const fileInputRef = useRef(null);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
                setImageBase64(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setImagePreview(null);
        setImageBase64(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // Auto-scroll to bottom of chat
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if ((!input.trim() && !imageBase64) || isStreaming) return;
        const msg = input;
        const img = imageBase64;
        setInput('');
        removeImage();
        await sendMessage(msg, img);
    };

    return (
        <div className="flex-1 flex flex-col bg-slate-950 h-screen relative">
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6"
            >
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                        <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
                            <span className="text-3xl">🦙</span>
                        </div>
                        <h2 className="text-xl font-semibold text-white mb-2">HireMate: Your Internship Architect</h2>
                        <p className="max-w-md text-center">
                            Start a new conversation. Messages are processed fully locally and securely via Ollama.
                        </p>
                    </div>
                ) : (
                    messages.map((msg, idx) => (
                        <div
                            key={idx}
                            className={`w-full ${msg.role === 'assistant' ? 'bg-slate-800' : 'bg-transparent'} py-6 border-b border-slate-800`}
                        >
                            <div className="max-w-3xl mx-auto flex gap-6 px-4">
                                {/* Avatar */}
                                <div className="flex-shrink-0 mt-1">
                                    {msg.role === 'assistant' ? (
                                        <div className="w-8 h-8 rounded-sm bg-indigo-600 flex items-center justify-center text-white font-bold">
                                            🦙
                                        </div>
                                    ) : (
                                        <div className="w-8 h-8 rounded-sm bg-slate-600 flex items-center justify-center text-white">
                                            <User size={18} />
                                        </div>
                                    )}
                                </div>

                                {/* Message Content */}
                                <div className="flex-1 min-w-0 prose prose-invert prose-indigo max-w-none">
                                    {msg.image && (
                                        <img src={msg.image} alt="uploaded" className="max-w-xs rounded-lg mb-4 shadow-sm" />
                                    )}

                                    {msg.role === 'assistant' ? (
                                        <ReactMarkdown>
                                            {msg.content || (isStreaming ? '...' : '')}
                                        </ReactMarkdown>
                                    ) : (
                                        <div className="whitespace-pre-wrap leading-relaxed text-slate-100">
                                            {msg.content}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="p-4 bg-slate-900 border-t border-slate-800">
                {isWaiting && (
                    <div className="flex items-center justify-center text-sm text-slate-400 mb-2">
                        <LoaderIcon className="animate-spin mr-2" size={16} />
                        Searching History... Thinking...
                    </div>
                )}
                <div className="max-w-3xl mx-auto relative px-4 text-center">
                    {/* ChatGPT Style Stop Button Overlay */}
                    {isStreaming && (
                        <div className="absolute -top-14 left-1/2 transform -translate-x-1/2 z-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <button
                                onClick={stopGeneration}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-200 border border-slate-600 rounded-full shadow-lg hover:bg-slate-700 hover:text-white transition-all text-sm font-medium"
                            >
                                <Square size={12} className="fill-current" />
                                Stop generating
                            </button>
                        </div>
                    )}

                    {imagePreview && (
                        <div className="mb-3 relative inline-block">
                            <img src={imagePreview} alt="Preview" className="h-16 w-16 object-cover rounded-lg border border-slate-700 shadow-lg" />
                            <button
                                type="button"
                                onClick={removeImage}
                                className="absolute -top-2 -right-2 p-1 bg-slate-700 rounded-full text-white hover:bg-slate-600"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    )}
                    <form
                        onSubmit={handleSubmit}
                        className="relative flex items-center bg-slate-800 rounded-2xl border border-slate-700 shadow-lg focus-within:ring-1 focus-within:ring-slate-500 overflow-hidden"
                    >
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleImageChange}
                            disabled={isStreaming}
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isStreaming}
                            className="p-3 ml-2 rounded-lg text-slate-400 hover:text-white transition-colors"
                        >
                            <ImagePlus size={20} />
                        </button>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Message HireMate..."
                            className="w-full bg-transparent text-white py-4 px-2 focus:outline-none placeholder-slate-400"
                            disabled={isStreaming}
                        />
                        <button
                            type="submit"
                            disabled={(!input.trim() && !imageBase64) || isStreaming}
                            className="p-2 mr-3 rounded-lg bg-white text-slate-900 hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-white transition-colors flex items-center justify-center p-2"
                        >
                            {isStreaming ? <LoaderIcon className="animate-spin" size={18} /> : <Send size={18} className="transform -rotate-45 ml-1" />}
                        </button>
                    </form>
                    <div className="text-center mt-3 text-xs text-slate-500">
                        HireMate can make mistakes. Verify important information.
                    </div>
                </div>
                <div className="text-center mt-2 text-xs text-slate-500">
                    AI can make mistakes. Verify important information.
                </div>
            </div>
        </div>
    );
}
