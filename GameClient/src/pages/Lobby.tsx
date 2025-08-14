import { useState, useRef, useEffect } from "react";
import { GrHide, GrView } from "react-icons/gr";
import { ImExit } from "react-icons/im";
import { IoMdAddCircle } from "react-icons/io";
import { IoMdSend } from "react-icons/io";
import { FaCrown } from "react-icons/fa";
import GameService from "../services/GameService";
import { useNavigate, useParams } from "react-router-dom";
import Options from "../components/Options";
import GameSettingsBox from "../components/GameSettingsBox";
import type { ChatMessage, GameSettings, LobbyContext, Player } from "./Models";
import MusicService from "../services/MusicService";
import { setCookie, userIdCookieName } from "../utils/Cookies";
import OptionsButton from "../components/OptionButton";
import { useNotification } from "../utils/NotificationContext";





const Lobby = () => {
    const {notify} = useNotification();
    const navigate = useNavigate();
    // --- Cooldown states ---
    const [chatCooldown, setChatCooldown] = useState(false);
    const [teamCooldown, setTeamCooldown] = useState(false);

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
    const chatMessagesEndRef = useRef<HTMLDivElement>(null);
    if (!gameCode) {
        navigate("/", { replace: true });
        return;
    }

    useEffect(() => {
        if (chatMessagesEndRef.current) {
            chatMessagesEndRef.current.scrollIntoView({
                behavior: "smooth",
                block: "nearest"
            })
        }
    }, [chatMessages]);

    useEffect(() => {
        const connection = GameService.connection;

        if (!connection || connection.state === "Disconnected") {
            //Redirect to /join
            navigate("/join/" + gameCode,);
            return
        }

        // Handle lobby updates
        const handleRoomUpdate = (lobbyCtx: LobbyContext) => {
            console.debug("Lobby updated:", lobbyCtx);
            setLobbyContext(lobbyCtx);
            if (me === null) {
                console.debug("Setting me in lobby context");
                var newMe = lobbyCtx.players.find(p => p.connectionId === connection.connectionId);
                setMe(newMe ?? null);
                setCookie(userIdCookieName, newMe?.id || "", 1);
            }
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
            confirm("You got kicked")
            navigate("/", { replace: true });
        }

        if (connection.state === "Connected") //Request lobby context
        {
            connection.invoke("GetLobbyContext", gameCode)
        }

        connection.on("Kicked", handleGetKicked); //Got kicked
        connection.on("GameCreated", handleGameCreated); //Game was started
        connection.on("MessageRecieve", handleMessageReceive);//Lobby message received
        connection.on("LobbyUpdate", handleRoomUpdate);//Lobby updated

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
            notify({
                message: "Za dużo wiadomości! Odczekaj 5 sekund.",
                type: "error"
            });
            setChatCooldown(true);
            setTimeout(() => {
                setChatCooldown(false);
                setChatAttempts([]);
            }, 5000);
            return;
        }
        if (chatCooldown) return;
        const input = chatInputRef.current;
        if (input) {
            const message = input.value.trim();
            if (message && message.length > 0 && message.length <= 512) {
                GameService.connection?.invoke("SendMessage", gameCode, message);
                input.value = '';
                setChatAttempts([...recent, now]);
            } else {
                notify({
                    message: "Wiadomość musi mieć od 1 do 512 znaków.",
                    type: "error"
                });
            }
        }
    };
    const JoinTeamHandler = (isTeam1: boolean, gameCode: string) => {
    GameService.connection?.invoke("JoinTeam", gameCode, isTeam1)
        .catch(err => {
            notify({
                message: "Błąd podczas dołączania do drużyny. Spróbuj ponownie.",
                type: "error"
            });
            console.error(`Error joining team:`, err);
        });
};
    const handleJoinTeam = (isTeam1: boolean) => {
        const now = Date.now();
        const recent = teamAttempts.filter(ts => now - ts < 10000);
        if (recent.length >= 4) {
            notify({
                message: "Za dużo zmian drużyny! Odczekaj 5 sekund.",
                type: "error"
            });
            setTeamCooldown(true);
            setTimeout(() => {
                setTeamCooldown(false);
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
            notify({
                message: "Za dużo zmian drużyny! Odczekaj 5 sekund.",
                type: "error"
            });
            setTeamCooldown(true);
            setTimeout(() => {
                setTeamCooldown(false);
                setTeamAttempts([]);
            }, 5000);
            return;
        }
        if (teamCooldown) return;
        MusicService.playClick();
        GameService.connection?.invoke("LeaveTeam", gameCode);
        setTeamAttempts([...recent, now]);
    };
    const handleSettingsChange = (newSettings: GameSettings) => {
        GameService.connection?.invoke("UpdateRoomSettings", gameCode, newSettings)
            .catch(err => {
                console.error("Error updating game settings:", err);
                notify({
                    message: "Błąd podczas aktualizacji ustawień gry. Spróbuj ponownie.",
                    type: "error"
                });
            });
        console.debug("Settings changed:", newSettings);
    };

    const onStartGame = () => {
        GameService.connection?.invoke("StartRoom", gameCode);
    };

    return (
        <>
            <OptionsButton showOptions={() => setShowOptions(true)} />
            <div className="flex flex-col md:flex-row min-h-screen w-full bg-neutral-900 text-white p-2 xs:p-4 sm:p-6">
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
                            <div className="w-full bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900 rounded-lg p-3 md:p-4 flex flex-col max-h-96 overflow-y-auto mb-4">
                                <h2 className="text-lg md:text-xl font-semibold mb-3 text-center text-blue-200 tracking-wide">Drużyny</h2>
                                <div className="overflow-x-auto">
                                    <div className="flex gap-4">
                                        {/* Team 1 */}
                                        <div className="flex-1 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-950 rounded-xl p-4 shadow-lg">
                                            <h3 className="text-xl font-bold text-blue-200 mb-3 text-center">Drużyna I</h3>
                                            <div className="flex flex-col gap-2">
                                                {team1.length > 0 ? team1.map((user: Player, idx: number) => (
                                                    <div
                                                        key={idx}
                                                        className={`flex items-center gap-3 bg-blue-800/70 rounded px-3 py-2 shadow ${isMe(user) ? "border-2 border-blue-400" : "border border-blue-700"
                                                            }`}
                                                    >
                                                        <div className="w-8 h-8 rounded-full bg-blue-900 flex items-center justify-center text-base font-bold text-blue-200">
                                                            {user.nickname.slice(0, 2).toUpperCase()}
                                                        </div>
                                                        <span className={`text-base ${isMe(user) ? "font-bold text-blue-300" : "text-blue-100"}`}>
                                                            {user.nickname}
                                                        </span>
                                                        {host && user.connectionId === host.connectionId && (
                                                            <FaCrown className="text-yellow-400 ml-2" title="Host" />
                                                        )}
                                                    </div>
                                                )) : (
                                                    <div className="text-blue-300 text-sm text-center py-2">Brak graczy</div>
                                                )}
                                            </div>
                                            <div className="mt-4">
                                                {team1.some(u => me && u.connectionId === me.connectionId) ? (
                                                    <button
                                                        className="w-full px-4 py-2 rounded font-semibold shadow bg-gradient-to-r from-gray-600 to-gray-800 hover:from-gray-700 hover:to-gray-900 text-white flex items-center justify-center gap-2"
                                                        onClick={handleLeaveTeam}
                                                        disabled={teamCooldown}
                                                    >
                                                        <ImExit className="mr-2" /> Opuść drużynę
                                                    </button>
                                                ) : (
                                                    <button
                                                        className={`w-full px-4 py-2 rounded font-semibold shadow flex items-center justify-center gap-2 ${team1.length === 2 || teamCooldown
                                                                ? "bg-gray-500 cursor-not-allowed opacity-70"
                                                                : "bg-gradient-to-r from-blue-400 to-blue-700 hover:from-blue-500 hover:to-blue-800 text-white cursor-pointer"
                                                            }`}
                                                        disabled={team1.length === 2 || teamCooldown}
                                                        onClick={() => handleJoinTeam(true)}
                                                    >
                                                        <IoMdAddCircle /> Dołącz
                                                    </button>
                                                )}
                                            </div>
                                            <div className="mt-2 text-xs text-blue-300 text-center">
                                                {team1.length}/2 graczy
                                            </div>
                                        </div>
                                        {/* Team 2 */}
                                        <div className="flex-1 bg-gradient-to-br from-pink-900 via-pink-800 to-pink-950 rounded-xl p-4 shadow-lg">
                                            <h3 className="text-xl font-bold text-pink-200 mb-3 text-center">Drużyna II</h3>
                                            <div className="flex flex-col gap-2">
                                                {team2.length > 0 ? team2.map((user: Player, idx: number) => (
                                                    <div
                                                        key={idx}
                                                        className={`flex items-center gap-3 bg-pink-800/70 rounded px-3 py-2 shadow ${isMe(user) ? "border-2 border-pink-400" : "border border-pink-700"
                                                            }`}
                                                    >
                                                        <div className="w-8 h-8 rounded-full bg-pink-900 flex items-center justify-center text-base font-bold text-pink-100">
                                                            {user.nickname.slice(0, 2).toUpperCase()}
                                                        </div>
                                                        <span className={`text-base ${isMe(user) ? "font-bold text-pink-300" : "text-pink-100"}`}>
                                                            {user.nickname}
                                                        </span>
                                                        {host && user.connectionId === host.connectionId && (
                                                            <FaCrown className="text-yellow-400 ml-2" title="Host" />
                                                        )}
                                                    </div>
                                                )) : (
                                                    <div className="text-pink-300 text-sm text-center py-2">Brak graczy</div>
                                                )}
                                            </div>
                                            <div className="mt-4">
                                                {team2.some(u => me && u.connectionId === me.connectionId) ? (
                                                    <button
                                                        className="w-full px-4 py-2 rounded font-semibold shadow bg-gradient-to-r from-gray-600 to-gray-800 hover:from-gray-700 hover:to-gray-900 text-white flex items-center justify-center gap-2"
                                                        onClick={handleLeaveTeam}
                                                        disabled={teamCooldown}
                                                    >
                                                        <ImExit className="mr-2" /> Opuść drużynę
                                                    </button>
                                                ) : (
                                                    <button
                                                        className={`w-full px-4 py-2 rounded font-semibold shadow flex items-center justify-center gap-2 ${team2.length === 2 || teamCooldown
                                                                ? "bg-gray-500 cursor-not-allowed opacity-70"
                                                                : "bg-gradient-to-r from-pink-400 to-pink-700 hover:from-pink-500 hover:to-pink-800 text-white cursor-pointer"
                                                            }`}
                                                        disabled={team2.length === 2 || teamCooldown}
                                                        onClick={() => handleJoinTeam(false)}
                                                    >
                                                        <IoMdAddCircle /> Dołącz
                                                    </button>
                                                )}
                                            </div>
                                            <div className="mt-2 text-xs text-pink-300 text-center">
                                                {team2.length}/2 graczy
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="w-full bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900 rounded-lg p-3 md:p-4 flex flex-col">
                                <h2 className="text-lg md:text-xl font-semibold mb-3 text-center text-blue-200 tracking-wide">Lista graczy</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {users.length > 0 ? (
                                        users.map((user: Player, index: number) => (
                                            <div
                                                key={index}
                                                className={`flex items-center gap-3 bg-gray-700 rounded-lg px-4 py-2 shadow transition-all ${isMe(user) ? "border-2 border-blue-400" : "border border-gray-600"
                                                    }`}
                                            >
                                                {/* Avatar circle with initials */}
                                                <div className="w-10 h-10 rounded-full bg-blue-900 flex items-center justify-center text-lg font-bold text-blue-200">
                                                    {user.nickname.slice(0, 2).toUpperCase()}
                                                </div>
                                                <div className="flex-1">
                                                    <span className={`text-lg ${isMe(user) ? "font-bold text-blue-300" : "text-white"}`}>
                                                        {user.nickname}
                                                    </span>
                                                    {host && user.connectionId === host.connectionId && (
                                                        <FaCrown className="text-yellow-400 ml-2 inline" title="Host" />
                                                    )}
                                                </div>
                                                {!(host && user.connectionId === host.connectionId) && IsHost() && (
                                                    <span
                                                        className="text-red-400 font-bold text-lg cursor-pointer ml-2"
                                                        onClick={() => {
                                                            GameService.connection?.invoke("KickPlayer", gameCode, user.connectionId);
                                                        }}
                                                    >
                                                        ✕
                                                    </span>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-lg text-gray-500 col-span-2">Brak graczy - problem z połączniem z serwerm</div>
                                    )}
                                </div>

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
                            <GameSettingsBox isHost={IsHost()} onChange={handleSettingsChange} settings={lobbyContext?.gameSettings} />

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
                                <div ref={chatMessagesEndRef} />
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
                    
                        </div>
                    </div>
                </div>
            </div>
            <Options isOpen={showOptions} onClose={() => setShowOptions(false)} />
        </>
    );
};

export default Lobby;
