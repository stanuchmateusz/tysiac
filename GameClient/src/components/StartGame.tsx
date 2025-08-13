import { useState, useEffect } from "react";
import GameService from "../services/GameService";
import { ParseHubExcepion, MapErrorMessage } from "../utils/ErrorParser";
import { useNavigate } from "react-router-dom";
import * as signalR from "@microsoft/signalr";
import { getCookie, setCookie, userNicknameCookieName } from "../utils/Cookies";
import { useNotification } from "../utils/NotificationContext";

const StartGame = ({ code }: { code: string | undefined }) => {
    const [nickname, setNickname] = useState(getCookie(userNicknameCookieName) || "");
    const [roomCode, setRoomCode] = useState(code ?? "");
    const [isReady, setIsReady] = useState(false);
    const [connectionError, setConnectionError] = useState<string | null>(null);
    const { notify } = useNotification()

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

        GameService.connection?.on("ReconnectState", (state: any) => {
            console.log("Reconnect state code:", state)
            navigate("/game/" + state, { replace: true });
        })
        
            GameService.onLobbyCreated((roomCode: string) => {
                navigate(`/lobby/${roomCode}`);
            });

            GameService.onLobbyJoined((roomCode: string) => {
                navigate(`/lobby/${roomCode}`);
            })
        
        const ensureConnection = async () => {
            try {
                if (GameService.getConnectionState() !== window.signalR.HubConnectionState.Connected) {

                    await GameService.startConnection();
                }
                setIsReady(true);
            } catch (error) {
                console.error("Błąd podczas nawiązywania połączenia z serwerem:", error);
                setConnectionError("Błąd podczas nawiązywania połączenia z serwerem. Sprawdź połączenie internetowe i spróbuj ponownie.");
                setIsReady(false);
            }
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
                        GameService.constructor()
                        GameService.startConnection()
                            .then(() => setIsReady(true))
                            .catch(() => {
                                setConnectionError("Błąd podczas nawiązywania połączenia z serwerem. Sprawdź połączenie internetowe i spróbuj ponownie.");
                                setIsReady(false);
                            });
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
            notify({
                message: "Nieprawidłowy pseudonim. Upewnij się, że ma od 3 do 20 znaków i zawiera tylko litery, cyfry lub podkreślenia.",
                type: "error"
            });
            console.error("Nieprawidłowy pseudonim. Upewnij się, że ma od 3 do 20 znaków i zawiera tylko litery, cyfry lub podkreślenia.");
            return;
        }
        if (!isReady) {
            console.warn("Połączenie nie jest jeszcze gotowe.");
            setConnectionError("Połączenie nie jest jeszcze gotowe.")
            return;
        }
        setCookie(userNicknameCookieName, nickname, 30);
        GameService.createRoom(nickname)
            .catch(err => {
                console.error("Błąd podczas tworzenia pokoju:", err);
            });

    }

    const handleJoinGame = async () => {

        if (!validateNickname(nickname)) {
            console.error("Nieprawidłowy pseudonim. Upewnij się, że ma od 3 do 20 znaków i zawiera tylko litery, cyfry lub podkreślenia.");
            notify({
                message: "Nieprawidłowy pseudonim. Upewnij się, że ma od 3 do 20 znaków i zawiera tylko litery, cyfry lub podkreślenia.",
                type: "error"
            });
            return;
        }
        if (!validateRoomCode(roomCode)) {
            console.error("Nieprawidłowy kod pokoju. Upewnij się, że ma 8 znaków i zawiera tylko wielkie litery i cyfry.");
            notify({
                message: "Nieprawidłowy kod pokoju. Upewnij się, że ma 8 znaków i zawiera tylko wielkie litery i cyfry.",
                type: "error"
            });
            return;
        }
        if (!isReady) {
            console.warn("Połączenie nie jest jeszcze gotowe.");
            notify({
                message: "Połączenie nie jest jeszcze gotowe.",
                type: "error"
            });
            return;
        }
        setCookie(userNicknameCookieName, nickname, 30);
        GameService.joinRoom(roomCode, nickname)
            .catch((err: Error) => {
                var ex = ParseHubExcepion(err);

                console.error("Błąd podczas dołączania do pokoju:", ex);
                notify({
                    message: "Błąd podczas dołączania do pokoju. " + MapErrorMessage(ex),
                    type: "error"
                });
            });
    }
    useEffect(() => {
        if (GameService.getConnectionState() === signalR.HubConnectionState.Connected) {
            setIsReady(true);
        } else {
            setIsReady(false);
        }
    }, [GameService.getConnectionState()]);
    const validateNickname = (nickname: string) => {
        return nickname.length >= 3 &&
            nickname.length <= 25 &&
            /^[a-zA-Z0-9ąćęłńóśźżĄĆĘŁŃÓŚŹŻ _]+$/.test(nickname);
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
                            className="px-6 cursor-pointer py-2 bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 text-white rounded-lg font-semibold shadow-md transition-all duration-150"
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

                <div className={`px-4 py-2 text-xs font-semibold select-none transition-all duration-200 ${isReady && !connectionError ? 'text-gray-300' : 'text-red-200 animate-pulse'}`}>
                    {isReady && !connectionError ? 'Połączono z serwerem' : 'Brak połączenia z serwerem'}
                </div>

            </div>

        </div>
    );
}
export default StartGame;