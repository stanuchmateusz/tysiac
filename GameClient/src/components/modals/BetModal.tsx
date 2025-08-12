import { FaArrowUp, FaArrowDown, FaCheck, FaTimes, FaHandPaper } from "react-icons/fa";

export default function BetModal({
    open,
    currentBet,
    onRaise,
    onLower,
    onPass,
    onAccept,
    disabled,
    minBet,
    maxBet,
    onClose, // optional: add if you want a close button
}: {
    open: boolean,
    currentBet: number,
    onRaise: () => void,
    onLower: () => void,
    onPass: () => void,
    onAccept: () => void,
    disabled?: boolean,
    minBet: number,
    maxBet: number,
    onClose?: () => void,
}) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70">
            <div className="bg-gradient-to-br from-slate-900  to-blue-900 rounded-2xl p-8 shadow-2xl min-w-[340px] flex flex-col items-center animate-fade-in relative">
                {onClose && (
                    <button
                        className="absolute top-3 right-3 text-gray-300 hover:text-red-400 text-xl"
                        onClick={onClose}
                        aria-label="Zamknij"
                    >
                        <FaTimes />
                    </button>
                )}
                <h2 className="text-3xl font-bold mb-4 text-white drop-shadow">Licytacja</h2>
                <div className="mb-6 text-lg text-blue-200 flex flex-col items-center">
                    <span>Wybrany zakład:</span>
                    <span className="font-extrabold text-yellow-300 text-4xl drop-shadow-lg mt-1">{currentBet}</span>
                </div>
                <div className="flex gap-3 mb-2">
                    <button
                        className={`flex items-center gap-2 px-5 py-2 rounded-lg text-white font-semibold shadow-md text-lg transition-all duration-150 ${
                            disabled || currentBet >= maxBet
                                ? 'bg-gray-500 cursor-not-allowed opacity-70'
                                : 'bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 cursor-pointer'
                        }`}
                        onClick={onRaise}
                        disabled={disabled || currentBet >= maxBet}
                        title="Podbij zakład"
                    >
                        <FaArrowUp /> +10
                    </button>
                    <button
                        className={`flex items-center gap-2 px-5 py-2 rounded-lg text-white font-semibold shadow-md text-lg transition-all duration-150 ${
                            disabled || currentBet <= minBet
                                ? 'bg-gray-500 cursor-not-allowed opacity-70'
                                : 'bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 cursor-pointer'
                        }`}
                        onClick={onLower}
                        disabled={disabled || currentBet <= minBet}
                        title="Obniż zakład"
                    >
                        <FaArrowDown /> -10
                    </button>
                </div>
                <div className="flex gap-3 mt-2">
                    <button
                        className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-gray-500 to-gray-700 hover:from-gray-600 hover:to-gray-800 rounded-lg text-white font-semibold shadow-md text-lg transition-all duration-150 cursor-pointer"
                        onClick={onPass}
                        disabled={disabled}
                        title="Pasuj"
                    >
                        <FaHandPaper /> Pass
                    </button>
                    <button
                        className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-yellow-500 to-yellow-700 hover:from-yellow-600 hover:to-yellow-800 rounded-lg text-white font-semibold shadow-md text-lg transition-all duration-150 cursor-pointer"
                        onClick={onAccept}
                        disabled={disabled}
                        title="Akceptuj zakład"
                    >
                        <FaCheck /> Akceptuj
                    </button>
                </div>
                <div className="mt-4 text-xs text-gray-400">
                    Minimalny zakład: <span className="font-bold">{minBet}</span> | Maksymalny zakład: <span className="font-bold">{maxBet}</span>
                </div>
            </div>
        </div>
    );
}