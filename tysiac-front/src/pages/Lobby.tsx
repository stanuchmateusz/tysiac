import { GrHide, GrView } from "react-icons/gr";
import { ImExit } from "react-icons/im";
import { IoMdAddCircle } from "react-icons/io";
import { IoMdSend } from "react-icons/io";
import GameService from "../services/GameService";
import { useNavigate } from "react-router-dom";
import type { ChatMessage, Player } from "./Game";


const JoinTeamHandler = (isTeam1: boolean, gameCode: string) => {
    GameService.connection?.invoke("JoinTeam", gameCode, isTeam1)
        .catch(err => {
            console.error(`Error joining team:`, err);
        });
};

const Lobby = ({
    users,
    team1,
    team2,
    chatMessages,
    showCode,
    setShowCode,
    gameCode,
    onStartGame,
}: {
    users: Player[];
    team1: Player[];
    team2: Player[];
    chatMessages: ChatMessage[];
    showCode: boolean;
    setShowCode: (v: boolean) => void;
    gameCode: string;
    onStartGame: () => void;
}) => {
    const navigate = useNavigate();
    return (
        <div className="grid grid-cols-3 gap-6 h-screen max-w-6xl mx-auto p-6 bg-neutral-900 text-white">
            {/* Chat */}
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
                        placeholder="Wiadomość..."
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
            {/* Main */}
            <div className="col-span-2 flex flex-col h-full">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-4xl font-bold">Lobby</h1>
                    <div className="flex items-center space-x-4">
                        <span className="text-md font-mono bg-gray-800 px-3 py-1 rounded select-all w-32 text-center" title="Kod do gry">
                            {showCode ? gameCode : '••••••'}
                        </span>
                        <button
                            className="px-2 py-1 bg-gradient-to-r from-gray-600 to-gray-800 text-white rounded hover:from-gray-700 hover:to-gray-900 flex items-center cursor-pointer"
                            title={showCode ? "Ukryj kod" : "Pokaż kod"}
                            onClick={() => setShowCode(!showCode)}
                        >
                            {showCode ? <GrHide /> : <GrView />}
                        </button>
                        <button
                            className="p-2 bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 rounded text-white flex items-center justify-center transition-colors duration-150 cursor-pointer"
                            title="Kopiuj kod do schowka"
                            onClick={async () => {
                                try {
                                    await navigator.clipboard.writeText(gameCode);
                                } catch (e) {
                                    console.error("Failed to copy code:", e);
                                }
                            }}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <rect x="9" y="9" width="13" height="13" rx="2" fill="#3b82f6" stroke="#fff" strokeWidth="2" />
                                <rect x="3" y="3" width="13" height="13" rx="2" stroke="#fff" strokeWidth="2" />
                            </svg>
                        </button>

                        <button
                            className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-700 text-white rounded hover:from-red-600 hover:to-red-800 flex items-center cursor-pointer"
                            title="Opuść pokój gry"
                            onClick={() => {
                                GameService.connection?.invoke("LeaveRoom", gameCode);
                                navigate("/", { replace: true });
                            }}
                        >
                            <ImExit className="mr-2" /> Wyjdź
                        </button>
                    </div>
                </div>
                <div className="flex flex-1 flex-col gap-8">
                    <div className="w-full bg-gray-700 rounded-lg p-4 flex flex-col max-h-72 overflow-y-auto mb-4">
                        <h2 className="text-xl font-semibold mb-2 text-center">Drużyny</h2>
                        <table className="w-full mb-0 border-separate border-spacing-y-1">
                            <thead>
                                <tr>
                                    <th className="py-2 px-4 border-b text-lg text-blue-300 bg-gray-800 rounded-tl-lg">Drużyna I</th>
                                    <th className="py-2 px-4 border-b text-lg text-pink-300 bg-gray-800 rounded-tr-lg">Drużyna II</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="py-1 px-2 border-b align-top">
                                        {team1.length > 0 ? team1.map((user, index) => (
                                            <div key={index} className="bg-blue-900/60 rounded px-1.5 py-0.5 my-0.5 text-blue-100 text-sm flex items-center gap-1">
                                                <span className="inline-block w-2 h-2 bg-blue-400 rounded-full"></span>
                                                {user.nickname}
                                            </div>
                                        )) : <span className="text-gray-400 text-sm">Brak graczy</span>}
                                    </td>
                                    <td className="py-1 px-2 border-b align-top">
                                        {team2.length > 0 ? team2.map((user, index) => (
                                            <div key={index} className="bg-pink-900/60 rounded px-1.5 py-0.5 my-0.5 text-pink-100 text-sm flex items-center gap-1">
                                                <span className="inline-block w-2 h-2 bg-pink-400 rounded-full"></span>
                                                {user.nickname}
                                            </div>
                                        )) : <span className="text-gray-400 text-sm">Brak graczy</span>}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="py-2 px-4 border-b">
                                        <button
                                            className={`px-4 py-2 rounded w-full font-semibold transition-all duration-150 shadow-md flex items-center justify-center gap-2 cursor-pointer ${team1.length === 2 ? 'bg-gray-500 cursor-not-allowed' : 'bg-gradient-to-r from-blue-400 to-blue-700 hover:from-blue-500 hover:to-blue-800 text-white'}`}
                                            disabled={team1.length === 2}
                                            onClick={() => JoinTeamHandler(true, gameCode)}
                                        >
                                            <IoMdAddCircle /> Dołącz
                                        </button>
                                    </td>
                                    <td className="py-2 px-4 border-b">
                                        <button
                                            className={`px-4 py-2 rounded w-full font-semibold transition-all duration-150 shadow-md flex items-center justify-center gap-2 cursor-pointer ${team2.length === 2 ? 'bg-gray-500 cursor-not-allowed' : 'bg-gradient-to-r from-pink-400 to-pink-700 hover:from-pink-500 hover:to-pink-800 text-white'}`}
                                            disabled={team2.length === 2}
                                            onClick={() => JoinTeamHandler(false, gameCode)}
                                        >
                                            <IoMdAddCircle /> Dołącz
                                        </button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div className="w-full bg-gray-700 rounded-lg p-4 flex flex-col">
                        <h2 className="text-xl font-semibold mb-2 text-center">Lista graczy</h2>
                        <ul className="list-disc list-inside flex-1">
                            {users.length > 0 ? (
                                users.map((user, index) => (
                                    <li key={index} className="text-lg">{user.nickname}</li>
                                ))
                            ) : (
                                <li className="text-lg text-gray-500">Brak graczy - problem z połączniem z serwerm</li>
                            )}
                        </ul>
                    </div>
                </div>
                <div className="flex justify-end mt-8">
                    <button
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white rounded text-lg font-semibold shadow-lg cursor-pointer"
                        disabled={team1.length < 2 || team2.length < 2}
                        onClick={onStartGame}
                    >
                        Rozpocznij grę
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Lobby;
