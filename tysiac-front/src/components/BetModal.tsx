export default // Modal do betowania
    function BetModal({
        open,
        currentBet,
        onRaise,
        onLower,
        onPass,
        onAccept,
        disabled,
        minBet,
        maxBet,
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
    }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="bg-gradient-to-br from-blue-900 via-gray-900 to-green-900 rounded-2xl p-8 shadow-2xl min-w-[340px] flex flex-col items-center border-4 border-blue-700 animate-fade-in">
                <h2 className="text-3xl font-bold mb-4 text-white drop-shadow">Licytacja</h2>
                <div className="mb-6 text-lg text-blue-200">Wybrany zakład: <span className="font-bold text-yellow-300 text-2xl">{currentBet}</span></div>
                <div className="flex gap-4 mb-2">
                    <button
                        className={`px-5 py-2 rounded-lg text-white font-semibold shadow-md text-lg transition-all duration-150 ${disabled || currentBet >= maxBet ? 'bg-gray-500 cursor-not-allowed opacity-70' : 'bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 cursor-pointer'}`}
                        onClick={onRaise}
                        disabled={disabled || currentBet >= maxBet}
                    >
                        +10
                    </button>
                    <button
                        className={`px-5 py-2 rounded-lg text-white font-semibold shadow-md text-lg transition-all duration-150 ${disabled || currentBet <= minBet ? 'bg-gray-500 cursor-not-allowed opacity-70' : 'bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 cursor-pointer'}`}
                        onClick={onLower}
                        disabled={disabled || currentBet <= minBet}
                    >
                        -10
                    </button>
                    <button
                        className="px-5 py-2 bg-gradient-to-r from-gray-500 to-gray-700 hover:from-gray-600 hover:to-gray-800 rounded-lg text-white font-semibold shadow-md text-lg transition-all duration-150 cursor-pointer"
                        onClick={onPass}
                        disabled={disabled}
                    >
                        Pass
                    </button>
                    <button
                        className="px-5 py-2 bg-gradient-to-r from-yellow-500 to-yellow-700 hover:from-yellow-600 hover:to-yellow-800 rounded-lg text-white font-semibold shadow-md text-lg transition-all duration-150 cursor-pointer"
                        onClick={onAccept}
                        disabled={disabled}
                    >
                        Akceptuj
                    </button>
                </div>
            </div>
        </div>
    );
}