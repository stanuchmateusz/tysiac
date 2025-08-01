interface DisconnectedModalProps {
    open: boolean;
    disconnectedCount: number;
    onLeave: () => void;
}

const DisconnectedModal: React.FC<DisconnectedModalProps> = ({
    open,
    disconnectedCount,
    onLeave
}) => {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 animate-fade-in">
            <div className="bg-gray-900 rounded-2xl p-8 shadow-2xl flex flex-col items-center border-4 border-red-600 min-w-[340px]">
                <h2 className="text-3xl font-bold mb-4 text-red-400 drop-shadow">Gra została spauzowana</h2>
                <div className="mb-6 text-lg text-white text-center">
                    {disconnectedCount} gracz(y) stracił(y) połączenie.<br />
                    Zaczekaj na ich powrót lub opuść stół.
                </div>
                <button
                    className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 rounded-lg text-white font-semibold shadow-md text-lg transition-all duration-150 cursor-pointer mt-2"
                    onClick={onLeave}
                >
                    Wyjdź ze stołu
                </button>
            </div>
        </div>
    );
};

export default DisconnectedModal;