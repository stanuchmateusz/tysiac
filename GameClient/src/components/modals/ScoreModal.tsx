import ScoreTable from "../ScoreTable";

interface ScoreModalProps {
    open: boolean;
    gameUserCtx: any;
    onClose: () => void;
}

const ScoreModal: React.FC<ScoreModalProps> = ({ open, gameUserCtx, onClose }) => {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 animate-fade-in">
            <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-8 shadow-2xl flex flex-col items-center border-4 border-blue-700 min-w-[360px] max-w-[90%]">
                <h2 className="text-3xl font-bold mb-4 text-blue-300 drop-shadow">Wyniki Rund</h2>
                <ScoreTable gameUserCtx={gameUserCtx} />
                <button
                    className="mt-6 px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-800 hover:from-gray-500 hover:to-gray-700 rounded-lg text-white font-semibold shadow-md text-lg transition-all duration-150 cursor-pointer"
                    onClick={onClose}
                >
                    Zamknij
                </button>
            </div>
        </div>
    );
};

export default ScoreModal;