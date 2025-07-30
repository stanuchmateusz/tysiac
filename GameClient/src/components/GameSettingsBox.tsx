import React from "react";

type GameSettingsBoxProps = {
    settings?: {
        unlimitedWin?: boolean;
        allowRaise?: boolean;
    };
    // onChange?: (settings: { unlimitedWin: boolean; allowRaise: boolean }) => void;
};
//so i will need a GameSettingsModel that will be sent to WS when data changes  
const GameSettingsBox: React.FC<GameSettingsBoxProps> = ({
    settings = { unlimitedWin: false, allowRaise: true },
    // onChange,
}) => (
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
                            checked={settings.unlimitedWin}
                            disabled
                        />
                    </td>
                    <td className="px-4 py-2 border border-gray-700 text-xs text-gray-400">
                        Licytacja nie limituje wygranej
                    </td>
                </tr>
                <tr className="odd:bg-gray-800 even:bg-gray-700">
                    <td className="px-4 py-2 border border-gray-700">Podbijanie zakładu</td>
                    <td className="px-4 py-2 border border-gray-700 text-center">
                        <input
                            type="checkbox"
                            className="accent-blue-500 scale-125"
                            checked={settings.allowRaise}
                            disabled
                        />
                    </td>
                    <td className="px-4 py-2 border border-gray-700 text-xs text-gray-400">
                        Możliwość podbijania zakładu przez graczy
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
);

export default GameSettingsBox;