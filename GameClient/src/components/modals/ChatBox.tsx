import { useEffect, useRef } from "react";
import type { ChatMessage } from "../../pages/Models";

interface ChatBoxProps {
    showChat: boolean;
    chatMessages: ChatMessage[];
    message: string;
    setMessage: (msg: string) => void;
    handleKeyPress: (e: React.KeyboardEvent) => void;
    sendMessage: () => void;
    setShowChat: (show: boolean) => void;
    setHasNewMessage: (has: boolean) => void;
}

const ChatBox: React.FC<ChatBoxProps> = ({
    showChat,
    chatMessages,
    message,
    setMessage,
    handleKeyPress,
    sendMessage,
    setShowChat,
    setHasNewMessage
}) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [chatMessages, showChat]);

    return (
        <div className={`absolute left-0 top-0 ml-4 mt-4 w-80 max-w-xs bg-gray-900/90 border border-gray-700 rounded-2xl shadow-xl p-4 z-20 transition-all duration-300 ${showChat ? '' : 'opacity-0 pointer-events-none'}`} style={{ minHeight: '340px' }}>
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-semibold text-white">Chat</h2>
                <button
                    className="text-blue-400 hover:text-blue-200 transition-colors cursor-pointer"
                    onClick={() => {
                        setShowChat(false);
                        setHasNewMessage(false);
                    }}
                >
                    ✕
                </button>
            </div>
            <div className="flex-1 overflow-y-auto bg-gray-800 rounded-lg p-3 mb-2 border border-gray-700" style={{ maxHeight: '280px' }}>
                {chatMessages.map((msg, idx) => (
                    <div key={idx} className="mb-2">
                        <span className="font-bold text-blue-300">{msg.nickname}:</span> <span className="text-white">{msg.message}</span>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <div className="flex gap-2 mt-2">
                <input
                    type="text"
                    placeholder="Wiadomość..."
                    className="w-full p-2 border border-gray-700 rounded bg-neutral-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                />
                <button
                    className="p-2 bg-gradient-to-r from-blue-800 to-gray-900 hover:from-blue-900 hover:to-black rounded text-white flex items-center justify-center transition-colors duration-150 cursor-pointer"
                    onClick={sendMessage}
                >
                    ➤
                </button>
            </div>
        </div>
    );
};

export default ChatBox;