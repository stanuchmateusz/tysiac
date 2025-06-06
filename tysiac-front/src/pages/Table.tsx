import { useNavigate } from "react-router-dom";
import GameService from "../services/GameService";

import { ImExit } from "react-icons/im";
import React, { useState, useRef } from "react";
import { createPortal } from "react-dom";

import type { Card, Player, ChatMessage, GameUserContext, UpdateContext } from "./Models";

const CARD_SVG_PATH = "/src/assets/poker-qr/";
const SUIT_ICONS: Record<number, string> = {
    1: '♠', // Spades
    2: '♣', // Clubs
    3: '♥', // Hearts
    4: '♦'  // Diamonds
};

const CARD_RANKS: Record<number, string> = {
    1: 'A',
    2: 'K',
    3: 'Q',
    4: 'J',
    5: '10',
    6: '9'
};

const GAME_STAGES: Record<number, string> = {
    0: "Start",
    1: "Auction",
    2: "Card Distribution",
    3: "Playing",
    4: "End"
}
function CardHand({ cards, onCardSelect, disabled = false, canPlayCard }: {
    cards: Card[],
    onCardSelect: (card: string) => void,
    disabled?: boolean,
    canPlayCard?: (card: Card) => boolean
}) {
    return (
        <div className="flex gap-4 justify-center items-end w-full pb-8">
            {cards.map(card => (
                <button
                    key={card.shortName}
                    disabled={disabled || (canPlayCard ? !canPlayCard(card) : false)}
                    onClick={() => onCardSelect(card.shortName)}
                    className={`transition-all duration-200 transform hover:-translate-y-2 hover:scale-105 
                                ${(disabled || (canPlayCard && !canPlayCard(card))) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
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
    minBet,
}: {
    open: boolean,
    currentBet: number,
    onRaise: () => void,
    onLower: () => void,
    onPass: () => void,
    onAccept: () => void,
    disabled?: boolean,
    minBet: number,
}) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="bg-gradient-to-br from-blue-900 via-gray-900 to-green-900 rounded-2xl p-8 shadow-2xl min-w-[340px] flex flex-col items-center border-4 border-blue-700 animate-fade-in">
                <h2 className="text-3xl font-bold mb-4 text-white drop-shadow">Licytacja</h2>
                <div className="mb-6 text-lg text-blue-200">Minimalny zakład: <span className="font-bold text-yellow-300 text-2xl">{currentBet}</span></div>
                <div className="flex gap-4 mb-2">
                    <button
                        className="px-5 py-2 bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 rounded-lg text-white font-semibold shadow-md text-lg transition-all duration-150 cursor-pointer"
                        onClick={onRaise}
                        disabled={disabled}
                    >
                        +10
                    </button>
                    <button
                        className="px-5 py-2 bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 rounded-lg text-white font-semibold shadow-md text-lg transition-all duration-150 cursor-pointer"
                        onClick={onLower}
                        disabled={disabled || currentBet <= minBet}
                    >
                        -10
                    </button>
                    <button
                        className="px-5 py-2 bg-gradient-to-r from-gray-500 to-gray-700 hover:from-gray-600 hover:to-gray-800 rounded-lg text-white font-semibold shadow-md text-lg transition-all duration-150 cursor-pointer"
                        onClick={onPass}
                        disabled={disabled}
                    >
                        Pass
                    </button>
                    <button
                        className="px-5 py-2 bg-gradient-to-r from-yellow-500 to-yellow-700 hover:from-yellow-600 hover:to-yellow-800 rounded-lg text-white font-semibold shadow-md text-lg transition-all duration-150 cursor-pointer"
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
    updateCtx,
}: {
    chatMessages: ChatMessage[];
    gameCode: string;
    updateCtx: UpdateContext | null;
}) => {
    const navigate = useNavigate();
    const [message, setMessage] = useState("");
    const [showChat, setShowChat] = useState(true);
    const gameCtx = updateCtx?.gameCotext;
    const gameUserCtx = updateCtx?.userContext || null;
    // const [betModalOpen, setBetModalOpen] = useState(false);
    const minBet = (gameCtx?.currentBet ?? 100) + 10;
    const [bet, setBet] = useState(minBet); //todo czesem dalej się psuje i nie odświeża
    console.log("Table rendered with gameCtx:", gameCtx, "gameUserCtx:", gameUserCtx);
    React.useEffect(() => {
        setBet(minBet);
    }, [minBet]);

    // Reset playersGivenCard when gamePhase changes to Card Distribution (2)
    React.useEffect(() => {
        if (gameCtx?.gamePhase === 2) {
            setPlayersGivenCard([]);
        }
    }, [gameCtx?.gamePhase]);

    const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
    const [playersGivenCard, setPlayersGivenCard] = useState<string[]>([]); // For tracking players to whom cards have been given in Game Phase 2
    const [showTrumpModal, setShowTrumpModal] = useState(false);
    const prevTrumpSuit = useRef<number | null>(null);
    const trumpTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    React.useEffect(() => {
        if (gameCtx && gameCtx.trumpSuit && prevTrumpSuit.current !== null && gameCtx.trumpSuit !== prevTrumpSuit.current) {
            setShowTrumpModal(true);
            if (trumpTimeout.current) clearTimeout(trumpTimeout.current);
            trumpTimeout.current = setTimeout(() => setShowTrumpModal(false), 1000);
        }
        if (gameCtx) prevTrumpSuit.current = gameCtx.trumpSuit;
    }, [gameCtx?.trumpSuit]);

    // Function to send a chat message
    const sendMessage = () => {
        if (message.trim()) {
            GameService.connection?.invoke("SendMessage", gameCode, message)
                .catch(err => console.error("Error sending message:", err));
            setMessage("");
        }
    };
    // Handle Enter key press to send message
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    };

    // Functions to raise or lower the bet
    const handleRaise = () => setBet(bet + 10);
    const handleLower = () => setBet(bet > minBet ? bet - 10 : bet);
    // Function to pass the current
    const handlePass = () => {
        GameService.connection?.invoke("PassBid", gameCode)
        console.log("Pass bid");
    };
    // Function to accept the current bet
    const handleAccept = () => {
        // setBetModalOpen(false);
        GameService.connection?.invoke("PlaceBid", gameCode, bet)
        console.log("Accept bid:", bet);
    };

    // Function for selecting a player to give a card to
    const handleSelectPlayer = (connectionId?: string) => {
        if (gameCtx?.gamePhase === 2 && connectionId && !playersGivenCard.includes(connectionId)) {
            setSelectedPlayer(connectionId);
        }
    };
    const handleLeaveRoom = () => {
        GameService.connection?.invoke("LeaveGame", gameCode)
            .then(() => navigate("/", { replace: true }))
            .catch(err => console.error("Error leaving room:", err));
    }

    const tableRef = useRef<HTMLDivElement>(null);
    const [flyingCard, setFlyingCard] = useState<null | { card: Card, to: string, from: string }>(null);

    // Function for handling card selection
    const handleCardSelect = (cardShortName: string) => {
        if (gameCtx?.gamePhase === 2) {
            if (selectedPlayer) {
                const cardObj = gameUserCtx?.hand.find(c => c.shortName === cardShortName);
                if (cardObj) {
                    setFlyingCard({ card: cardObj, to: selectedPlayer, from: 'hand' });
                    setTimeout(() => setFlyingCard(null), 700);
                }
                GameService.connection?.invoke("GiveCard", gameCode, cardShortName, selectedPlayer);
                setPlayersGivenCard(prev => [...prev, selectedPlayer]); setSelectedPlayer(null);
            } else {
                alert("Najpierw wybierz gracza, któremu chcesz dać kartę!");
            }
        }
        else if (gameCtx?.gamePhase === 3) {
            const cardObj = gameUserCtx?.hand.find(c => c.shortName === cardShortName);
            if (cardObj) {
                setFlyingCard({ card: cardObj, to: 'table', from: 'hand' });
                setTimeout(() => setFlyingCard(null), 700);
            }
            GameService.connection?.invoke("PlayCard", gameCode, cardShortName);
            console.log(`Playing card: ${cardShortName}`);
        }
        else {
            console.log("Selected card:", cardShortName);
        }
    };

    const isCurrentPlayer = gameCtx?.currentPlayer.connectionId === GameService.connection?.connectionId;

    function canPlayCard(card: Card): boolean {
        if (!gameCtx || !gameUserCtx) return true;
        if (gameCtx.gamePhase !== 3) return true;
        if (!gameCtx.cardsOnTable || gameCtx.cardsOnTable.length === 0) return true; // table is empty, can play any card
        const firstCardInTake = gameCtx.cardsOnTable[0];
        const trumpSuit = gameCtx.trumpSuit;
        const hand = gameUserCtx.hand;

        if (card.suit === firstCardInTake.suit) {
            console.log("Same color - can play", card.shortName);
            return true;
        };

        if (card.suit === trumpSuit) {
            console.log("Trump card - can play", card.shortName, trumpSuit);
            return true;
        }

        const hasStackColor = hand.every(c => c.suit !== firstCardInTake.suit);
        const hasTrump = hand.every(c => c.suit !== trumpSuit);
        console.log("No same color or trump - can play any card", card.shortName, hasStackColor, hasTrump);
        return (hasStackColor && hasTrump) // nothing to play - can play any card
    }

    // Modal for disconnected players
    const showDisconnectedModal = !!(gameCtx && gameCtx.disconnectedPlayerCount > 0);

    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-neutral-900 via-gray-900 to-blue-950 p-6">
            {/* Disconnected Players Modal */}
            {showDisconnectedModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 animate-fade-in">
                    <div className="bg-gray-900 rounded-2xl p-8 shadow-2xl flex flex-col items-center border-4 border-red-600 min-w-[340px]">
                        <h2 className="text-3xl font-bold mb-4 text-red-400 drop-shadow">Gra została spauzowana</h2>
                        <div className="mb-6 text-lg text-white text-center">
                            {(gameCtx?.disconnectedPlayerCount ?? 0)} gracz(y) stracił(y) połączenie.<br />
                            Zaczekaj na ich powrót lub opuść stół.
                        </div>
                        <button
                            className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 rounded-lg text-white font-semibold shadow-md text-lg transition-all duration-150 cursor-pointer mt-2"
                            onClick={handleLeaveRoom}
                        >
                            Wyjdź ze stołu
                        </button>
                    </div>
                </div>
            )}
            <div className={`w-full max-w-6xl rounded-3xl shadow-2xl bg-gray-800/90 flex flex-col relative overflow-hidden border border-blue-900 ${showDisconnectedModal ? 'pointer-events-none select-none opacity-60' : ''}`}>
                {/* Header */}
                <div className="flex items-center justify-between px-8 py-6 border-b border-gray-700 bg-gradient-to-r from-blue-900/80 to-gray-900/80">
                    <div className="text-3xl font-bold text-white tracking-wide">Stół gry</div>
                    <div className="flex gap-4 items-center">
                        <button
                            className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 text-white rounded-lg font-semibold shadow-md flex items-center gap-2 transition-all duration-150 cursor-pointer"
                            onClick={handleLeaveRoom}
                        >
                            Wyjdź <ImExit />
                        </button>
                    </div>
                </div>
                {/* Main Table Area */}
                <div className="flex flex-row w-full min-h-[600px]">
                    {/* Table Area */}
                    <div className="flex-1 flex flex-col items-center justify-center relative p-8">
                        {/* Game Info Bar */}
                        <div className="w-full flex justify-between items-center mb-6">
                            <div className="flex gap-4 items-center">
                            </div>
                            <div className="flex gap-4 items-center">
                                {/* <span className="bg-blue-900/70 text-blue-200 px-4 py-2 rounded-lg font-semibold shadow">Faza: {gameCtx ? GAME_STAGES[gameCtx.gamePhase] : '-'}</span> */}
                                <span className="bg-yellow-900/70 text-yellow-200 px-4 py-2 rounded-lg font-semibold shadow">Zakład: {gameCtx?.currentBet ?? '-'}</span>
                                <span className="bg-green-900/70 text-green-200 px-4 py-2 rounded-lg font-semibold shadow">Meldunek: {gameCtx?.trumpSuit ? SUIT_ICONS[gameCtx.trumpSuit] : '-'}</span>
                                <span className="bg-gradient-to-r from-blue-700 to-blue-900 text-white px-4 py-2 rounded-lg font-bold shadow">MY: {gameUserCtx?.myTeamScore ?? 0}</span>
                                <span className="bg-gradient-to-r from-pink-700 to-pink-900 text-white px-4 py-2 rounded-lg font-bold shadow">WY: {gameUserCtx?.opponentScore ?? 0}</span>
                            </div>
                        </div>
                        {/* Table and Players */}
                        <div className="relative w-full h-[400px] flex items-center justify-center" ref={tableRef}>
                            {/* Chat on the left, fixed position */}
                            <div className={`absolute left-0 top-0 ml-4 mt-4 w-80 max-w-xs bg-gray-900/90 border border-gray-700 rounded-2xl shadow-xl p-4 z-20 transition-all duration-300 ${showChat ? '' : 'opacity-0 pointer-events-none'}`} style={{ minHeight: '340px' }}>
                                <div className="flex items-center justify-between mb-2">
                                    <h2 className="text-xl font-semibold text-white">Chat</h2>
                                    <button
                                        className="text-blue-400 hover:text-blue-200 transition-colors cursor-pointer"
                                        onClick={() => setShowChat(false)}
                                    >
                                        ✕
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto bg-gray-800 rounded-lg p-3 mb-2 border border-gray-700" style={{ maxHeight: '180px' }}>
                                    {chatMessages.map((msg, idx) => (
                                        <div key={idx} className="mb-2">
                                            <span className="font-bold text-blue-300">{msg.nickname}:</span> <span className="text-white">{msg.message}</span>
                                        </div>
                                    ))}
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
                            {/* Floating show chat button, only if chat is hidden, bottom left */}
                            {!showChat && (
                                <button
                                    className="fixed left-8 bottom-8 z-30 px-5 py-3 bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-900 hover:to-black text-white rounded-xl font-semibold shadow-lg border-2 border-blue-900 transition-all duration-150 opacity-90 cursor-pointer"
                                    onClick={() => setShowChat(true)}
                                >
                                    Pokaż chat
                                </button>
                            )}
                            {/* Players around the table (without current user's hand) */}
                            <PlayerPosition
                                player={gameUserCtx?.teammate}
                                position="top-0 left-1/2 -translate-x-1/2"
                                cardCount={gameUserCtx?.teammateCards}
                                cardDirection="normal"
                                highlightGold={gameCtx?.currentPlayer.connectionId === gameUserCtx?.teammate.connectionId}
                                isSelectable={gameCtx?.gamePhase === 2 && isCurrentPlayer && !playersGivenCard.includes(gameUserCtx?.teammate?.connectionId || '')}
                                isSelected={selectedPlayer === gameUserCtx?.teammate?.connectionId}
                                onSelect={() => handleSelectPlayer(gameUserCtx?.teammate?.connectionId)}
                            />
                            <PlayerPosition
                                player={gameUserCtx?.leftPlayer}
                                position="left-0 top-1/2 -translate-y-1/2"
                                cardCount={gameUserCtx?.leftPlayerCards}
                                cardDirection="left"
                                highlightGold={gameCtx?.currentPlayer.connectionId === gameUserCtx?.leftPlayer.connectionId}
                                isSelectable={gameCtx?.gamePhase === 2 && isCurrentPlayer && !playersGivenCard.includes(gameUserCtx?.leftPlayer?.connectionId || '')}
                                isSelected={selectedPlayer === gameUserCtx?.leftPlayer?.connectionId}
                                onSelect={() => handleSelectPlayer(gameUserCtx?.leftPlayer?.connectionId)}
                            />
                            <PlayerPosition
                                player={gameUserCtx?.rightPlayer}
                                position="right-0 top-1/2 -translate-y-1/2"
                                cardCount={gameUserCtx?.rightPlayerCards}
                                cardDirection="right"
                                highlightGold={gameCtx?.currentPlayer.connectionId === gameUserCtx?.rightPlayer.connectionId}
                                isSelectable={gameCtx?.gamePhase === 2 && isCurrentPlayer && !playersGivenCard.includes(gameUserCtx?.rightPlayer?.connectionId || '')}
                                isSelected={selectedPlayer === gameUserCtx?.rightPlayer?.connectionId}
                                onSelect={() => handleSelectPlayer(gameUserCtx?.rightPlayer?.connectionId)}
                            />
                            {/* Cards on table (center) */}
                            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-4">
                                {gameCtx?.cardsOnTable?.map((card, idx) => (
                                    <img
                                        key={card.shortName + idx}
                                        src={`${CARD_SVG_PATH}${card.shortName}.svg`}
                                        alt={card.shortName}
                                        className="w-16 h-24 drop-shadow-lg"
                                    />
                                ))}
                            </div>
                        </div>
                        {/* Card Hand */}
                        <div className="w-full flex justify-center mt-8">
                            <CardHand
                                cards={gameUserCtx?.hand || []}
                                onCardSelect={handleCardSelect}
                                disabled={!isCurrentPlayer}
                                canPlayCard={canPlayCard}
                            />
                        </div>
                        {/* Bet Modal - restyled */}
                        <BetModal
                            open={gameCtx?.gamePhase === 1 && isCurrentPlayer}
                            currentBet={bet}
                            onRaise={handleRaise}
                            onLower={handleLower}
                            onPass={handlePass}
                            onAccept={handleAccept}
                            minBet={minBet}
                        />
                        {/* Trump Modal */}
                        {showTrumpModal && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 animate-fade-in-fast">
                                <div className="bg-yellow-900 bg-opacity-90 rounded-2xl p-8 shadow-2xl flex flex-col items-center border-4 border-yellow-400 animate-trump-pop">
                                    <span className="text-5xl font-bold text-yellow-300 mb-4 drop-shadow-lg animate-trump-shine">
                                        Nowy meldunek: {gameCtx?.trumpSuit ? SUIT_ICONS[gameCtx.trumpSuit] : '-'}
                                    </span>
                                </div>
                            </div>
                        )}
                        {/* Animacja lecenia karty */}
                        {flyingCard && tableRef.current && createPortal(
                            <FlyingCardAnimation card={flyingCard.card} to={flyingCard.to} tableRef={tableRef as React.RefObject<HTMLDivElement>} gameUserCtx={gameUserCtx} />,
                            tableRef.current
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Table;

// Animacje do tailwind.config.js lub index.css:

// Komponent animacji lecenia karty
function FlyingCardAnimation({ card, to, tableRef, gameUserCtx }: { card: Card, to: string, tableRef: React.RefObject<HTMLDivElement>, gameUserCtx: GameUserContext | null }) {
    // Ustal pozycje startową (środek ręki) i końcową (gracz lub środek stołu)
    const getTargetPos = () => {
        if (!tableRef.current) return { x: 0, y: 0 };
        const rect = tableRef.current.getBoundingClientRect();
        if (to === 'table') return { x: rect.width / 2, y: rect.height / 2 };
        if (to === gameUserCtx?.teammate?.connectionId) return { x: rect.width / 2, y: 40 };
        if (to === gameUserCtx?.leftPlayer?.connectionId) return { x: 60, y: rect.height / 2 };
        if (to === gameUserCtx?.rightPlayer?.connectionId) return { x: rect.width - 60, y: rect.height / 2 };
        return { x: rect.width / 2, y: rect.height - 80 };
    };
    const start = { x: tableRef.current!.offsetWidth / 2, y: tableRef.current!.offsetHeight - 40 };
    const end = getTargetPos();
    const style = {
        position: 'absolute' as const,
        left: start.x,
        top: start.y,
        width: '80px',
        height: '112px',
        zIndex: 100,
        pointerEvents: 'none',
        animation: `fly-card 0.45s cubic-bezier(0.22,1,0.36,1) forwards`,
        '--fly-x': `${end.x - start.x}px`,
        '--fly-y': `${end.y - start.y}px`
    };
    return (
        <img
            src={`${CARD_SVG_PATH}${card.shortName}.svg`}
            alt={card.shortName}
            style={style as any}
            className="drop-shadow-lg animate-fly-card"
        />
    );
}

// Do index.css:
// @keyframes fly-card { from { transform: translate(0,0) scale(1); opacity: 1; } to { transform: translate(var(--fly-x), var(--fly-y)) scale(0.7) rotate(10deg); opacity: 0.7; } }
// .animate-fly-card { animation: fly-card 0.45s cubic-bezier(0.22,1,0.36,1) forwards; }
