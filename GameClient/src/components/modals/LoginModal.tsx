import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { FaTimes } from "react-icons/fa";
import AuthService from "../../services/AuthService";
import { useNotification } from "../../utils/NotificationContext";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LoginModal({ open, onClose, registerCallBack }: { open: boolean; onClose: () => void; registerCallBack: () => void; }) {
    const navigate = useNavigate();
    const { notify } = useNotification();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) return notify({ message: "Wypełnij wszystkie pola", type: "error" });
        try {
            setLoading(true);
            const res = await AuthService.login(email, password, rememberMe);
            if (res) {
                notify({ message: "Zalogowano", type: "success" });
                onClose();
                navigate("/");
            } else {
                notify({ message: "Błędny login lub hasło", type: "error" });
            }
        } catch {
            notify({ message: "Błąd logowania", type: "error" });
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async (credential: CredentialResponse) => {
        if (!credential.credential) return;
        try {
            setLoading(true);
            await AuthService.loginGoogle(credential);
            notify({ message: "Zalogowano przez Google", type: "success" });
            onClose();
            navigate("/");
        } catch {
            notify({ message: "Błąd logowania Google", type: "error" });
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
            <div className="flex flex-col gap-5 w-full max-w-md bg-gray-900/70 backdrop-blur-md px-8 py-8 rounded-2xl shadow-2xl relative animate-fade-in">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-red-400">
                    <FaTimes size={20} />
                </button>

                <h2 className="text-3xl font-bold text-white mb-4 text-center">Logowanie</h2>

                <div className="flex flex-col gap-4">
                    <GoogleLogin
                        onSuccess={handleGoogleLogin}
                        onError={() => notify({ message: "Błąd logowania Google", type: "error" })}
                    />

                    <input
                        type="text"
                        placeholder="Email"
                        className="p-3 border border-gray-700 rounded-xl bg-neutral-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg w-full"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                    />
                    <input
                        type="password"
                        placeholder="Hasło"
                        className="p-3 border border-gray-700 rounded-xl bg-neutral-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg w-full"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                    />

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={e => setRememberMe(e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 rounded bg-neutral-800"
                        />
                        <label className="text-sm text-gray-300">Zapamiętaj mnie</label>
                    </div>

                    <button
                        onClick={handleLogin}
                        disabled={loading}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 text-white rounded-xl font-bold shadow-lg hover:shadow-blue-800/40 transition-all w-full"
                    >
                        {loading ? "Ładowanie..." : "Zaloguj się"}
                    </button>
                </div>

                <div className="mt-4 text-sm text-gray-400 text-center">
                    Nie masz konta?{" "}
                    <button onClick={() => { onClose(); registerCallBack(); }} className="font-semibold text-blue-400 hover:underline">
                        Zarejestruj się
                    </button>
                </div>
            </div>
        </div>
    );
}