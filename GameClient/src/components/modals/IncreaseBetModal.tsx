import { FaArrowUp, FaArrowDown, FaCheck, FaHandPaper } from "react-icons/fa";

interface IncreaseBetModalProps {
    open: boolean;
    currentBet: number;
    onRaise: () => void;
    onLower: () => void;
    onPass: () => void;
    onAccept: () => void;
    disabled?: boolean;
    minBet: number;
    maxBet: number;
}

const IncreaseBetModal: React.FC<IncreaseBetModalProps> = (
    { open, currentBet, onRaise, onLower, onPass, onAccept, disabled = false, minBet, maxBet }
) => {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="bg-gradient-to-br from-slate-900  to-blue-900 rounded-2xl p-8 shadow-2xl min-w-[340px] flex flex-col items-center animate-fade-in relative">
                <h2 className="text-3xl font-bold mb-4 text-white drop-shadow">Udało Ci się wygrać licytację</h2>
                <div className="flex gap-3 mb-2">
                    <div className="mb-6 text-lg text-blue-200 flex flex-col items-center">
                        <span>Obecny zakład:</span>
                        <span className="font-extrabold text-green-600 text-4xl drop-shadow-lg mt-1">{minBet - 10}</span>
                    </div>
                    <div className="mb-3 text-lg text-blue-200 flex flex-col items-center">
                        <span>Pobij zakład do:</span>
                        <span className="font-extrabold text-yellow-300 text-4xl drop-shadow-lg mt-1">{currentBet}</span>
                        <div className="flex gap-3 mt-7 mb-2">
                            <button
                                className={`flex items-center gap-2 px-5 py-2 rounded-lg text-white font-semibold shadow-md text-lg transition-all duration-150 ${disabled || currentBet >= maxBet
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
                                className={`flex items-center gap-2 px-5 py-2 rounded-lg text-white font-semibold shadow-md text-lg transition-all duration-150 ${disabled || currentBet <= minBet
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
                    </div>
                </div>

                <div className="flex gap-3 mt-2">
                    <button
                        className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 rounded-lg text-white font-semibold shadow-md text-lg transition-all duration-150 cursor-pointer"
                        onClick={onPass}
                        disabled={disabled}
                        title="Zostań"
                    >
                        <FaHandPaper /> Zostań
                    </button>
                    <button
                        className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-yellow-500 to-yellow-700 hover:from-yellow-600 hover:to-yellow-800 rounded-lg text-white font-semibold shadow-md text-lg transition-all duration-150 cursor-pointer"
                        onClick={onAccept}
                        disabled={disabled}
                        title="Podbij"
                    >
                        <FaCheck /> Podbij
                    </button>
                </div>

            </div>
        </div>
    );
}
export default IncreaseBetModal;