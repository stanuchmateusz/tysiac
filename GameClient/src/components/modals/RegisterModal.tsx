import { FaTimes } from "react-icons/fa";
import AuthService from "../../services/AuthService";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { useNotification } from "../../utils/NotificationContext";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function RegisterModal({ open, onClose, loginCallback }: { open: boolean; onClose: () => void; loginCallback: () => void; }) {
    const navigate = useNavigate();
    const { notify } = useNotification();
    const [email, setEmail] = useState("");
    const [login, setLogin] = useState("");
    const [password, setPassword] = useState("");
    const [passwordRepeat, setPasswordRepeat] = useState("");
    const [tos, setTos] = useState(false);
    const [loading, setLoading] = useState(false);

    const validate = (): boolean => {
        if (!email) return notify({ message: "Niepoprawny email", type: "error" }), false;
        if (!login) return notify({ message: "Niepoprawny login", type: "error" }), false;
        if (!password) return notify({ message: "Niepoprawne hasło", type: "error" }), false;
        if (password !== passwordRepeat) return notify({ message: "Hasła nie są takie same", type: "error" }), false;
        if (!tos) return notify({ message: "Akceptuj warunki użytkowania", type: "error" }), false;
        return true;
    }

    const handleRegister = async () => {
        if (!validate()) return;
        try {
            setLoading(true);
            await AuthService.register(email, login, password);
            notify({ message: "Konto utworzone, możesz się zalogować", type: "success" });
            onClose();
        } catch {
            notify({ message: "Wystąpił błąd", type: "error" });
        } finally {
            setLoading(false);
        }
    }

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
    }

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
            <div className="flex flex-col gap-5 w-full max-w-md bg-gray-900/70 backdrop-blur-md px-8 py-8 rounded-2xl shadow-2xl relative animate-fade-in">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-red-400">
                    <FaTimes size={20} />
                </button>

                <h2 className="text-3xl font-bold text-white mb-4 text-center">Rejestracja</h2>

                <div className="flex flex-col gap-4">
                    <GoogleLogin
                        onSuccess={handleGoogleLogin}
                        onError={() => notify({ message: "Błąd logowania Google", type: "error" })}
                    />
                    <input
                        type="email"
                        placeholder="Email"
                        className="p-3 border border-gray-700 rounded-xl bg-neutral-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg w-full"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                    />
                    <input
                        type="text"
                        placeholder="Login"
                        className="p-3 border border-gray-700 rounded-xl bg-neutral-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg w-full"
                        value={login}
                        onChange={e => setLogin(e.target.value)}
                    />
                    <input
                        type="password"
                        placeholder="Hasło"
                        className="p-3 border border-gray-700 rounded-xl bg-neutral-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg w-full"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                    />
                    <input
                        type="password"
                        placeholder="Powtórz hasło"
                        className="p-3 border border-gray-700 rounded-xl bg-neutral-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg w-full"
                        value={passwordRepeat}
                        onChange={e => setPasswordRepeat(e.target.value)}
                    />

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={tos}
                            onChange={e => setTos(e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 rounded bg-neutral-800"
                        />
                        <label className="text-sm text-gray-300">
                            Akceptuję <a href="/tos" className="font-semibold text-blue-400 hover:underline">warunki użytkowania</a>
                        </label>
                    </div>

                    <button
                        onClick={handleRegister}
                        disabled={loading}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 text-white rounded-xl font-bold shadow-lg hover:shadow-blue-800/40 transition-all w-full"
                    >
                        {loading ? "Ładowanie..." : "Zarejestruj się"}
                    </button>
                </div>

                <div className="mt-4 text-sm text-gray-400 text-center">
                    Masz już konto?{" "}
                    <button onClick={() => { onClose(); loginCallback(); }} className="font-semibold text-blue-400 hover:underline">
                        Zaloguj się
                    </button>
                </div>
            </div>
        </div>
    );
}
