import { Ollama } from 'ollama';
import Chat from '../models/Chat.js';
import User from '../models/User.js';

// Setup Ollama client to point to default local IPv4 port
const ollama = new Ollama({
    host: 'http://127.0.0.1:11434',
    fetch: (url, options) => {
        // Add a 60-second timeout to allow the model to warm up in RAM
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000);
        return fetch(url, { ...options, signal: controller.signal })
            .finally(() => clearTimeout(timeoutId));
    }
});

export const generateChatResponse = async (req, res) => {
    const { message, conversationId } = req.body;
    const userId = req.user._id;

    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }

    // Initialize SSE Headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders(); // Establish SSE stream

    // Listen for client disconnect (e.g., Stop Generating)
    let isClientDisconnected = false;
    req.on('close', () => {
        isClientDisconnected = true;
    });

    try {
        // Resolve or create chat conversation
        let chat;
        if (conversationId) {
            chat = await Chat.findOne({ _id: conversationId, userId });
        }

        if (!chat) {
            chat = await Chat.create({ userId, messages: [] });
        }

        // Vision Support (Parse Image first)
        let imageBase64 = null;
        if (req.body.image) {
            imageBase64 = req.body.image.includes('base64,') ? req.body.image.split('base64,')[1] : req.body.image;
        } else if (req.file) {
            imageBase64 = req.file.buffer.toString('base64');
        }

        // Add user message mapping locally
        chat.messages.push({
            role: 'user',
            content: message,
            image: imageBase64 || null
        });

        // ---------------------------------------------------------
        // Performance Tracking Logic
        // ---------------------------------------------------------
        const lowerMsg = message.toLowerCase();

        const categories = {
            frontend: ['react', 'vue', 'css', 'html', 'dom', 'ui', 'ux', 'components', 'tailwind', 'flexbox'],
            backend: ['node', 'express', 'api', 'database', 'sql', 'mongodb', 'docker', 'server', 'auth', 'jwt'],
            ds_ml: ['regression', 'classification', 'pandas', 'numpy', 'tensor', 'pytorch', 'model', 'dataset', 'overfitting'],
            dsa: ['array', 'linked list', 'tree', 'graph', 'sort', 'search', 'dynamic programming', 'recursion', 'time complexity', 'big o']
        };

        const userDoc = await User.findById(userId);
        if (userDoc) {
            let matchesFound = false;
            let personaChanged = false;

            // Intent Detection
            if (lowerMsg.startsWith('act as a placement guide')) {
                userDoc.currentPersona = 'placement_guide';
                personaChanged = true;
            } else if (lowerMsg.startsWith('give me mcq answers')) {
                userDoc.currentPersona = 'mcq';
                personaChanged = true;
            } else if (lowerMsg.startsWith('give me cut to cut answers') || lowerMsg.includes('cut to cut')) {
                userDoc.currentPersona = 'cut_to_cut';
                personaChanged = true;
            } else if (lowerMsg.startsWith('reset')) {
                userDoc.currentPersona = 'standard';
                personaChanged = true;
            }

            for (const [domain, keywords] of Object.entries(categories)) {
                if (keywords.some(kw => lowerMsg.includes(kw))) {
                    userDoc.performance[domain] += 1;
                    matchesFound = true;
                }
            }
            if (matchesFound || personaChanged) {
                await userDoc.save();
            }
        }
        // ---------------------------------------------------------

        // Search: Query MongoDB for relatable messages
        const relatableChats = await Chat.find(
            { userId, _id: { $ne: chat._id }, $text: { $search: message } },
            { score: { $meta: "textScore" } }
        ).sort({ score: { $meta: "textScore" } }).limit(3);

        let relatableContext = relatableChats.map(c =>
            c.messages.map(m => `${m.role}: ${m.content}`).join('\n')
        ).join('\n---\n');

        // Get 5 most recent messages (excluding the new one just added)
        const recentMessages = chat.messages.slice(-6, -1);

        // Construct Context
        let contextString = '';
        if (recentMessages.length > 0 || relatableChats.length > 0) {
            contextString = `Recent Conversation:\n${recentMessages.map(m => `${m.role}: ${m.content}`).join('\n')}\n\nRelated Past Conversations:\n${relatableContext}`;
        } else {
            contextString = `This is a new topic for the user. Do not refer to past conversations.`;
        }

        // System Prompt
        let personaInstruction = "";
        const activePersona = userDoc ? userDoc.currentPersona : 'standard';

        if (activePersona === 'placement_guide') {
            personaInstruction = "From now on, provide detailed career roadmaps, interview tips, and placement strategies. Be a professional mentor.\n\n";
        } else if (activePersona === 'mcq') {
            personaInstruction = "From now on, provide ONLY the correct option (A, B, C, or D) and a 1-sentence explanation. No long paragraphs.\n\n";
        } else if (activePersona === 'cut_to_cut') {
            personaInstruction = "From now on, provide ONLY the direct answer to the user's question, completely cut-to-cut. No introductions, no conclusions, no filler words, and no explanations unless explicitly asked.\n\n";
        }

        const systemPrompt = `${personaInstruction}You are HireMate, a highly capable, helpful, and knowledgeable AI assistant.
Your goal is to provide clear, accurate, and direct answers just like ChatGPT.
Format: Use Markdown (headings, bullet points, and code blocks) to structure your responses beautifully.
Tone: Natural, conversational, and professional. 
No Roleplay: Never use actions like "smiles", "chuckles", or asterisks.
IMPORTANT: Never announce your role or title. Do NOT start responses with phrases like "As a Senior Technical Coach", "As HireMate", "As an AI", or similar. Just answer the question directly.

Context:
${contextString}`;

        const modelToUse = imageBase64 ? 'llama3.2-vision' : 'llama2';

        const ollamaMessages = [
            { role: 'system', content: systemPrompt },
            {
                role: 'user',
                content: message,
                ...(imageBase64 && { images: [imageBase64] })
            }
        ];

        // Stream inference using Ollama
        const responseStream = await ollama.chat({
            model: modelToUse,
            messages: ollamaMessages,
            stream: true,
            options: {
                num_ctx: 4096,
                temperature: 0.5,
                top_p: 0.9,
                repeat_penalty: 1.2
            }
        });

        let fullResponse = "";

        for await (const chunk of responseStream) {
            // Immediately stop pulling from Ollama if user hit Stop Generating
            if (isClientDisconnected) {
                break;
            }

            if (chunk.message && chunk.message.content) {
                const chunkText = chunk.message.content;
                fullResponse += chunkText;

                // Write chunk to client over SSE
                res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
            }
        }

        // Save AI response to DB (event if partial/aborted)
        if (fullResponse.trim()) {
            chat.messages.push({
                role: 'assistant',
                content: fullResponse
            });
            await chat.save();
        }

        // Finish stream signal with conversationId to assist frontend linking
        if (!isClientDisconnected) {
            res.write(`data: ${JSON.stringify({ done: true, conversationId: chat._id })}\n\n`);
            res.end();
        }

    } catch (error) {
        console.error('Chat Streaming Error: ', error);
        res.write(`data: ${JSON.stringify({ error: error.message || 'Failed to generate response' })}\n\n`);
        res.end();
    }
};

// Fetch chat history for sidebar
export const getChatHistory = async (req, res) => {
    try {
        const chats = await Chat.find({ userId: req.user._id }).sort({ updatedAt: -1 });
        res.json(chats);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// Delete a specific chat
export const deleteChat = async (req, res) => {
    try {
        const chat = await Chat.findOne({ _id: req.params.id, userId: req.user._id });
        if (!chat) {
            return res.status(404).json({ message: 'Conversation not found' });
        }
        await chat.deleteOne();
        res.json({ message: 'Conversation removed' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// Extract Technical Gaps across all user conversations
export const getSkillGaps = async (req, res) => {
    try {
        const chats = await Chat.find({ userId: req.user._id }).sort({ updatedAt: -1 });
        let allAssistantMessages = [];

        chats.forEach(chat => {
            chat.messages.forEach(msg => {
                if (msg.role === 'assistant') {
                    allAssistantMessages.push(msg.content);
                }
            });
        });

        // Simple extraction: We look for sentences containing "skill", "gap", "improve", "lack", "should focus", etc.
        // Or since we prompted it to act as a Senior Technical Coach, we can return the last 10 assistant critiques to the frontend.
        // For a more structured approach, we could run another Ollama call here to summarize the gaps. But let's keep it fast by using simple regex or passing the text to the frontend.

        const gapKeywords = ['gap', 'lack', 'improve', 'focus on', 'should learn', 'weakness', 'struggle', 'critique', 'skill'];
        let extractedGaps = [];

        allAssistantMessages.forEach(text => {
            const sentences = text.split(/(?<=[.?!])\s+/);
            sentences.forEach(sentence => {
                const lower = sentence.toLowerCase();
                if (gapKeywords.some(kw => lower.includes(kw)) && sentence.length > 20) {
                    // avoid duplicates and keep it reasonably short
                    if (!extractedGaps.includes(sentence) && extractedGaps.length < 15) {
                        extractedGaps.push(sentence);
                    }
                }
            });
        });

        res.json(extractedGaps);
    } catch (error) {
        console.error("Skill Gap Error:", error);
        res.status(500).json({ message: 'Server Error extracting skills' });
    }
};

// Calculate and Return Job Profile Recommendation
export const getUserPerformanceProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const perf = user.performance || { frontend: 0, backend: 0, ds_ml: 0, dsa: 0 };
        const totalScore = perf.frontend + perf.backend + perf.ds_ml + perf.dsa;

        let profile = "Exploring Topics";

        if (totalScore > 2) {
            const scores = [
                { domain: 'frontend', score: perf.frontend },
                { domain: 'backend', score: perf.backend },
                { domain: 'ds_ml', score: perf.ds_ml },
                { domain: 'dsa', score: perf.dsa }
            ].sort((a, b) => b.score - a.score);

            const primary = scores[0];
            const secondary = scores[1];

            // Some specific combinations
            if (primary.domain === 'frontend' && secondary.domain === 'backend' && secondary.score >= primary.score / 2) {
                profile = "Full Stack Developer";
            } else if (primary.domain === 'backend' && secondary.domain === 'frontend' && secondary.score >= primary.score / 2) {
                profile = "Full Stack Developer";
            } else {
                switch (primary.domain) {
                    case 'frontend':
                        profile = "Frontend Specialist";
                        break;
                    case 'backend':
                        profile = "Backend Engineer";
                        break;
                    case 'ds_ml':
                        profile = "Data Scientist / ML Engineer";
                        break;
                    case 'dsa':
                        profile = "Core Systems / Algorithm Engineer";
                        break;
                    default:
                        profile = "Generalist Developer";
                }
            }
        }

        res.json({
            profile: profile,
            scores: perf,
            totalInteractions: totalScore
        });

    } catch (error) {
        console.error("Profile Error: ", error);
        res.status(500).json({ message: 'Server Error calculating profile' });
    }
};
