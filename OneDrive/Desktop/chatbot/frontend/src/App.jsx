import { useContext } from 'react';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';

import AuthScreen from './components/AuthScreen';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import ModelStatus from './components/ModelStatus';

function MainApp() {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="h-screen w-full bg-slate-950 flex justify-center items-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <ChatProvider>
      <div className="flex h-screen bg-slate-950 overflow-hidden text-slate-200 font-sans">
        <Sidebar />
        <main className="flex-1 relative flex flex-col">
          <ModelStatus />
          <ChatArea />
        </main>
      </div>
    </ChatProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
