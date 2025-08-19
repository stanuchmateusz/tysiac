import React, { useEffect, useState } from "react";
import type { GameSettings } from "../pages/Models";
import { FaInfinity, FaArrowUp } from "react-icons/fa";
import MusicService from "../services/MusicService";

type GameSettingsBoxProps = {
    settings: GameSettings;
    isHost?: boolean;
    onChange: (settings: GameSettings) => void;
};

const GameSettingsBox: React.FC<GameSettingsBoxProps> = ({ settings, isHost = false, onChange }) => { 
    
    useEffect(() => {
        setUnlimitedWin(settings.unlimitedWin);
        setAllowRaise(settings.allowRaise);
        setChangesSaved(true);
    }, [settings]);
    
    const [unlimitedWin, setUnlimitedWin] = useState(settings.unlimitedWin);
    const [allowRaise, setAllowRaise] = useState(settings.allowRaise);
    const [changesSaved, setChangesSaved] = useState(true);

    return (
    <div className="w-full bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900 rounded-xl p-6 flex flex-col shadow-2xl">
        <h2 className="text-2xl font-bold mb-5 text-center text-blue-300 tracking-wide drop-shadow">Ustawienia gry</h2>
        <div className="flex flex-col gap-4">
            {/* Unlimited Win Option */}
            <div className="flex items-center gap-4 bg-gray-800 rounded-lg p-4 shadow">
                <FaInfinity className="text-blue-400 text-2xl" />
                <div className="flex-1">
                    <div className="font-semibold text-blue-200">Granie "ile ugrasz"</div>
                    <div className="text-xs text-gray-400">Licytacja nie limituje punktów pod wgranej</div>
                </div>
                <input
                    type="checkbox"
                    className="accent-blue-500 scale-125"
                    checked={unlimitedWin}
                    onChange={(e) => {
                        setUnlimitedWin(e.target.checked);
                        setChangesSaved(false);
                        MusicService.playClick();
                        if (e.target.checked && allowRaise) {
                            setAllowRaise(false);
                        }
                    }}
                    disabled={!isHost}
                />
            </div>
            {/* Allow Raise Option */}
            <div className="flex items-center gap-4 bg-gray-800 rounded-lg p-4 shadow">
                <FaArrowUp className="text-green-400 text-2xl" />
                <div className="flex-1">
                    <div className="font-semibold text-green-200">Podbijanie zakładu</div>
                    <div className="text-xs text-gray-400">Możliwość podbijania zakładu przez graczy</div>
                </div>
                <input
                    type="checkbox"
                    className="accent-green-500 scale-125"
                    checked={allowRaise}
                    onChange={(e) => {
                        setAllowRaise(e.target.checked);
                        MusicService.playClick();
                        if (unlimitedWin && e.target.checked)
                            setUnlimitedWin(false);
                        setChangesSaved(false);
                    }}
                    disabled={!isHost}
                />
            </div>
        </div>
        {isHost && (
            <div className="mt-6 flex justify-end">
                <button
                    className={`px-6 py-2 font-semibold rounded-lg shadow transition-all duration-200 ${
                        changesSaved
                            ? "bg-green-600 text-white cursor-not-allowed opacity-70"
                            : "cursor-pointer bg-blue-600 hover:bg-blue-700 text-white animate-pulse"
                    }`}
                    onClick={() => {
                        onChange({ unlimitedWin, allowRaise });
                        setChangesSaved(true);
                        MusicService.playClick();        
                    }}
                    disabled={changesSaved}
                >
                    {changesSaved ? "Zapisano" : "Zapisz zmiany"}
                </button>
            </div>
        )}
    </div>
    );
};

export default GameSettingsBox;