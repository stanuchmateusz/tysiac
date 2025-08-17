import { ImExit } from "react-icons/im";
import Timer from "./Timer";
import { FaCoins, FaStar } from "react-icons/fa";
import type { GameContext, GameUserContext } from "../../pages/Models";
import { SUIT_ICONS } from "../../utils/CardUtils";

type TableHeaderProps = {
    gameCtx?: GameContext | null;
    gameUserCtx?: GameUserContext | null;
    handleLeaveRoom: () => void;
};


const TableHeader : React.FC<TableHeaderProps>= ({ gameCtx, gameUserCtx, handleLeaveRoom }) => {
    return (
        <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-b border-gray-700 bg-gradient-to-r from-blue-900/80 to-gray-900/80 gap-2">
                        <div className="flex flex-wrap gap-2 items-center justify-center">
                            <span className="flex items-center gap-1 bg-yellow-900/80 text-yellow-200 px-3 py-1.5 rounded-lg font-semibold shadow text-base">
                                <FaCoins className="text-yellow-400 text-lg" />
                                <span>Zakład:</span>
                                <span className="text-yellow-300 font-bold">{gameCtx?.currentBet ?? '-'}</span>
                            </span>
                            <span
                                className="flex items-center gap-1 bg-green-900/80 text-green-200 px-3 py-1.5 rounded-lg font-semibold shadow text-base"
                                title={gameCtx?.trumpSuit ? `Meldunek: ${gameCtx.trumpSuit}` : "Brak meldunku"}
                            >
                                <FaStar className="text-green-400 text-lg" />
                                <span>Meldunek:</span>
                                <span className="text-green-300 font-bold">{gameCtx?.trumpSuit ? SUIT_ICONS[gameCtx.trumpSuit] : '-'}</span>
                            </span>
                            <span className="flex items-center gap-1 bg-gradient-to-r from-blue-700 to-blue-900 text-white px-3 py-1.5 rounded-lg font-bold shadow text-base">
                                MY:
                                <span className="text-blue-300 font-bold">{gameUserCtx?.myTeamScore[0] ?? 0}</span>
                            </span>
                            <span className="flex items-center gap-1 bg-gradient-to-r from-pink-700 to-pink-900 text-white px-3 py-1.5 rounded-lg font-bold shadow text-base">
                                WY:
                                <span className="text-pink-300 font-bold">{gameUserCtx?.opponentScore[0] ?? 0}</span>
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Timer />
                            <button
                                onClick={handleLeaveRoom}
                                className="px-3 py-1.5 bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 text-white rounded-lg font-semibold shadow flex items-center gap-2 transition-all duration-150 cursor-pointer"
                                aria-label="Wyjdź"
                            >
                                Wyjdź <ImExit />
                            </button>
                        </div>
                    </div>
    )
};
export default TableHeader;