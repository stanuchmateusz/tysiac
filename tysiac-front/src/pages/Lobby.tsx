import { useState, useRef, useEffect } from "react";
import { GrHide, GrView } from "react-icons/gr";
import { ImExit } from "react-icons/im";
import { IoMdAddCircle } from "react-icons/io";
import { IoMdSend } from "react-icons/io";
import { FaCrown } from "react-icons/fa";
import GameService from "../services/GameService";
import { useNavigate, useParams } from "react-router-dom";
import { CiSettings } from "react-icons/ci";
import Options from "../components/Options";
import type { ChatMessage, LobbyContext, Player } from "./Models";
import MusicService from "../services/MusicService";
import { setCookie, userIdCookieName } from "../utils/Cookies";

const JoinTeamHandler = (isTeam1: boolean, gameCode: string) => {
    GameService.connection?.invoke("JoinTeam", gameCode, isTeam1)
        .catch(err => {
            console.error(`Error joining team:`, err);
        });
};

const Lobby = () => {
    const navigate = useNavigate();
    // --- Cooldown states ---
    const [chatCooldown, setChatCooldown] = useState(false);
    const [teamCooldown, setTeamCooldown] = useState(false);
    const [cooldownMsg, setCooldownMsg] = useState("");
    // --- Anti-spam states ---
    const [chatAttempts, setChatAttempts] = useState<number[]>([]); // timestamps
    const [teamAttempts, setTeamAttempts] = useState<number[]>([]); // timestamps
    const [showOptions, setShowOptions] = useState(false);

    const { gameCode } = useParams<{ gameCode: string }>();
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([{ nickname: "System", message: "Witaj w grze! Użyj czatu, aby komunikować się z innymi graczami." }]);
    const [showCode, setShowCode] = useState(false);
    const chatInputRef = useRef<HTMLInputElement>(null);
    const [lobbyContext, setLobbyContext] = useState<LobbyContext | null>(null);
    const [me, setMe] = useState<Player | null>(null);

    if (!gameCode) {
        navigate("/", { replace: true });
        return;
    }
    useEffect(() => {
        const connection = GameService.connection;

        if (!connection || connection.state === "Disconnected") {
            //redirest to home join
            navigate("/join/" + gameCode,);
            return
        }

        // Handle lobby updates
        const handleRoomUpdate = (lobbyCtx: LobbyContext) => {
            console.debug("Lobby updated:", lobbyCtx);
            setLobbyContext(lobbyCtx);
            var newMe = lobbyCtx.players.find(p => p.connectionId === connection.connectionId);
            setMe(newMe ?? null);

            setCookie(userIdCookieName, newMe?.id || "", 1);
        };

        // Handle incoming chat messages
        const handleMessageReceive = (message: ChatMessage) => {
            setChatMessages(prevMessages => [...prevMessages, message]);
        };

        // Finish lobby start the game
        const handleGameCreated = () => {
            console.log("New game created");
            navigate("/game/" + gameCode, { replace: true });
            return;
        }

        const handleGetKicked = () => {
            confirm("You got kiecked")
            navigate("/", { replace: true });
        }

        if (connection.state === "Connected") ////request lobby context
        {
            connection.invoke("GetLobbyContext", gameCode)
        }
        connection.on("Kicked", handleGetKicked);
        connection.on("GameCreated", handleGameCreated); //game created
        connection.on("MessageRecieve", handleMessageReceive);//message receive
        connection.on("LobbyUpdate", handleRoomUpdate);//lobby update

        return () => {
            connection.off("Kicked", handleGetKicked);
            connection.off("GameCreated", handleGameCreated);
            connection.off("MessageRecieve", handleMessageReceive);
            connection.off("LobbyUpdate", handleRoomUpdate);
        };
    }, [GameService.connection]);

    const host = lobbyContext?.host ?? null;
    const users: Player[] = lobbyContext?.players ?? [];
    const team1: Player[] = lobbyContext?.team1 ?? [];
    const team2: Player[] = lobbyContext?.team2 ?? [];
    const IsHost = () => {
        return GameService.connection?.state === "Connected" && GameService.connection?.connectionId == host?.connectionId;
    }
    const isMe = (player: Player) => me && player.connectionId === me.connectionId;
    const handleSendMessage = () => {
        const now = Date.now();
        // Filter atteps since last 10 secs
        const recent = chatAttempts.filter(ts => now - ts < 10000);
        if (recent.length >= 4) {
            setCooldownMsg("Za dużo wiadomości! Odczekaj 5 sekund.");
            setChatCooldown(true);
            setTimeout(() => {
                setChatCooldown(false);
                setCooldownMsg("");
                setChatAttempts([]);
            }, 5000);
            return;
        }
        if (chatCooldown) return;
        const input = chatInputRef.current;
        if (input) {
            const message = input.value.trim();
            if (message) {
                GameService.connection?.invoke("SendMessage", gameCode, message);
                input.value = '';
                setChatAttempts([...recent, now]);
            }
        }
    };
    const handleJoinTeam = (isTeam1: boolean) => {
        const now = Date.now();
        const recent = teamAttempts.filter(ts => now - ts < 10000);
        if (recent.length >= 4) {
            setCooldownMsg("Za dużo zmian drużyny! Odczekaj 5 sekund.");
            setTeamCooldown(true);
            setTimeout(() => {
                setTeamCooldown(false);
                setCooldownMsg("");
                setTeamAttempts([]);
            }, 5000);
            return;
        }
        if (teamCooldown) return;
        MusicService.playClick();
        JoinTeamHandler(isTeam1, gameCode);
        setTeamAttempts([...recent, now]);
    };
    const handleLeaveTeam = () => {
        const now = Date.now();
        const recent = teamAttempts.filter(ts => now - ts < 10000);
        if (recent.length >= 4) {
            setCooldownMsg("Za dużo zmian drużyny! Odczekaj 5 sekund.");
            setTeamCooldown(true);
            setTimeout(() => {
                setTeamCooldown(false);
                setCooldownMsg("");
                setTeamAttempts([]);
            }, 5000);
            return;
        }
        if (teamCooldown) return;
        MusicService.playClick();
        GameService.connection?.invoke("LeaveTeam", gameCode);
        setTeamAttempts([...recent, now]);
    };

    const onStartGame = () => {
        GameService.connection?.invoke("StartRoom", gameCode);
    };

    return (
        <>
            <div className="fixed top-4 right-4 z-[60]">
                <button
                    onClick={() => setShowOptions(true)}
                    className="p-3 bg-gray-700/80 hover:bg-gray-600/80 backdrop-blur-sm rounded-full text-white shadow-lg transition-colors"
                    aria-label="Ustawienia"
                >
                    <CiSettings size={26} />
                </button>
            </div>
            <div className="flex flex-col md:flex-row min-h-screen w-full bg-neutral-900 text-white p-2 xs:p-4 sm:p-6">
                {cooldownMsg && (
                    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white px-4 py-2 rounded shadow-lg animate-pulse text-center text-base font-semibold">
                        {cooldownMsg}
                    </div>
                )}
                <div className="flex flex-col flex-1 max-w-6xl mx-auto gap-4 md:gap-6">
                    <div className="flex flex-col md:flex-row items-center justify-between mb-4 md:mb-6 gap-2 md:gap-0">
                        <h1 className="text-3xl md:text-4xl font-bold w-full md:w-auto text-center md:text-left">Lobby</h1>
                        <div className="flex flex-wrap items-center space-x-2 md:space-x-4 w-full md:w-auto justify-end">
                            <span className="text-md font-mono bg-gray-800 px-3 py-1 rounded select-all w-28 md:w-32 text-center" title="Kod do gry">
                                {showCode ? gameCode : '••••••'}
                            </span>
                            <button onClick={() => {
                                setShowCode(!showCode);
                                MusicService.playClick();
                            }} className="cursor-pointer px-2 py-1 bg-gradient-to-r from-gray-600 to-gray-800 rounded text-white hover:from-gray-700 hover:to-gray-900">
                                {showCode ? <GrHide /> : <GrView />}
                            </button>
                            <button onClick={async () => {
                                try {
                                    await navigator.clipboard.writeText(gameCode ?? '');
                                    MusicService.playClick();
                                } catch (err) {
                                    console.log("Can't copy - sorry")
                                    alert("Can't copy - page needs to be secure")
                                }
                            }}
                                className="cursor-pointer p-2 bg-gradient-to-r from-blue-500 to-blue-700 rounded text-white hover:from-blue-600 hover:to-blue-800">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <rect x="9" y="9" width="13" height="13" rx="2" fill="#3b82f6" stroke="#fff" strokeWidth="2" />
                                    <rect x="3" y="3" width="13" height="13" rx="2" stroke="#fff" strokeWidth="2" />
                                </svg>
                            </button>
                            <button onClick={() => { GameService.connection?.invoke("LeaveRoom", gameCode); navigate("/", { replace: true }); }} className="cursor-pointer px-4 py-2 bg-gradient-to-r from-red-500 to-red-700 rounded text-white hover:from-red-600 hover:to-red-800 flex items-center">
                                <ImExit className="mr-2" /> Wyjdź
                            </button>
                        </div>
                    </div>
                    <div className="flex flex-col md:flex-row gap-4 md:gap-6 flex-1">
                        <div className="flex flex-col flex-1 gap-4">
                            <div className="w-full bg-gray-700 rounded-lg p-3 md:p-4 flex flex-col max-h-72 overflow-y-auto mb-4">
                                <h2 className="text-lg md:text-xl font-semibold mb-2 text-center">Drużyny</h2>
                                <div className="overflow-x-auto">
                                    <table className="w-full mb-0 border-separate border-spacing-y-1 table-fixed min-w-[320px]">
                                        <colgroup>
                                            <col className="w-1/2" />
                                            <col className="w-1/2" />
                                        </colgroup>
                                        <thead>
                                            <tr>
                                                <th className="py-2 px-4 border-b text-lg text-blue-300 bg-gray-800 rounded-tl-lg">Drużyna I</th>
                                                <th className="py-2 px-4 border-b text-lg text-pink-300 bg-gray-800 rounded-tr-lg">Drużyna II</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td className="py-1 px-2 border-b align-top">
                                                    {team1.length > 0 ? team1.map((user: Player, index: number) => (
                                                        <div key={index} className="bg-blue-900/60 rounded px-1.5 py-0.5 my-0.5 text-blue-100 text-sm flex items-center gap-1">
                                                            <span className={isMe(user) ? "font-bold" : undefined}>{user.nickname}</span>
                                                            {host && user.connectionId === host.connectionId && (
                                                                <FaCrown className="text-yellow-400 ml-1" title="Host" />
                                                            )}
                                                        </div>
                                                    )) : <span className="text-gray-400 text-sm">Brak graczy</span>}
                                                </td>
                                                <td className="py-1 px-2 border-b align-top">
                                                    {team2.length > 0 ? team2.map((user: Player, index: number) => (
                                                        <div key={index} className="bg-pink-900/60 rounded px-1.5 py-0.5 my-0.5 text-pink-100 text-sm flex items-center gap-1">
                                                            <span className={isMe(user) ? "font-bold" : undefined}>{user.nickname}</span>
                                                            {host && user.connectionId === host.connectionId && (
                                                                <FaCrown className="text-yellow-400 ml-1" title="Host" />
                                                            )}
                                                        </div>
                                                    )) : <span className="text-gray-400 text-sm">Brak graczy</span>}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="py-2 px-4 border-b">
                                                    {team1.some(u => me && u.connectionId === me.connectionId) ? (
                                                        <button
                                                            className="px-4 py-2 rounded w-full font-semibold transition-all duration-150 shadow-md flex items-center justify-center gap-2 bg-gradient-to-r from-gray-600 to-gray-800 hover:from-gray-700 hover:to-gray-900 text-white cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                                                            onClick={handleLeaveTeam}
                                                            disabled={teamCooldown}
                                                        >
                                                            <ImExit className="mr-2" /> Opuść drużynę
                                                        </button>
                                                    ) : (
                                                        <button
                                                            className={`px-4 py-2 rounded w-full font-semibold transition-all duration-150 shadow-md flex items-center justify-center gap-2 ${team1.length === 2 || teamCooldown ? 'bg-gray-500 cursor-not-allowed opacity-70' : 'bg-gradient-to-r from-blue-400 to-blue-700 hover:from-blue-500 hover:to-blue-800 text-white cursor-pointer'}`}
                                                            disabled={team1.length === 2 || teamCooldown}
                                                            onClick={() => handleJoinTeam(true)}
                                                        >
                                                            <IoMdAddCircle /> Dołącz
                                                        </button>
                                                    )}
                                                </td>
                                                <td className="py-2 px-4 border-b">
                                                    {team2.some(u => me && u.connectionId === me.connectionId) ? (
                                                        <button
                                                            className="px-4 py-2 rounded w-full font-semibold transition-all duration-150 shadow-md flex items-center justify-center gap-2 bg-gradient-to-r from-gray-600 to-gray-800 hover:from-gray-700 hover:to-gray-900 text-white cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                                                            onClick={handleLeaveTeam}
                                                            disabled={teamCooldown}
                                                        >
                                                            <ImExit className="mr-2" /> Opuść drużynę
                                                        </button>
                                                    ) : (
                                                        <button
                                                            className={`px-4 py-2 rounded w-full font-semibold transition-all duration-150 shadow-md flex items-center justify-center gap-2 ${team2.length === 2 || teamCooldown ? 'bg-gray-500 cursor-not-allowed opacity-70' : 'bg-gradient-to-r from-pink-400 to-pink-700 hover:from-pink-500 hover:to-pink-800 text-white cursor-pointer'}`}
                                                            disabled={team2.length === 2 || teamCooldown}
                                                            onClick={() => handleJoinTeam(false)}
                                                        >
                                                            <IoMdAddCircle /> Dołącz
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div className="w-full bg-gray-700 rounded-lg p-3 md:p-4 flex flex-col">
                                <h2 className="text-lg md:text-xl font-semibold mb-2 text-center">Lista graczy</h2>
                                <ul className="list-disc list-inside flex-1">
                                    {users.length > 0 ? (
                                        users.map((user: Player, index: number) => (
                                            <li key={index} className="text-lg flex items-center gap-1">
                                                <span className={isMe(user) ? "font-bold" : undefined}>{user.nickname}</span>
                                                {host && user.connectionId === host.connectionId && (
                                                    <FaCrown className="text-yellow-400 ml-1" title="Host" />
                                                )}
                                                {!(host && user.connectionId === host.connectionId) && IsHost() &&
                                                    <span className="text-red-400 font-bold text-lg cursor-pointer"
                                                        onClick={() => {
                                                            GameService.connection?.invoke("KickPlayer", gameCode, user.connectionId);
                                                        }}
                                                    >✕</span>}
                                            </li>
                                        ))
                                    ) : (
                                        <li className="text-lg text-gray-500">Brak graczy - problem z połączniem z serwerm</li>
                                    )}
                                </ul>

                                {IsHost() && (
                                    <button
                                        className={`mt-4 px-6 py-2 rounded font-bold text-lg shadow-md transition-all duration-150 
                                            flex items-center justify-center
                                            ${(team1.length != 2 || team2.length != 2) ? 'bg-gray-500 text-gray-200 cursor-not-allowed opacity-70' : 'bg-gradient-to-r from-blue-700 to-blue-900 hover:from-blue-800 hover:to-blue-950 text-white cursor-pointer'}`}
                                        onClick={onStartGame}
                                        disabled={(team1.length != 2 || team2.length != 2)}
                                        style={{ minWidth: 200 }}
                                    >
                                        Rozpocznij grę
                                    </button>
                                )} {
                                    IsHost() && (<button
                                        className={`mt-4 px-6 py-2 rounded font-bold text-lg shadow-md transition-all duration-150 
                                            flex items-center justify-center
                                            ${(team1.length == 2 && team2.length == 2) ? 'bg-gray-500 text-gray-200 cursor-not-allowed opacity-70' : 'bg-gradient-to-r from-blue-700 to-blue-900 hover:from-blue-800 hover:to-blue-950 text-white cursor-pointer'}`}
                                        onClick={() => {
                                            GameService.connection?.invoke("AddBots", gameCode);
                                        }}
                                        disabled={(team1.length == 2 && team2.length == 2)}
                                        style={{ minWidth: 200 }}
                                    >
                                        Dodaj boty</button>)
                                }
                            </div>
                        </div>
                        <div className="w-full md:w-80 flex flex-col bg-gray-800 p-3 rounded-lg  min-h-80 max-h-80">
                            <h2 className="text-2xl font-semibold mb-2">Chat</h2>
                            <div className="flex-1 overflow-y-auto mb-2">
                                {chatMessages.map((msg, index) => (
                                    <div key={index} className="mb-2">
                                        {index == 0 ?
                                            <i><strong>{msg.nickname}:</strong> {msg.message}</i> :
                                            <><strong>{msg.nickname}:</strong> {msg.message}</>
                                        }
                                    </div>
                                ))}
                            </div>
                            <form className="flex gap-2 mt-2" onSubmit={e => { e.preventDefault(); handleSendMessage(); }}>
                                <input
                                    type="text"
                                    placeholder="Wiadomość..."
                                    className="w-full p-2 border border-gray-700 rounded bg-neutral-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                                    name="chatInput"
                                    ref={chatInputRef}
                                    disabled={chatCooldown}
                                    autoComplete="off"
                                />
                                <button
                                    type="submit"
                                    className="p-2 bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 rounded text-white flex items-center justify-center transition-colors duration-150 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                                    title="Wyślij wiadomość"
                                    disabled={chatCooldown}
                                >
                                    <IoMdSend size={20} />
                                </button>
                            </form>
                            {cooldownMsg && <div className="text-xs text-yellow-300 mt-1 text-center">{cooldownMsg}</div>}
                        </div>
                    </div>
                </div>
            </div>
            <Options isOpen={showOptions} onClose={() => setShowOptions(false)} />
        </>
    );
};

export default Lobby;
