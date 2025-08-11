import React, { useEffect, useState } from "react";
import type { GameSettings } from "../pages/Models";


type GameSettingsBoxProps = {
    settings?: GameSettings;
    isHost?: boolean;
    onChange: (settings: GameSettings) => void;
};

const GameSettingsBox: React.FC<GameSettingsBoxProps> = ({ settings, isHost = false, onChange
}) => { 

    if (!settings) return null;
    useEffect(() => {
        setUnlimitedWin(settings.unlimitedWin);
        setAllowRaise(settings.allowRaise);
        setChangesSaved(true);
    }, [settings]);

    const [unlimitedWin, setUnlimitedWin] = useState(settings.unlimitedWin);
    const [allowRaise, setAllowRaise] = useState(settings.allowRaise);
    const [changesSaved, setChangesSaved] = useState(true);

    return (
    <div className="w-full bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900 rounded-xl p-4 flex flex-col shadow-lg border border-blue-900">
        <h2 className="text-lg md:text-xl font-semibold mb-3 text-center text-blue-200 tracking-wide">Ustawienia gry</h2>
        <table className="w-full text-white text-sm border border-gray-700 rounded-lg overflow-hidden">
            <thead>
                <tr className="bg-blue-800 text-white">
                    <th className="px-4 py-2 border border-gray-700 text-left">Opcja</th>
                    <th className="px-4 py-2 border border-gray-700 text-center">Włączone</th>
                    <th className="px-4 py-2 border border-gray-700 text-left">Opis</th>
                </tr>
            </thead>
            <tbody>
                <tr className="odd:bg-gray-800 even:bg-gray-700">
                    <td className="px-4 py-2 border border-gray-700">Granie <b>"ile ugrasz"</b></td>
                    <td className="px-4 py-2 border border-gray-700 text-center">
                        <input
                            type="checkbox"
                            className="accent-blue-500 scale-125"
                            checked={unlimitedWin}
                            onChange={(e) => {
                                setUnlimitedWin(e.target.checked);
                                setChangesSaved(false);
                                if (e.target.checked && allowRaise) {
                                    setAllowRaise(false); // Disable allowRaise if unlimitedWin is enabled
                                }
                            }}
                            disabled={!isHost}
                        />
                    </td>
                    <td className="px-4 py-2 border border-gray-700 text-xs text-gray-400">
                        Licytacja nie limituje punktów pod wgranej
                    </td>
                </tr>
                <tr className="odd:bg-gray-800 even:bg-gray-700">
                    <td className="px-4 py-2 border border-gray-700">Podbijanie zakładu</td>
                    <td className="px-4 py-2 border border-gray-700 text-center">
                        <input
                            type="checkbox"
                            className="accent-blue-500 scale-125"
                            checked={allowRaise}
                            onChange={(e) => {
                                setAllowRaise(e.target.checked);
                                if (unlimitedWin && e.target.checked)
                                    setUnlimitedWin(false); // Disable unlimited win if allowRaise is enabled
                                setChangesSaved(false);
                            }}
                            disabled={!isHost} 
                        />
                    </td>
                    <td className="px-4 py-2 border border-gray-700 text-xs text-gray-400">
                        Możliwość podbijania zakładu przez graczy
                    </td>
                </tr>
            </tbody>
        </table>
        { isHost && <div className="mt-4 flex justify-end">
            <button
                className={`px-4 py-2 cursor-${changesSaved? "not-allowed bg-green-600 disabled " :"pointer bg-blue-600 hover:bg-blue-700" } text-white rounded-lg transition-colors duration-200`}
                onClick={() => {
                    onChange({ unlimitedWin, allowRaise });
                    setChangesSaved(true);        
                }}
                disabled={changesSaved}
            >
                {changesSaved ? "Zapisano": "Zapisz zmiany"}
            </button>
        </div>
}
    </div>
)};

export default GameSettingsBox;