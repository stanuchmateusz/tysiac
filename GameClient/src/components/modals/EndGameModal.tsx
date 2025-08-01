import ScoreTable from "../ScoreTable";

interface EndGameModalProps {
    open: boolean;
    gameUserCtx: any;
    onLeave: () => void;
}

const EndGameModal: React.FC<EndGameModalProps> = ({ open, gameUserCtx, onLeave }) => {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 animate-fade-in">
            <div className="bg-gradient-to-br from-blue-900 via-gray-800 to-green-900 rounded-2xl p-8 shadow-2xl flex flex-col items-center border-4 border-blue-700 min-w-[340px]">
                <h2 className="text-3xl font-bold mb-4 text-white drop-shadow">Koniec Gry!</h2>
                <div className="mb-6 text-lg text-blue-200 text-center">
                    <p>Ostateczny wynik:</p>
                    <p><span className="font-bold text-yellow-300">Twoja drużyna:</span> {gameUserCtx?.myTeamScore[0] ?? 0}</p>
                    <p><span className="font-bold text-pink-300">Przeciwnicy:</span> {gameUserCtx?.opponentScore[0] ?? 0}</p>
                    {gameUserCtx && gameUserCtx.myTeamScore[0] > gameUserCtx.opponentScore[0] ? (
                        <p className="text-green-400 font-bold mt-2">Gratulacje, wygraliście!</p>
                    ) : gameUserCtx && gameUserCtx.myTeamScore[0] < gameUserCtx.opponentScore[0] ? (
                        <p className="text-red-400 font-bold mt-2">Niestety, tym razem się nie udało.</p>
                    ) : <p className="text-gray-300 font-bold mt-2">Remis!</p>}
                </div>
                <ScoreTable gameUserCtx={gameUserCtx} />
                <button
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 rounded-lg text-white font-semibold shadow-md text-lg transition-all duration-150 cursor-pointer mt-2"
                    onClick={onLeave}
                >
                    Wyjdź z gry
                </button>
            </div>
        </div>
    );
};

export default EndGameModal;