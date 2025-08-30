import { Navigate, useNavigate } from "react-router-dom";
import Auth from "../services/AuthService";
import ReturnButton from "../components/ReturnButton";
import { useEffect, useState } from "react";
import { useNotification } from "../utils/NotificationContext";
import ProfileService from "../services/ProfileService";

const UserProfile = () => {
    const navigate = useNavigate();
    const { notify } = useNotification();


    if (!Auth.isAuthenticated()) {
        return <Navigate to="/" />
    }

    const [oldPassword, setOldPassword] = useState("");
    const [password, setPassword] = useState("");
    const [passwordRepeat, setPasswordRepeat] = useState("");
    const [user, setUser] = useState(Auth.getUser());

    useEffect(() => {

        if (user) {
            ProfileService.getProfile(user.id)
                .then((data) => {
                    if (data.email) {
                        // setUser(data);
                    } else {
                        throw new Error("Wystąpił błąd - nie udało się wczytać twojego adresu email");
                    }
                })
                .catch((error) => {
                    notify({ message: "Wystąpił błąd -" + error.message, type: "error" });
                })
        }
        setUser(Auth.getUser());
    }, [user]);



    const validate = (): boolean => {
        if (!password) return notify({ message: "Podaj stere", type: "error" }), false;
        if (!password) return notify({ message: "Podaj nowe hasło", type: "error" }), false;
        if (password !== passwordRepeat) return notify({ message: "Hasła nie są takie same", type: "error" }), false;
        return true;
    }

    const changePassword = () => {
        try {
            if (!user?.email)
                return notify({ message: "Wystąpił błąd - nie udało się wczytać twojego adresu email", type: "error" });
            if (validate()) {
                ProfileService.changePassword(user.email, oldPassword, password)
                    .then((data) => {
                        if (data)
                            notify({ message: "Hasło zostało zmienione", type: "success" });
                        else
                            throw new Error("Wystąpił błąd - nie udało się zmienić hasła");
                    })
                    .catch((error) => {
                        notify({ message: "Wystąpił błąd - " + error, type: "error" });
                    })

            }
        } catch (error) {
            notify({ message: "Wystąpił błąd", type: "error" });
        }
        setOldPassword("");
        setPassword("");
        setPasswordRepeat("");
    }



    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white px-6 py-10">
            <ReturnButton />

            <h1 className="text-5xl font-extrabold mb-10 text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 drop-shadow-lg">
                Panel użytkownika
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                {/* Historia gier */}
                <div className="bg-gray-900/80 backdrop-blur-md rounded-3xl shadow-2xl p-6 border border-gray-700/50 flex flex-col">
                    <h2 className="text-2xl font-bold mb-4 text-blue-400">Historia gier</h2>
                    <div className="flex-1 text-gray-400 space-y-2">
                        {/* Placeholder – tutaj dodasz listę gier */}
                        <p>Brak historii gier</p>
                    </div>
                </div>

                {/* Statystyki */}
                <div className="bg-gray-900/80 backdrop-blur-md rounded-3xl shadow-2xl p-6 border border-gray-700/50 flex flex-col">
                    <h2 className="text-2xl font-bold mb-4 text-green-400">Statystyki</h2>
                    <div className="flex-1 text-gray-400">
                        {/* Placeholder – tutaj np. wykresy, liczby */}
                        <p>Twoje statystyki pojawią się tutaj</p>
                    </div>
                </div>

                {/* Profil i zmiana hasła */}
                <div className="bg-gray-900/80 backdrop-blur-md rounded-3xl shadow-2xl p-6 border border-gray-700/50 flex flex-col">
                    <h2 className="text-2xl font-bold mb-6 text-purple-400">Profil</h2>

                    {user?.username && (
                        <p className="mb-4 text-lg">
                            Witaj, <span className="font-semibold">{user.username}</span>
                        </p>
                    )}

                    <input
                        type="text"
                        placeholder="Email"
                        className="w-full p-3 mb-3 border border-gray-700 rounded-xl bg-neutral-800 text-gray-400 text-lg"
                        value={user?.email}
                        disabled
                    />

                    <input
                        type="password"
                        placeholder="Obecne hasło"
                        className="w-full p-3 mb-3 border border-gray-700 rounded-xl bg-neutral-800 text-white focus:ring-2 focus:ring-blue-500"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                    />
                    <input
                        type="password"
                        placeholder="Nowe hasło"
                        className="w-full p-3 mb-3 border border-gray-700 rounded-xl bg-neutral-800 text-white focus:ring-2 focus:ring-blue-500"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <input
                        type="password"
                        placeholder="Powtórz nowe hasło"
                        className="w-full p-3 mb-4 border border-gray-700 rounded-xl bg-neutral-800 text-white focus:ring-2 focus:ring-blue-500"
                        value={passwordRepeat}
                        onChange={(e) => setPasswordRepeat(e.target.value)}
                    />

                    <button
                        onClick={changePassword}
                        className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 text-white rounded-xl font-bold shadow-lg hover:shadow-blue-800/40 transition-all mb-3"
                    >
                        Zmień hasło
                    </button>

                    <button
                        className="w-full py-3 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white rounded-xl font-bold shadow-lg hover:shadow-red-800/40 transition-all"
                        onClick={() => {
                            Auth.logout();
                            navigate("/");
                        }}
                    >
                        Wyloguj się
                    </button>
                </div>
            </div>
        </div>
    )
}

export default UserProfile;