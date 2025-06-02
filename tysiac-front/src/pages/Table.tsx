import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import GameService from "../services/GameService";
import { GrHide, GrView } from "react-icons/gr";
import { ImExit } from "react-icons/im";
import { IoMdSend } from "react-icons/io";

interface Player {
    connectionId: string;
    nickname: string;
}
interface ChatMessage {
    nickname: string;
    message: string;
}

export interface GameTableContext {
    cards: string[];
    pointsMY: number;
    pointsWY: number;

}
const CARD_SVG_PATH = "/src/assets/poker-qr/";
const exampleCards = ["AS", "KH", "TD", "JC"];

function CardHand({ cards, onCardSelect }: { cards: string[], onCardSelect: (card: string) => void }) {
    return (
        <div className="flex gap-4 justify-center items-end w-full pb-8">
            {cards.map(card => (
                <img
                    key={card}
                    src={CARD_SVG_PATH + card + ".svg"}
                    alt={card}
                    className="w-20 h-28 cursor-pointer transition-transform hover:-translate-y-2 hover:scale-105 drop-shadow-lg"
                    onClick={() => onCardSelect(card)}
                />
            ))}
        </div>
    );
}

const Table = ({
    users,
    team1,
    team2,
    chatMessages,
    showCode,
    setShowCode,
    gameCode,
    tableContext
}: {
    users: Player[];
    team1: Player[];
    team2: Player[];
    chatMessages: ChatMessage[];
    showCode: boolean;
    setShowCode: (v: boolean) => void;
    gameCode: string;
    tableContext: GameTableContext | null;
}) => {
    const navigate = useNavigate();
    const [selectedCard, setSelectedCard] = useState<string | null>(null);
    // ...existing code...
    return (
        <div className="grid grid-cols-3 gap-6 h-screen max-w-6xl mx-auto p-6 bg-green-950 text-white relative">
            {/* Kolumna 1: Chat */}
            <div className="col-span-1 flex flex-col h-full">
                <h2 className="text-2xl font-semibold mb-2">Chat</h2>
                <div className="bg-gray-800 p-4 rounded-lg flex-1 overflow-y-auto mb-2">
                    {chatMessages.map((msg, index) => (
                        <div key={index} className="mb-2">
                            <strong>{msg.nickname}:</strong> {msg.message}
                        </div>
                    ))}
                </div>
                <div className="flex gap-2 mt-2">
                    <input
                        type="text"
                        placeholder="Type your message..."
                        className="w-full p-2 border border-gray-700 rounded bg-neutral-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        name="chatInput"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                const input = e.target as HTMLInputElement;
                                const message = input.value.trim();
                                if (message) {
                                    GameService.connection?.invoke("SendMessage", gameCode, message);
                                    input.value = '';
                                }
                            }
                        }}
                    />
                    <button
                        className="p-2 bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 rounded text-white flex items-center justify-center transition-colors duration-150 cursor-pointer"
                        title="Wyślij wiadomość"
                        onClick={() => {
                            const input = document.getElementsByName('chatInput')[0] as HTMLInputElement;
                            const message = input.value.trim();
                            if (message) {
                                GameService.connection?.invoke("SendMessage", gameCode, message);
                                input.value = '';
                            }
                        }}
                    >
                        <IoMdSend size={20} />
                    </button>
                </div>
            </div>
            {/* Kolumny 2-3: UI rozgrywki */}
            <div className="col-span-2 flex flex-col h-full relative">
                <div className="flex items-center justify-between w-full mb-8">
                    <h1 className="text-4xl font-bold">Stół gry</h1>
                    <button
                        className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-700 text-white rounded hover:from-red-600 hover:to-red-800 flex items-center cursor-pointer ml-4"
                        onClick={() => {
                            GameService.connection?.invoke("LeaveRoom", gameCode);
                            navigate("/", { replace: true });
                        }}
                    >
                        <ImExit className="mr-2" /> Wyjdź
                    </button>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center">
                    <p className="mb-4">Tutaj pojawi się UI rozgrywki.</p>
                </div>
                {/* Przykładowa ręka kart na dole */}
                <div className="absolute left-0 right-0 bottom-0">
                    <CardHand cards={exampleCards} onCardSelect={setSelectedCard} />
                </div>
            </div>
        </div>
    );
};

export default Table;
