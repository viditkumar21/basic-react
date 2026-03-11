import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Target, LoaderIcon, AlertCircle } from 'lucide-react';
import { AuthContext, API_URL } from '../context/AuthContext';

export default function SkillsDashboard() {
    const { user } = useContext(AuthContext);
    const [skills, setSkills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!user) return;
        const fetchSkills = async () => {
            try {
                setLoading(true);
                const { data } = await axios.get(`${API_URL}/chat/skills`, {
                    headers: { Authorization: `Bearer ${user.token}` }
                });
                setSkills(data);
                setError(null);
            } catch (err) {
                console.error("Failed to fetch skills", err);
                setError("Failed to load skills data");
            } finally {
                setLoading(false);
            }
        };
        fetchSkills();
    }, [user]);

    if (loading) {
        return (
            <div className="flex-1 flex justify-center items-center text-slate-400 p-4">
                <LoaderIcon className="animate-spin" size={24} />
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="flex items-center gap-2 mb-4 text-indigo-400">
                <Target size={18} />
                <h3 className="text-sm font-semibold uppercase tracking-wider">Technical Gaps</h3>
            </div>

            {error && (
                <div className="text-red-400 flex items-center gap-2 text-sm bg-red-900/20 p-3 rounded-lg">
                    <AlertCircle size={16} />
                    {error}
                </div>
            )}

            {skills.length === 0 && !error ? (
                <p className="text-sm text-slate-500 italic">No technical gaps identified yet. Keep chatting!</p>
            ) : (
                <ul className="space-y-3">
                    {skills.map((skill, idx) => (
                        <li key={idx} className="text-sm text-slate-300 bg-slate-800 p-3 rounded-lg border border-slate-700 shadow-sm leading-relaxed relative overflow-hidden">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500"></div>
                            {skill.trim()}
                        </li>
                    ))}
                </ul>
            )}

            <p className="text-xs text-slate-500 mt-6 pt-4 border-t border-slate-800">
                These insights are automatically aggregated from the AI's feedback across all your past sessions.
            </p>
        </div>
    );
}
