import { useNavigate } from "react-router-dom";
import GameService from "../services/GameService";

import { ImExit } from "react-icons/im";
import { IoMdSend } from "react-icons/io";
import { useState } from "react";

interface Player {
    id: string;
    connectionId: string;
    nickname: string;
}
interface ChatMessage {
    nickname: string;
    message: string;
}
interface Card {
    name: number;
    color: number;
    points: number;
    shortName: string;
}

export interface GameContext {
    currentPlayer: Player;
    gamePhase: string;
    cardsOnTable: Card[];
    musikCards: number;
    currentTrick: Card[];
}

export interface GameUserContext {
    me: Player;
    teammate: Player;
    leftPlayer: Player;
    rightPlayer: Player;
    teammateCards: number;
    leftPlayerCards: number;
    rightPlayerCards: number;
    hand: Card[];
    myTeamScore: number; //my
    opponentScore: number; //wy
}
const CARD_SVG_PATH = "/src/assets/poker-qr/";
const SUIT_ICONS: Record<string, string> = {
    'S': '♠', // Spades
    'C': '♣', // Clubs
    'H': '♥', // Hearts
    'D': '♦'  // Diamonds
};

const CARD_RANKS: Record<string, string> = {
    'A': 'A',
    'K': 'K',
    'Q': 'Q',
    'J': 'J',
    '10': '10',
    '9': '9'
};

function CardHand({ cards, onCardSelect, disabled = false }: {
    cards: Card[],
    onCardSelect: (card: string) => void,
    disabled?: boolean
}) {
    return (
        <div className="flex gap-4 justify-center items-end w-full pb-8">
            {cards.map(card => (
                <button
                    key={card.shortName}
                    disabled={disabled}
                    onClick={() => onCardSelect(card.shortName)}
                    className={`transition-all duration-200 transform hover:-translate-y-2 hover:scale-105 
                                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                    <img
                        src={`${CARD_SVG_PATH}${card.shortName}.svg`}
                        alt={card.shortName}
                        className="w-20 h-28 drop-shadow-lg"
                    />
                </button>
            ))}
        </div>
    );
}
function PlayerPosition({ player, position, isCurrentPlayer = false, cardCount = 0 }: {
    player?: Player,
    position: string,
    isCurrentPlayer?: boolean,
    cardCount?: number
}) {
    if (!player) return null;

    return (
        <div className={`absolute ${position} flex flex-col items-center`}>
            <div className={`rounded-full px-4 py-2 mb-2 ${isCurrentPlayer ? 'bg-blue-600' : 'bg-gray-800'
                }`}>
                {player.nickname}
            </div>
            <div className="flex gap-1">
                {Array.from({ length: Math.min(cardCount, 5) }).map((_, idx) => (
                    <div
                        key={idx}
                        className="w-10 h-14 bg-blue-900 border-2 border-blue-700 rounded-md shadow-md"
                    />
                ))}
                {cardCount > 5 && (
                    <div className="text-xs ml-1 self-center">+{cardCount - 5}</div>
                )}
            </div>
        </div>
    );
}

const Table = ({
    chatMessages,
    gameCode,
    gameCtx,
    gameUserCtx,
}: {
    chatMessages: ChatMessage[];
    gameCode: string;
    gameCtx: GameContext | null;
    gameUserCtx: GameUserContext | null;
}) => {
    const navigate = useNavigate();
    const [message, setMessage] = useState("");
    const [showChat, setShowChat] = useState(true);

    // Send chat message
    const sendMessage = () => {
        if (message.trim()) {
            GameService.connection?.invoke("SendMessage", gameCode, message)
                .catch(err => console.error("Error sending message:", err));
            setMessage("");
        }
    };

    // Handle key press in chat
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    };


    return (
        <div className="grid grid-cols-3 gap-6 h-screen max-w-6xl mx-auto p-6 bg-green-900 text-white relative">
            {/* Kolumna 1: Chat */}
            {showChat && (
                <div className="col-span-1 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-2xl font-semibold">Chat</h2>
                        <button
                            className="ml-2 p-1 rounded bg-gray-700 hover:bg-gray-600 text-white text-xs"
                            onClick={() => setShowChat(false)}
                            title="Ukryj chat"
                        >
                            Ukryj
                        </button>
                    </div>
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
                            placeholder="Wiadomość..."
                            className="w-full p-2 border border-gray-700 rounded bg-neutral-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                        />
                        <button
                            className="p-2 bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 rounded text-white flex items-center justify-center transition-colors duration-150 cursor-pointer"
                            title="Wyślij wiadomość"
                            onClick={sendMessage}
                        >
                            <IoMdSend size={20} />
                        </button>
                    </div>
                </div>
            )}
            {!showChat && (
                <button
                    className="absolute top-4 left-4 z-50 p-2 bg-gray-700 hover:bg-gray-600 rounded text-white text-xs"
                    onClick={() => setShowChat(true)}
                    title="Pokaż chat"
                >
                    Pokaż chat
                </button>
            )}

            {/* Kolumny 2-3: UI rozgrywki */}
            <div className="col-span-2 flex flex-col h-full relative">
                <div className="flex items-center justify-between w-full mb-4">
                    <div>
                        <h1 className="text-3xl font-bold">Tysiąc - Gra Karciana</h1>
                        <div className="flex items-center mt-1">
                            <span className="text-blue-300 mr-4">MY: {gameUserCtx?.myTeamScore || 0}</span>
                            <span className="text-red-300">WY: {gameUserCtx?.myTeamScore || 0}</span>
                            {/* {tableContext?.trumpSuit && (
                                <div className="ml-4 flex items-center">
                                    <span className="mr-2">Atut:</span>
                                    <span className="text-xl">{SUIT_ICONS[tableContext.trumpSuit]}</span>
                                </div>
                            )} */}
                        </div>
                    </div>
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

                {/* Główny obszar gry */}
                <div className="flex-1 relative bg-green-800 rounded-2xl border-8 border-yellow-800 shadow-lg overflow-hidden">
                    {/* Muzyk */}
                    {/* {tableContext?.musik && tableContext.musik.length > 0 && (
                        <div className="absolute top-4 left-4 bg-green-900 p-2 rounded-lg">
                            <h3 className="text-sm mb-1">Muzyk</h3>
                            <div className="flex gap-1">
                                {tableContext.musik.map((card, idx) => (
                                    <div
                                        key={idx}
                                        className="w-10 h-14 bg-blue-900 border-2 border-blue-700 rounded-md shadow-md"
                                    />
                                ))}
                            </div>
                        </div>
                    )} */}

                    {/* Aktualna lewa */}
                    {gameCtx?.currentTrick && gameCtx.currentTrick.length > 0 && (
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                            <div className="flex gap-4">
                                {gameCtx.currentTrick.map((card, idx) => (
                                    <div
                                        key={idx}
                                        className="w-16 h-24 bg-white rounded-md border border-gray-300 shadow-lg flex flex-col p-1"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className={`text-lg font-bold ${card.shortName.endsWith('H') || card.shortName.endsWith('D') ? 'text-red-600' : 'text-black'
                                                }`}>
                                                {CARD_RANKS[card.shortName.slice(0, -1)]}
                                            </div>
                                            <div className={`text-xs ${card.shortName.endsWith('H') || card.shortName.endsWith('D') ? 'text-red-600' : 'text-black'
                                                }`}>
                                                {SUIT_ICONS[card.shortName.slice(-1)]}
                                            </div>
                                        </div>
                                        <div className="flex-1 flex items-center justify-center">
                                            <div className={`text-3xl ${card.shortName.endsWith('H') || card.shortName.endsWith('D') ? 'text-red-600' : 'text-black'
                                                }`}>
                                                {SUIT_ICONS[card.shortName.slice(-1)]}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Informacja o turze */}
                    {gameCtx?.currentPlayer && (
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-lg">
                            {gameCtx.currentPlayer.connectionId === GameService.connection?.connectionId
                                ? "Twoja kolej!"
                                : "Czekaj na swoją turę..."}
                        </div>
                    )}

                    {/* Gracze */}
                    <PlayerPosition
                        player={gameUserCtx?.teammate}
                        position="top-4 left-1/2 transform -translate-x-1/2"
                        cardCount={gameUserCtx?.teammateCards || 0}
                        isCurrentPlayer={gameCtx?.currentPlayer === gameUserCtx?.teammate}
                    />
                    <PlayerPosition
                        player={gameUserCtx?.rightPlayer}
                        position="top-1/2 right-4 transform -translate-y-1/2"
                        cardCount={gameUserCtx?.rightPlayerCards || 0}
                        isCurrentPlayer={gameCtx?.currentPlayer === gameUserCtx?.rightPlayer}
                    />
                    <PlayerPosition
                        player={gameUserCtx?.leftPlayer}
                        position="top-1/2 left-4 transform -translate-y-1/2"
                        cardCount={gameUserCtx?.leftPlayerCards || 0}
                        isCurrentPlayer={gameCtx?.currentPlayer === gameUserCtx?.leftPlayer}
                    />
                    {/* <PlayerPosition
                        player={gameUserCtx?.me}
                        position="bottom-4 left-1/2 transform -translate-x-1/2"
                        cardCount={gameUserCtx?.hand?.length || 0}
                        isCurrentPlayer={gameCtx?.currentPlayer === gameUserCtx?.me} 
                         */}
                </div>



                {/* Ręka kart */}
                <div className="absolute left-0 right-0 bottom-0">
                    {gameUserCtx?.hand && (
                        <CardHand
                            cards={gameUserCtx.hand}
                            onCardSelect={(card) => { console.log("Selected card:", card); }}
                            disabled={gameCtx?.currentPlayer !== gameUserCtx?.me || gameCtx?.gamePhase !== "Playing"}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default Table;