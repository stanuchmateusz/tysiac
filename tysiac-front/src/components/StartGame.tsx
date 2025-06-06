import { useState, useEffect } from "react";
import GameService from "../services/GameService";
import { useNavigate } from "react-router-dom";
import * as signalR from "@microsoft/signalr";

const StartGame = () => {
    const [nickname, setNickname] = useState("");
    const [roomCode, setRoomCode] = useState("");
    const [roomError, setRoomError] = useState("");
    const [isReady, setIsReady] = useState(false);
    const [connectionError, setConnectionError] = useState<string | null>(null);

    const navigate = useNavigate();

    useEffect(() => {
        if (!GameService.connection || GameService.connection.state === signalR.HubConnectionState.Disconnected) {
            GameService.constructor()
            GameService.startConnection()
                .then(() => setIsReady(true))
                .catch(() => {
                    setConnectionError("Błąd podczas nawiązywania połączenia z serwerem. Sprawdź połączenie internetowe i spróbuj ponownie.");
                    setIsReady(false);
                });
        }

        GameService.onRoomCreated((roomCode: string) => {
            navigate(`/game/${roomCode}`);
        });
        GameService.onRoomJoined((roomCode: string) => {
            navigate(`/game/${roomCode}`);
        });

        const ensureConnection = async () => {
            if (GameService.getConnectionState() !== window.signalR.HubConnectionState.Connected) {
                await GameService.startConnection();
            }
            setIsReady(true);
        };

        if (window.signalR && window.signalR.HubConnectionState) {
            ensureConnection();
        } else {

            if (GameService.getConnectionState() !== 'Connected') {
                GameService.startConnection()
                    .then(() => setIsReady(true))
                    .catch(() => {
                        setConnectionError("Błąd podczas nawiązywania połączenia z serwerem. Sprawdź połączenie internetowe i spróbuj ponownie.");
                        setIsReady(false);
                    }
                    );
            } else {
                setIsReady(true);
            }
        }
        return () => {
            GameService.offRoomCreated();
            GameService.offRoomJoined();
        };
    }, [navigate]);

    const handleHostGame = async () => {

        if (!validateNickname(nickname)) {
            console.error("Nieprawidłowy pseudonim. Upewnij się, że ma od 3 do 20 znaków i zawiera tylko litery, cyfry lub podkreślenia.");
            return;
        }
        if (!isReady) {
            console.warn("Połączenie nie jest jeszcze gotowe.");
            return;
        }
        GameService.createRoom(nickname)
            .catch(err => {
                console.error("Błąd podczas tworzenia pokoju:", err);
            });

    }

    const handleJoinGame = async () => {

        if (!validateNickname(nickname)) {
            console.error("Nieprawidłowy pseudonim. Upewnij się, że ma od 3 do 20 znaków i zawiera tylko litery, cyfry lub podkreślenia.");
            setRoomError("Nieprawidłowy pseudonim. Upewnij się, że ma od 3 do 20 znaków i zawiera tylko litery, cyfry lub podkreślenia.");
            return;
        }
        if (!validateRoomCode(roomCode)) {
            console.error("Nieprawidłowy kod pokoju. Upewnij się, że ma 8 znaków i zawiera tylko wielkie litery i cyfry.");
            setRoomError("Nieprawidłowy kod pokoju. Upewnij się, że ma 8 znaków i zawiera tylko wielkie litery i cyfry.");
            return;
        }
        if (!isReady) {
            console.warn("Połączenie nie jest jeszcze gotowe.");
            setRoomError("Połączenie nie jest jeszcze gotowe.");
            return;
        }
        GameService.joinRoom(roomCode, nickname)
            .catch(err => {
                console.error("Błąd podczas dołączania do pokoju:", err);
                setRoomError("Błąd podczas dołączania do pokoju. Upewnij się, że kod pokoju jest poprawny.");
            });
    }

    const validateNickname = (nickname: string) => {
        return nickname.length >= 3 && nickname.length <= 20 && /^[a-zA-Z0-9_]+$/.test(nickname);
    }
    const validateRoomCode = (roomCode: string) => {
        return roomCode.length === 8 && /^[A-Z0-9]{8}$/.test(roomCode);
    }

    return (
        <div className="flex flex-col items-center justify-center w-full gap-4">
            {connectionError && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                    <div className="bg-white rounded-2xl shadow-2xl px-8 py-10 flex flex-col items-center max-w-sm w-full border border-red-300 animate-fade-in">
                        <div className="mb-4 text-red-500">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-gray-800 mb-2">Błąd połączenia</h2>
                        <p className="text-gray-600 mb-6 text-center">{connectionError}</p>
                        <button
                            className="px-6 py-2 bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 text-white rounded-lg font-semibold shadow-md transition-all duration-150"
                            onClick={() => window.location.reload()}
                        >
                            Spróbuj ponownie
                        </button>
                    </div>
                </div>
            )}
            <div className="flex flex-col gap-4 w-full max-w-md  px-8 py-8">
                <input
                    type="text"
                    name="nickname"
                    maxLength={20}
                    pattern="[a-zA-Z0-9_]{3,20}"
                    required
                    placeholder="Twój pseudonim..."
                    className="p-3 border border-gray-700 rounded-lg bg-neutral-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg w-full"
                    value={nickname}
                    onChange={e => setNickname(e.target.value)}
                />
                <button
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white rounded-lg font-semibold shadow-md transition-all duration-150 cursor-pointer text-lg w-full"
                    onClick={handleHostGame}
                >
                    Zostań gospodarzem
                </button>
                <div className="flex flex-col sm:flex-row gap-3 w-full">
                    <input
                        type="password"
                        maxLength={8}
                        pattern="[A-Z0-9]{8}"
                        placeholder="Kod pokoju..."
                        className="flex-1 p-3 border border-gray-700 rounded-lg bg-neutral-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg min-w-0"
                        value={roomCode}
                        onChange={e => setRoomCode(e.target.value)}
                    />
                    <button
                        className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white rounded-lg font-semibold shadow-md transition-all duration-150 cursor-pointer text-lg w-full sm:w-auto"
                        onClick={handleJoinGame}
                    >
                        Dołącz do gry
                    </button>
                </div>
                {roomError && (
                    <div className="mt-2 text-red-500 text-sm">
                        {roomError}
                    </div>
                )}
                <div className={`px-4 py-2 text-xs font-semibold select-none transition-all duration-200 ${isReady && !connectionError ? 'text-gray-300' : 'text-red-200 animate-pulse'}`}>
                    {isReady && !connectionError ? 'Połączono z serwerem' : 'Brak połączenia z serwerem'}
                </div>

            </div>

        </div>
    );
}
export default StartGame;