import { createContext, useState, useContext, useCallback } from 'react';
import { AuthContext, API_URL } from './AuthContext';

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
    const { user } = useContext(AuthContext);
    const [activeConversationId, setActiveConversationId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [isStreaming, setIsStreaming] = useState(false);
    const [isWaiting, setIsWaiting] = useState(false); // Indicates "thinking" phase before first token
    const [abortController, setAbortController] = useState(null);

    // Sends the message via SSE and parses the incoming stream
    const sendMessage = useCallback(async (text, image = null) => {
        if ((!text.trim() && !image) || !user) return;

        // Optimistically add user message
        const newMessage = { role: 'user', content: text, image, timestamp: new Date() };
        setMessages(prev => [...prev, newMessage]);

        setIsStreaming(true);
        setIsWaiting(true); // Start "thinking"

        // Add empty assistant message placeholder to map chunks into
        setMessages(prev => [...prev, { role: 'assistant', content: '', timestamp: new Date() }]);

        // Initialize fresh abort controller for this stream
        const controller = new AbortController();
        setAbortController(controller);

        try {
            const response = await fetch(`${API_URL}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify({
                    message: text,
                    image: image,
                    conversationId: activeConversationId
                }),
                signal: controller.signal
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");
            let doneReading = false;
            let buffer = '';

            // Parse SSE stream chunks
            while (!doneReading) {
                const { value, done } = await reader.read();
                doneReading = done;
                if (value) {
                    buffer += decoder.decode(value, { stream: true });
                    const events = buffer.split('\n\n');

                    // Keep the last partial event in the buffer
                    buffer = events.pop() || '';

                    for (const event of events) {
                        if (event.startsWith('data: ')) {
                            try {
                                const dataStr = event.substring(6);
                                if (!dataStr) continue;
                                const data = JSON.parse(dataStr);

                                if (data.error) {
                                    console.error("Stream Error: ", data.error);
                                    break;
                                }

                                if (data.done) {
                                    // Update conversationId on first message sequence
                                    if (data.conversationId && !activeConversationId) {
                                        setActiveConversationId(data.conversationId);
                                    }
                                    break;
                                }

                                if (data.text) {
                                    setIsWaiting(false); // First token arrived, stop "thinking"
                                    // Append chunk text to the last assistant placeholder immutably
                                    setMessages(prev => {
                                        const updated = [...prev];
                                        const lastIndex = updated.length - 1;
                                        const lastMsg = updated[lastIndex];
                                        if (lastMsg && lastMsg.role === 'assistant') {
                                            updated[lastIndex] = {
                                                ...lastMsg,
                                                content: lastMsg.content + data.text
                                            };
                                        }
                                        return updated;
                                    });
                                }
                            } catch (e) {
                                console.error("Error parsing SSE JSON chunk", e, event);
                            }
                        }
                    }
                }
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log("Stream aborted by user");
            } else {
                console.error("Failed to send message", error);
                // Remove optimistic placeholder if failed outside of manual abort
                setMessages(prev => prev.slice(0, prev.length - 1));
            }
        } finally {
            setIsStreaming(false);
            setIsWaiting(false); // Ensure waiting is false if stream ends or errors
            setAbortController(null);
        }

    }, [user, activeConversationId]);

    const stopGeneration = () => {
        if (abortController) {
            abortController.abort();
            setIsStreaming(false);
            setIsWaiting(false);
            setAbortController(null);
        }
    };

    const loadConversation = (id, historyMessages) => {
        setActiveConversationId(id);
        setMessages(historyMessages);
    };

    const createNewChat = () => {
        setActiveConversationId(null);
        setMessages([]);
    };

    const deleteChat = async (id) => {
        if (!user) return;
        try {
            await fetch(`${API_URL}/chat/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${user.token}` }
            });
            if (activeConversationId === id) {
                createNewChat();
            }
            // Optionally trigger sidebar refresh here, currently we let active state reset gracefully
            return true;
        } catch (error) {
            console.error("Failed to delete chat", error);
            return false;
        }
    };

    return (
        <ChatContext.Provider value={{
            activeConversationId,
            messages,
            sendMessage,
            stopGeneration,
            isStreaming,
            isWaiting,
            loadConversation,
            createNewChat,
            deleteChat
        }}>
            {children}
        </ChatContext.Provider>
    );
};
