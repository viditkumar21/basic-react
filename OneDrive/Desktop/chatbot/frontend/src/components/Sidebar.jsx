import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { MessageSquare, Settings, PlusCircle, LogOut, Code } from 'lucide-react';
import { AuthContext, API_URL } from '../context/AuthContext';
import { ChatContext } from '../context/ChatContext';
import { format } from 'date-fns';
import SkillsDashboard from './SkillsDashboard';
import JobProfileDashboard from './JobProfileDashboard';

export default function Sidebar() {
    const { user, logout } = useContext(AuthContext);
    const { activeConversationId, loadConversation, createNewChat } = useContext(ChatContext);
    const [sessions, setSessions] = useState([]);

    useEffect(() => {
        if (!user) return;
        const fetchSessions = async () => {
            try {
                // Endpoint not yet created on backend, but this assumes /api/chat/history exists
                const { data } = await axios.get(`${API_URL}/chat/history`, {
                    headers: { Authorization: `Bearer ${user.token}` }
                });
                setSessions(data);
            } catch (error) {
                console.error("Failed to fetch sessions", error);
            }
        };
        fetchSessions();
    }, [user, activeConversationId]);

    const [view, setView] = useState('chats'); // 'chats' or 'skills'

    return (
        <div className="w-64 bg-slate-900 border-r border-slate-800 h-screen flex flex-col text-slate-300">
            <div className="p-4 border-b border-slate-800">
                <button
                    onClick={createNewChat}
                    className="w-full flex items-center justify-center gap-2 bg-transparent border border-slate-600 hover:bg-slate-800 text-slate-200 rounded-lg p-2 text-sm transition-colors"
                >
                    <PlusCircle size={16} />
                    New chat
                </button>
            </div>

            <div className="flex border-b border-slate-800 text-xs font-medium">
                <button
                    onClick={() => setView('chats')}
                    className={`flex-1 py-3 transition-colors ${view === 'chats' ? 'text-slate-200 border-b-2 border-slate-500' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    History
                </button>
                <button
                    onClick={() => setView('skills')}
                    className={`flex-1 py-3 transition-colors ${view === 'skills' ? 'text-slate-200 border-b-2 border-slate-500' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    Skills
                </button>
                <button
                    onClick={() => setView('profile')}
                    className={`flex-1 py-3 transition-colors ${view === 'profile' ? 'text-slate-200 border-b-2 border-slate-500' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    Profile
                </button>
            </div>

            {view === 'chats' ? (
                <div className="flex-1 overflow-y-auto p-4 space-y-1">
                    {sessions.map((session) => (
                        <button
                            key={session._id}
                            onClick={() => loadConversation(session._id, session.messages)}
                            className={`w-full text-left flex items-center gap-3 p-2 rounded-lg transition-colors overflow-hidden ${activeConversationId === session._id
                                ? 'bg-slate-800 text-white'
                                : 'hover:bg-slate-800/50'
                                }`}
                        >
                            <MessageSquare size={16} className="text-slate-500 flex-shrink-0" />
                            <div className="truncate">
                                <span className="truncate text-sm block">
                                    {session.messages[0]?.content || "New Chat"}
                                </span>
                            </div>
                        </button>
                    ))}
                </div>
            ) : view === 'skills' ? (
                <SkillsDashboard />
            ) : (
                <JobProfileDashboard />
            )}

            <div className="p-4 border-t border-slate-800">
                <div className="flex items-center gap-3 mb-4 text-sm truncate px-2">
                    <div className="w-8 h-8 rounded-sm bg-indigo-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                        {user?.email?.[0].toUpperCase() || 'U'}
                    </div>
                    <span className="truncate text-slate-200">{user?.email}</span>
                </div>
                <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors text-sm"
                >
                    <LogOut size={16} />
                    Log out
                </button>
            </div>
        </div>
    );
}
