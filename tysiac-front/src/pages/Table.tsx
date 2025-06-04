import { useNavigate } from "react-router-dom";
import GameService from "../services/GameService";

import { ImExit } from "react-icons/im";
import { IoMdSend } from "react-icons/io";
import React, { useState } from "react";

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
    gamePhase: number;
    cardsOnTable: Card[];
    trumpSuit: number;
    musikCount: number;
    currentBet: number;
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
const SUIT_ICONS: Record<number, string> = {
    0: '♠', // Spades
    1: '♣', // Clubs
    2: '♥', // Hearts
    3: '♦'  // Diamonds
};

const CARD_RANKS: Record<number, string> = {
    0: 'A',
    1: 'K',
    2: 'Q',
    3: 'J',
    4: '10',
    5: '9'
};

const GAME_STAGES: Record<number, string> = {
    0: "Start",
    1: "Auction",
    2: "Card Distribution",
    3: "Playing",
    4: "End"
}
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
function PlayerPosition({ player, position, cardCount = 0, cardDirection, highlightGold, isSelectable, isSelected, onSelect }: {
    player?: Player,
    position: string,
    isCurrentPlayer?: boolean,
    cardCount?: number,
    cardDirection?: 'normal' | 'left' | 'right',
    highlightGold?: boolean,
    isSelectable?: boolean,
    isSelected?: boolean,
    onSelect?: () => void
}) {
    if (!player) return null;

    // Ustal styl rotacji kart
    let cardStyle = '';
    if (cardDirection === 'left') cardStyle = 'rotate-[-90deg] origin-bottom left';
    if (cardDirection === 'right') cardStyle = 'rotate-[90deg] origin-bottom right';

    // Ustal flex-row dla linii kart
    let cardRowClass = 'flex gap-0.5'; // zmniejsz gap
    if (cardDirection === 'left') cardRowClass += ' flex-col-reverse';
    if (cardDirection === 'right') cardRowClass += ' flex-col';

    // Poprawne podświetlenie nicka na złoto
    let playerClass = 'rounded-full px-4 py-2 mb-2 cursor-pointer ';
    if (isSelected) {
        playerClass += 'bg-red-600 text-white font-bold border-2 border-red-400 animate-pulse ';
    } else if (highlightGold) {
        playerClass += 'bg-yellow-400 text-black font-bold border-2 border-yellow-300 animate-pulse ';
    } else {
        playerClass += 'bg-gray-800 ';
    }
    if (!isSelectable) playerClass += ' cursor-default ';

    return (
        <div className={`absolute ${position} flex flex-col items-center`}>
            <div className={playerClass} onClick={isSelectable && onSelect ? onSelect : undefined}>{player.nickname}</div>
            <div className={cardRowClass}>
                {Array.from({ length: cardCount }).map((_, idx) => (
                    <div
                        key={idx}
                        className={`w-10 h-14 bg-blue-900 border-2 border-blue-700 rounded-md shadow-md ${cardStyle}`}
                    />
                ))}
            </div>
        </div>
    );
}

// Modal do betowania
function BetModal({
    open,
    currentBet,
    onRaise,
    onLower,
    onPass,
    onAccept,
    disabled,
    minBet
}: {
    open: boolean,
    currentBet: number,
    onRaise: () => void,
    onLower: () => void,
    onPass: () => void,
    onAccept: () => void,
    disabled?: boolean,
    minBet: number
}) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="bg-green-900 bg-opacity-90 rounded-xl p-8 shadow-2xl min-w-[320px] flex flex-col items-center">
                <h2 className="text-2xl font-bold mb-4">Licytacja</h2>
                <div className="mb-6 text-lg">Aktualny zakład: <span className="font-bold text-yellow-300">{currentBet}</span></div>
                <div className="flex gap-4 mb-2">
                    <button
                        className="px-4 py-2 bg-blue-700 hover:bg-blue-800 rounded text-white font-semibold"
                        onClick={onRaise}
                        disabled={disabled}
                    >
                        +10
                    </button>
                    <button
                        className="px-4 py-2 bg-blue-700 hover:bg-blue-800 rounded text-white font-semibold"
                        onClick={onLower}
                        disabled={disabled || currentBet <= minBet}
                    >
                        -10
                    </button>
                    <button
                        className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded text-white font-semibold"
                        onClick={onPass}
                        disabled={disabled}
                    >
                        Pass
                    </button>
                    <button
                        className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded text-white font-semibold"
                        onClick={onAccept}
                        disabled={disabled}
                    >
                        Akceptuj
                    </button>
                </div>
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
    const [betModalOpen, setBetModalOpen] = useState(false);
    const minBet = (gameCtx?.currentBet ?? 100) + 10;
    const [bet, setBet] = useState(minBet);

    React.useEffect(() => {
        setBet(minBet);
    }, [minBet]);

    const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
    const [playersGivenCard, setPlayersGivenCard] = useState<string[]>([]); // For tracking players to whom cards have been given in Game Phase 2


    const sendMessage = () => {
        if (message.trim()) {
            GameService.connection?.invoke("SendMessage", gameCode, message)
                .catch(err => console.error("Error sending message:", err));
            setMessage("");
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    };

    // Funkcje do obsługi betowania
    const handleRaise = () => setBet(bet + 10);
    const handleLower = () => setBet(bet > minBet ? bet - 10 : bet);
    const handlePass = () => {
        setBetModalOpen(false);

        GameService.connection?.invoke("PassBid", gameCode)
        console.log("Pass bid");
    };
    const handleAccept = () => {
        setBetModalOpen(false);
        GameService.connection?.invoke("PlaceBid", gameCode, bet)
        console.log("Accept bid:", bet);
    };

    // Funkcja do obsługi wyboru gracza do przekazania karty
    const handleSelectPlayer = (connectionId?: string) => {
        if (gameCtx?.gamePhase === 2 && connectionId && !playersGivenCard.includes(connectionId)) {
            setSelectedPlayer(connectionId);
        }
    };

    // Funkcja do obsługi wyboru karty
    const handleCardSelect = (card: string) => {
        if (gameCtx?.gamePhase === 2) {
            if (selectedPlayer) {

                console.log(`Giving card ${card} to player ${selectedPlayer}`);
                GameService.connection?.invoke("GiveCard", gameCode, card, selectedPlayer);
                setPlayersGivenCard(prev => [...prev, selectedPlayer]); // zapamiętaj komu już dano
                setSelectedPlayer(null); // reset po przekazaniu
            } else {
                alert("Najpierw wybierz gracza, któremu chcesz dać kartę!");
            }
        } else {

            console.log("Selected card:", card);
        }
    };

    const isCurrentPlayer = gameCtx?.currentPlayer.connectionId === GameService.connection?.connectionId;

    return (
        <div className={`grid ${showChat ? 'grid-cols-3' : 'grid-cols-1'} gap-6 h-screen max-w-6xl mx-auto p-6 bg-green-900 text-white relative`}>
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
                            onKeyDown={handleKeyPress}
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
            <div className={`${showChat ? 'col-span-2' : 'col-span-1'} flex flex-col h-full relative`}>
                <div className="flex items-center justify-between w-full mb-4">
                    <div>
                        <h1 className="text-3xl font-bold">Tysiąc - Gra Karciana</h1>
                        <div className="flex items-center mt-1">
                            <span className="text-blue-300 mr-4">MY: {gameUserCtx?.myTeamScore || 0}</span>
                            <span className="text-red-300">WY: {gameUserCtx?.myTeamScore || 0}</span>
                            <span className="mx-4">State: {gameCtx != null && GAME_STAGES[gameCtx.gamePhase]}</span>
                            {gameCtx?.trumpSuit != 0 && (
                                <div className="ml-4 flex items-center">
                                    <span className="mr-2">Atut:</span>
                                    <span className="text-xl">{gameCtx != null && SUIT_ICONS[gameCtx.trumpSuit]}</span>
                                </div>
                            )}
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
                    {/* Musik */}
                    {gameCtx?.gamePhase === 1 && gameCtx?.musikCount && gameCtx?.musikCount > 0 && (
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
                            <div className="flex gap-1 justify-center">
                                {Array.from({ length: gameCtx.musikCount }).map((_, idx) => (
                                    <div
                                        key={idx}
                                        className="w-10 h-14 bg-blue-900 border-2 border-blue-700 rounded-md shadow-md"
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Aktualna lewa */}
                    {gameCtx?.cardsOnTable && gameCtx.cardsOnTable.length > 0 && (
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                            <div className="flex gap-4">
                                {gameCtx.cardsOnTable.map((card, idx) => (
                                    <div
                                        key={idx}
                                        className="w-16 h-24 bg-white rounded-md border border-gray-300 shadow-lg flex flex-col p-1"
                                    >
                                        <img
                                            src={`${CARD_SVG_PATH}${card.shortName}.svg`}
                                            alt={card.shortName}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Informacja o turze */}
                    {gameCtx?.currentPlayer && (
                        <div className="absolute left-1/2 bottom-42 transform -translate-x-1/2 z-30">
                            <div className={`px-8 py-4 rounded-2xl shadow-xl text-2xl font-bold text-center backdrop-blur bg-black/40 ${gameCtx.currentPlayer.connectionId === GameService.connection?.connectionId ? 'text-green-200 border-2 border-green-400' : 'text-yellow-200 border-2 border-yellow-400'}`}>
                                {gameCtx.currentPlayer.connectionId === GameService.connection?.connectionId
                                    ? 'Twoja kolej!'
                                    : 'Czekaj na swoją turę...'}
                            </div>
                        </div>
                    )}

                    {/* Gracze */}
                    <PlayerPosition
                        player={gameUserCtx?.teammate}
                        position="top-4 left-1/2 transform -translate-x-1/2"
                        cardCount={gameUserCtx?.teammateCards || 0}
                        highlightGold={gameCtx?.currentPlayer.connectionId === gameUserCtx?.teammate.connectionId && !isCurrentPlayer}
                        isSelectable={gameCtx?.gamePhase === 2 && !playersGivenCard.includes(gameUserCtx?.teammate?.connectionId || '')}
                        isSelected={selectedPlayer === gameUserCtx?.teammate.connectionId}
                        onSelect={() => handleSelectPlayer(gameUserCtx?.teammate?.connectionId)}
                    />
                    <PlayerPosition
                        player={gameUserCtx?.rightPlayer}
                        position="top-1/2 right-4 transform -translate-y-1/2"
                        cardCount={gameUserCtx?.rightPlayerCards || 0}
                        cardDirection="right"
                        highlightGold={gameCtx?.currentPlayer.connectionId === gameUserCtx?.rightPlayer.connectionId && !isCurrentPlayer}
                        isSelectable={gameCtx?.gamePhase === 2 && !playersGivenCard.includes(gameUserCtx?.rightPlayer?.connectionId || '')}
                        isSelected={selectedPlayer === gameUserCtx?.rightPlayer.connectionId}
                        onSelect={() => handleSelectPlayer(gameUserCtx?.rightPlayer?.connectionId)}
                    />
                    <PlayerPosition
                        player={gameUserCtx?.leftPlayer}
                        position="top-1/2 left-4 transform -translate-y-1/2"
                        cardCount={gameUserCtx?.leftPlayerCards || 0}
                        cardDirection="left"
                        highlightGold={gameCtx?.currentPlayer.connectionId === gameUserCtx?.leftPlayer.connectionId && !isCurrentPlayer}
                        isSelectable={gameCtx?.gamePhase === 2 && !playersGivenCard.includes(gameUserCtx?.leftPlayer?.connectionId || '')}
                        isSelected={selectedPlayer === gameUserCtx?.leftPlayer.connectionId}
                        onSelect={() => handleSelectPlayer(gameUserCtx?.leftPlayer?.connectionId)}
                    />

                </div>



                {/* Ręka kart */}
                <div className="absolute left-0 right-0 bottom-0">
                    {gameUserCtx?.hand && (
                        <CardHand
                            cards={gameUserCtx.hand}
                            onCardSelect={handleCardSelect}
                            disabled={!isCurrentPlayer || (gameCtx?.gamePhase != 2 && gameCtx?.gamePhase != 3)}
                        />
                    )}
                </div>
            </div>
            <BetModal
                open={betModalOpen}
                currentBet={bet}
                onRaise={handleRaise}
                onLower={handleLower}
                onPass={handlePass}
                onAccept={handleAccept}
                disabled={!isCurrentPlayer}
                minBet={minBet}
            />
            {gameCtx?.gamePhase === 1 && (
                <button
                    className="fixed bottom-8 right-8 z-50 px-6 py-3 bg-yellow-600 hover:bg-yellow-700 rounded-full text-white font-bold shadow-lg"
                    onClick={() => setBetModalOpen(true)}
                    disabled={!isCurrentPlayer}
                >
                    Otwórz licytację
                </button>
            )}
        </div>
    );
};

export default Table;