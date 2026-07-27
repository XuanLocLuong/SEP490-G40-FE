import { createContext, useContext } from 'react';

export const ChatContext = createContext(null);

export const useChat = () => {
    const ctx = useContext(ChatContext);
    if (!ctx) {
        throw new Error('useChat must be used within ChatProvider');
    }
    return ctx;
};
