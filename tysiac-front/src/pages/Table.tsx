import { useNavigate, useParams } from "react-router-dom";
import GameService from "../services/GameService";

import { ImExit } from "react-icons/im";
import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

import type { Card, ChatMessage, GameUserContext, UpdateContext } from "./Models";
import BetModal from "../components/BetModal";
import PlayerPosition from "../components/PlayerPosition";
import CardHand from "../components/CardHand";
import Options from "../components/Options";
import { CiSettings } from "react-icons/ci";
import MusicService from "../services/MusicService";

export const CARD_SVG_PATH = import.meta.env.VITE_ASSETS_PATH + "poker-qr/" || "/public/assets/poker-qr/";

export const SUIT_ICONS: Record<number, string> = {
    1: '♠', // Spades
    2: '♣', // Clubs
    3: '♥', // Hearts
    4: '♦'  // Diamonds
};

export const CARD_RANKS: Record<number, string> = {
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
    4: "End",
    5: "ShowTable",
    999: "undefined"
}


const Table = () => {
    const navigate = useNavigate();
    const [message, setMessage] = useState("");
    const [showChat, setShowChat] = useState(false);
    const [showEndGameModal, setShowEndGameModal] = useState(false);
    const [showOptions, setShowOptions] = useState(false);
    const [updateCtx, setUpdateContext] = useState<UpdateContext | null>(null);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([{ nickname: "System", message: "Witaj w grze! Użyj czatu, aby komunikować się z innymi graczami." }]);
    const { gameCode } = useParams<{ gameCode: string }>();

    useEffect(() => {
        const connection = GameService.connection;

        if (!connection || connection.state === "Disconnected") {

            navigate("/join/" + gameCode, { replace: true });
            return
        }

        //handle updates of context
        const handleUpdate = (update: UpdateContext) => {
            setUpdateContext(update);
            console.debug("Update context received:", update);
        }

        // Handle incoming chat messages
        const handleMessageReceive = (message: ChatMessage) => {
            setChatMessages(prevMessages => [...prevMessages, message]);
        };


        connection.on("UpdateContext", handleUpdate); //update context
        connection.on("MessageRecieve", handleMessageReceive);//message receive

        //get game ctx -> backend returns UpdateContext
        if (connection.state === "Connected") {
            connection.invoke("GetGameContext", gameCode)
        }

        return () => {
            connection.off("UpdateContext", handleUpdate);
            connection.off("MessageRecieve", handleMessageReceive);
        };
    }, [GameService.connection]);

    const gameCtx = updateCtx?.gameCtx;
    const gameUserCtx = updateCtx?.userCtx || null;
    const minBet = (gameCtx?.currentBet ?? 100) + 10;
    const [bet, setBet] = useState(minBet);

    useEffect(() => {
        console.debug(
            "Table rendered with gameCtx:", gameCtx,
            "gameUserCtx:", gameUserCtx);
    }, [gameCtx, gameUserCtx]);

    const isCurrentPlayer = gameCtx?.currentPlayer.connectionId === GameService.connection?.connectionId;

    useEffect(() => {
        if (isCurrentPlayer) {
            MusicService.playBell();
        }
    }, [isCurrentPlayer]);

    useEffect(() => {
        MusicService.playPlaceCard();
    }, [gameCtx?.cardsOnTable]);

    useEffect(() => {
        setBet(minBet);
    }, [minBet]);

    // Reset playersGivenCard when gamePhase changes to Card Distribution (2)
    useEffect(() => {
        if (gameCtx?.gamePhase === 2) {
            setPlayersGivenCard([]);
        }
        console.log("Game phase:", GAME_STAGES[gameCtx?.gamePhase ?? 999])
        if (gameCtx?.gamePhase === 4) { //end game
            setShowEndGameModal(true);
        }
    }, [gameCtx?.gamePhase]);

    const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
    const [playersGivenCard, setPlayersGivenCard] = useState<string[]>([]); // For tracking players to whom cards have been given in Game Phase 2
    const [showTrumpModal, setShowTrumpModal] = useState(false);
    const prevTrumpSuit = useRef<number | null>(null);
    const trumpTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (gameCtx && gameCtx.trumpSuit && prevTrumpSuit.current !== null && gameCtx.trumpSuit !== prevTrumpSuit.current) {
            setShowTrumpModal(true);
            MusicService.playMeld();
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
            .catch(err => console.error("Error leaving game:", err));
        navigate("/", { replace: true })
    }

    const tableRef = useRef<HTMLDivElement>(null);
    // Ref tu remember who started the take
    const firstPlayerInCurrentTake = useRef<string | null>(null);

    useEffect(() => {
        if (gameCtx && gameCtx.cardsOnTable && gameCtx.cardsOnTable.length === 0 && gameCtx.currentPlayer) {
            // new take setting new first in take
            firstPlayerInCurrentTake.current = gameCtx.currentPlayer.connectionId;
        }
    }, [gameCtx?.cardsOnTable, gameCtx?.currentPlayer]);

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
    // (trumf serce) ja koniczyna 9 serce 10 serce ma dupka i nie ma do koloru
    function canPlayCard(card: Card): boolean {
        if (!gameCtx || !gameUserCtx) return true;
        if (gameCtx.gamePhase !== 3) return true;
        if (!gameCtx.cardsOnTable || gameCtx.cardsOnTable.length === 0) return true; // table is empty, can play any card
        const firstCardInTake = gameCtx.cardsOnTable[0];
        const trumpSuit = gameCtx.trumpSuit;
        const hand = gameUserCtx.hand;
        const handWithoutPlayedCard = hand.filter(c => c != card)

        const minReqPoint = Math.max(...gameCtx.cardsOnTable.filter(c => c.suit == firstCardInTake.suit).map(o => o.points)) ?? firstCardInTake.points;

        if (card.suit === firstCardInTake.suit && (card.points > minReqPoint || !(handWithoutPlayedCard.find(c => (c.suit == card.suit && c.points > minReqPoint))))) { //i nie moze przebić inną 
            console.debug("Same color - can play", card.shortName);
            return true;
        };

        if (card.suit === trumpSuit && !handWithoutPlayedCard.find(c => c.suit == firstCardInTake.suit)) { //chyba ze ma jakikolwiek kolor
            console.debug("Trump card - can play", card.shortName, trumpSuit);
            return true;
        }

        const hasStackColor = hand.every(c => c.suit !== firstCardInTake.suit);
        const hasTrump = hand.every(c => c.suit !== trumpSuit);
        console.debug("No same color or trump - can play any card", card.shortName, hasStackColor, hasTrump);
        return (hasStackColor && hasTrump) // nothing to play - can play any card
    }
    // Modal for disconnected players
    const showDisconnectedModal = !!(gameCtx && gameCtx.disconnectedPlayers?.length > 0);

    return (
        <>
            <div className="fixed top-4 right-4 z-[60]"> {/* Wyższy z-index dla przycisku ustawień */}
                <button
                    onClick={() => setShowOptions(true)}
                    className="p-3 bg-gray-700/80 hover:bg-gray-600/80 backdrop-blur-sm rounded-full text-white shadow-lg transition-colors"
                    aria-label="Ustawienia"
                >
                    <CiSettings size={26} />
                </button>
            </div>
            <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-neutral-900 via-gray-900 to-blue-950 p-6">
                {/* Disconnected Players Modal */}
                {showDisconnectedModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 animate-fade-in">
                        <div className="bg-gray-900 rounded-2xl p-8 shadow-2xl flex flex-col items-center border-4 border-red-600 min-w-[340px]">
                            <h2 className="text-3xl font-bold mb-4 text-red-400 drop-shadow">Gra została spauzowana</h2>
                            <div className="mb-6 text-lg text-white text-center">
                                {(gameCtx?.disconnectedPlayers.length ?? 0)} gracz(y) stracił(y) połączenie.<br />
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
                {/* End Game Modal */}
                {showEndGameModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 animate-fade-in">
                        <div className="bg-gradient-to-br from-blue-900 via-gray-800 to-green-900 rounded-2xl p-8 shadow-2xl flex flex-col items-center border-4 border-blue-700 min-w-[340px]">
                            <h2 className="text-3xl font-bold mb-4 text-white drop-shadow">Koniec Gry!</h2>
                            <div className="mb-6 text-lg text-blue-200 text-center">
                                <p>Ostateczny wynik:</p>
                                <p><span className="font-bold text-yellow-300">Twoja drużyna:</span> {gameUserCtx?.myTeamScore ?? 0}</p>
                                <p><span className="font-bold text-pink-300">Przeciwnicy:</span> {gameUserCtx?.opponentScore ?? 0}</p>
                                {gameUserCtx && gameUserCtx.myTeamScore > gameUserCtx.opponentScore ? (
                                    <p className="text-green-400 font-bold mt-2">Gratulacje, wygraliście!</p>
                                ) : gameUserCtx && gameUserCtx.myTeamScore < gameUserCtx.opponentScore ? (
                                    <p className="text-red-400 font-bold mt-2">Niestety, tym razem się nie udało.</p>
                                ) : <p className="text-gray-300 font-bold mt-2">Remis!</p>}
                            </div>
                            <button
                                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 rounded-lg text-white font-semibold shadow-md text-lg transition-all duration-150 cursor-pointer mt-2"
                                onClick={handleLeaveRoom}
                            >
                                Wyjdź z gry
                            </button>
                        </div>
                    </div>
                )}
                <div className={`w-full rounded-3xl shadow-2xl bg-gray-800/90 flex flex-col relative overflow-hidden border border-blue-900 ${showDisconnectedModal || showOptions ? 'pointer-events-none select-none opacity-60' : ''}`}>
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
                    {/* Game Info Bar */}
                    <div className="w-full flex justify-end items-center px-8 py-4 border-b border-gray-700 bg-gray-800/70">
                        <div className="flex gap-4 items-center">
                            {/* <span className="bg-blue-900/70 text-blue-200 px-4 py-2 rounded-lg font-semibold shadow">Faza: {gameCtx ? GAME_STAGES[gameCtx.gamePhase] : '-'}</span> */}
                            <span className="bg-yellow-900/70 text-yellow-200 px-4 py-2 rounded-lg font-semibold shadow">Zakład: {gameCtx?.currentBet ?? '-'}</span>
                            <span className="bg-green-900/70 text-green-200 px-4 py-2 rounded-lg font-semibold shadow">Meldunek: {gameCtx?.trumpSuit ? SUIT_ICONS[gameCtx.trumpSuit] : '-'}</span>
                            <span className="bg-gradient-to-r from-blue-700 to-blue-900 text-white px-4 py-2 rounded-lg font-bold shadow">MY: {gameUserCtx?.myTeamScore ?? 0}</span>
                            <span className="bg-gradient-to-r from-pink-700 to-pink-900 text-white px-4 py-2 rounded-lg font-bold shadow">WY: {gameUserCtx?.opponentScore ?? 0}</span>
                        </div>
                    </div>
                    {/* Main Table Area */}
                    <div className="flex flex-row w-full min-h-screen">
                        {/* Table Area */}
                        <div className="flex-1 flex flex-col items-center justify-center relative p-8">
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
                                    position="top-[-5rem] left-1/2 -translate-x-1/2" // Przesunięto wyżej
                                    cardCount={gameUserCtx?.teammateCards}
                                    cardDirection="normal"
                                    highlightGold={gameCtx?.currentPlayer.connectionId === gameUserCtx?.teammate.connectionId}
                                    isSelectable={gameCtx?.gamePhase === 2 && isCurrentPlayer && !playersGivenCard.includes(gameUserCtx?.teammate?.connectionId || '')}
                                    isSelected={selectedPlayer === gameUserCtx?.teammate?.connectionId}
                                    hasPassed={gameCtx?.gamePhase === 1 && !!gameCtx?.passedPlayers?.find(p => p.connectionId === gameUserCtx?.teammate?.connectionId)}
                                    isTakeWinner={gameCtx?.gamePhase === 5 && gameCtx?.takeWinner?.connectionId === gameUserCtx?.teammate?.connectionId}
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
                                    hasPassed={gameCtx?.gamePhase === 1 && !!gameCtx?.passedPlayers?.find(p => p.connectionId === gameUserCtx?.leftPlayer?.connectionId)}
                                    isTakeWinner={gameCtx?.gamePhase === 5 && gameCtx?.takeWinner?.connectionId === gameUserCtx?.leftPlayer?.connectionId}
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
                                    hasPassed={gameCtx?.gamePhase === 1 && !!gameCtx?.passedPlayers?.find(p => p.connectionId === gameUserCtx?.rightPlayer?.connectionId)}
                                    isTakeWinner={gameCtx?.gamePhase === 5 && gameCtx?.takeWinner?.connectionId === gameUserCtx?.rightPlayer?.connectionId}
                                    onSelect={() => handleSelectPlayer(gameUserCtx?.rightPlayer?.connectionId)}
                                />
                                {/* Cards on table (center) */}
                                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none">
                                    {(() => {
                                        if (!gameCtx?.cardsOnTable?.length || !gameUserCtx) return null;

                                        const playerOrder = [
                                            gameUserCtx.me?.connectionId,
                                            gameUserCtx.leftPlayer?.connectionId,
                                            gameUserCtx.teammate?.connectionId,
                                            gameUserCtx.rightPlayer?.connectionId
                                        ];

                                        const leaderId = firstPlayerInCurrentTake.current;
                                        const indexOfLeader = leaderId ? playerOrder.indexOf(leaderId) : -1;

                                        if (indexOfLeader === -1 && gameCtx.cardsOnTable.length > 0) {
                                            console.error("Lider lewy nie został znaleziony w playerOrder lub firstPlayerInTrick.current nie jest ustawiony.");
                                            return null;
                                        }


                                        const slotNames = ['bottom', 'left', 'top', 'right'];

                                        // Render kart
                                        return gameCtx.cardsOnTable.map((card, cardIndexInTrick) => {
                                            const style: React.CSSProperties = {
                                                position: 'absolute',
                                                left: '50%',
                                                top: '50%',
                                                transform: 'translate(-50%, -50%)',
                                                zIndex: 10 + cardIndexInTrick,
                                            };
                                            let rotation = 0;
                                            let offsetX = 0, offsetY = 0;


                                            const playerVisualIndex = (indexOfLeader + cardIndexInTrick) % playerOrder.length;
                                            const pos = slotNames[playerVisualIndex];

                                            if (pos === 'bottom') { offsetY = 90; rotation = 0; }
                                            if (pos === 'left') { offsetX = -90; rotation = -90; }
                                            if (pos === 'top') { offsetY = -90; rotation = 180; }
                                            if (pos === 'right') { offsetX = 90; rotation = 90; }
                                            style.transform = `translate(-50%, -50%) translate(${offsetX}px, ${offsetY}px) rotate(${rotation}deg)`;
                                            return (
                                                <img
                                                    key={card.shortName + cardIndexInTrick}
                                                    src={`${CARD_SVG_PATH}${card.shortName}.svg`}
                                                    alt={card.shortName}
                                                    style={style}
                                                    className="drop-shadow-lg w-16 h-24"
                                                />
                                            );
                                        });
                                    })()}
                                </div>
                            </div>
                            {/* Card Hand */}
                            <div className="w-full flex justify-center mt-48">
                                <CardHand
                                    cards={gameUserCtx?.hand || []}
                                    onCardSelect={handleCardSelect}
                                    disabled={!isCurrentPlayer || gameCtx?.gamePhase == 5}
                                    canPlayCard={canPlayCard}
                                />
                            </div>
                            {/* Bet Modal */}
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
                <Options isOpen={showOptions} onClose={() => setShowOptions(false)} />
            </div>
        </>
    );
};

export default Table;

function FlyingCardAnimation({ card, to, tableRef, gameUserCtx }: { card: Card, to: string, tableRef: React.RefObject<HTMLDivElement>, gameUserCtx: GameUserContext | null }) {

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
