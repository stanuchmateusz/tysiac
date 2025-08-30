import { useEffect, useState } from "react";
import StartGame from "../components/StartGame";
import Options from "../components/Options";
import OptionsButton from "../components/OptionButton";
import { useNavigate, useParams } from "react-router-dom";
import MusicService from "../services/MusicService";
import LoginModal from "../components/modals/LoginModal";
import RegisterModal from "../components/modals/RegisterModal";
import AuthService from "../services/AuthService";


export default function Home() {
    const [showOptions, setShowOptions] = useState(false);
    const { joinCode } = useParams<{ joinCode: string }>();
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showRegisterModal, setShowRegisterModal] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        MusicService.playBackgroundMusic();
        return () => {
            MusicService.stopBackgroundMusic();
        };
    }, []);

    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white px-4">
            <OptionsButton showOptions={() => setShowOptions(true)} />

            <LoginModal
                open={showLoginModal}
                onClose={() => setShowLoginModal(false)}
                registerCallBack={() => setShowRegisterModal(true)}
            />
            <RegisterModal
                open={showRegisterModal}
                onClose={() => setShowRegisterModal(false)}
                loginCallback={() => setShowLoginModal(true)}
            />

            <div className="bg-gray-900/80 backdrop-blur-md rounded-3xl shadow-2xl px-8 py-10 flex flex-col items-center w-full max-w-xl relative border border-gray-700/50">
                <h1 className="p-3 text-5xl sm:text-6xl font-extrabold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 drop-shadow-xl animate-pulse text-center">
                    Tysiąc siadany
                </h1>
                <p className="text-lg text-gray-300 mb-10 text-center leading-relaxed">
                    Gra karciana dla 4 graczy, podzielonych na dwie drużyny.<br />
                    Celem jest zdobycie <span className="font-bold text-blue-400">1000 punktów</span> przez jedną z drużyn.
                </p>

                <div className="flex flex-col gap-4 w-full max-w-md">
                    {!AuthService.isAuthenticated() ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <button
                                onClick={() => setShowLoginModal(true)}
                                className="bg-gradient-to-r from-blue-600 to-blue-800 p-3 rounded-xl font-bold hover:from-blue-500 hover:to-blue-700 shadow-lg hover:shadow-blue-800/40 transition-all w-full"
                            >
                                Zaloguj się
                            </button>
                            <button
                                onClick={() => setShowRegisterModal(true)}
                                className="bg-gradient-to-r from-gray-700 to-gray-900 p-3 rounded-xl font-bold hover:from-gray-600 hover:to-gray-800 shadow-lg hover:shadow-gray-700/40 transition-all w-full"
                            >
                                Zarejestruj się
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-4">
                            <span className="text-lg font-semibold">Witaj, {AuthService.getUsername()}!</span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <button
                                    onClick={() => { navigate("/profile"); }}
                                    className="bg-gradient-to-r from-blue-600 to-blue-900 p-3 rounded-xl font-bold hover:from-blue-500 hover:to-blue-800 shadow-lg hover:shadow-blue-800/40 transition-all w-full"
                                >
                                    Przejdź do profilu
                                </button>
                                <button
                                    onClick={() => { AuthService.logout(); navigate("/"); }}
                                    className="bg-gradient-to-r from-red-600 to-red-900 p-3 rounded-xl font-bold hover:from-red-500 hover:to-red-800 shadow-lg hover:shadow-red-800/40 transition-all w-full"
                                >
                                    Wyloguj się
                                </button>
                                {AuthService.isAdmin() && <button
                                    className="bg-gradient-to-r from-green-600 to-green-900 p-3 rounded-xl font-bold hover:from-green-500 hover:to-green-800 shadow-lg hover:shadow-green-800/40 transition-all w-full"
                                    onClick={() => { navigate('/admin') }}
                                >
                                    Admin panel
                                </button>}
                            </div>

                        </div>
                    )}
                </div>

                <div className="mt-8 w-full">
                    <StartGame code={joinCode} />
                </div>

                <p className="text-sm text-gray-400 mt-8 text-center">
                    <button
                        onClick={() => navigate("/rules")}
                        className="text-blue-400 hover:text-blue-300 hover:underline transition-colors duration-150"
                    >
                        Zasady gry
                    </button>
                </p>
            </div>

            <Options isOpen={showOptions} onClose={() => setShowOptions(false)} />
        </div>

    );
}
