import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Briefcase, LoaderIcon, AlertCircle } from 'lucide-react';
import { AuthContext, API_URL } from '../context/AuthContext';

export default function JobProfileDashboard() {
    const { user } = useContext(AuthContext);
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!user) return;
        const fetchPerformance = async () => {
            try {
                setLoading(true);
                const { data } = await axios.get(`${API_URL}/chat/performance`, {
                    headers: { Authorization: `Bearer ${user.token}` }
                });
                setProfileData(data);
                setError(null);
            } catch (err) {
                console.error("Failed to fetch performance data", err);
                setError("Failed to load your career profile");
            } finally {
                setLoading(false);
            }
        };
        fetchPerformance();
    }, [user]);

    if (loading) {
        return (
            <div className="flex-1 flex justify-center items-center text-slate-400 p-4">
                <LoaderIcon className="animate-spin" size={24} />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 text-red-400 flex items-center gap-2 text-sm bg-red-900/20 rounded-lg m-4">
                <AlertCircle size={16} />
                {error}
            </div>
        );
    }

    const total = profileData.totalInteractions || 0;

    // Formatting helper
    const getPercentage = (score) => {
        if (total === 0) return 0;
        return Math.round((score / total) * 100);
    };

    const categories = [
        { key: 'backend', label: 'Backend Engineer', color: 'bg-emerald-500' },
        { key: 'frontend', label: 'Frontend Engineer', color: 'bg-indigo-500' },
        { key: 'ds_ml', label: 'Data Scientist', color: 'bg-purple-500' },
        { key: 'dsa', label: 'DSA / Competitive Coder', color: 'bg-orange-500' },
    ];

    // Sort categories by score descending
    const sortedCategories = categories.sort((a, b) =>
        (profileData.scores[b.key] || 0) - (profileData.scores[a.key] || 0)
    );

    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="flex flex-col gap-1 mb-6">
                <div className="flex items-center gap-2 text-indigo-400">
                    <Briefcase size={18} />
                    <h3 className="text-sm font-semibold uppercase tracking-wider">Career Predictor</h3>
                </div>
                {total > 2 ? (
                    <p className="text-lg font-bold text-white mt-2">{profileData.profile}</p>
                ) : (
                    <p className="text-sm text-slate-400 mt-1">Ask more questions to generate a profile.</p>
                )}
            </div>

            <div className="space-y-5">
                {sortedCategories.map((cat) => {
                    const score = profileData.scores[cat.key] || 0;
                    const percentage = getPercentage(score);

                    return (
                        <div key={cat.key} className="space-y-1">
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-300">{cat.label}</span>
                                <span className="text-slate-400 font-mono">{percentage}%</span>
                            </div>
                            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
                                <div
                                    className={`${cat.color} h-2 rounded-full transition-all duration-1000 ease-out`}
                                    style={{ width: `${percentage}%` }}
                                ></div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 text-xs text-slate-500">
                <p>Based on {total} technical interactions with HireMate.</p>
            </div>
        </div>
    );
}
