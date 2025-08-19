import type React from "react";
import type { RoundSummary } from "../../pages/Models";
import { SUIT_ICONS, SUIT_VALUES } from "../../utils/CardUtils";

type RoundSummaryProps = {
    roundSummary: RoundSummary | null,
}

const RoundSummaryModal: React.FC<RoundSummaryProps> = ({ roundSummary }) => {
    if (!roundSummary) return null;

    return (
        <div className="absolute top-24 left-4 z-40 animate-fade-in">
            <div className="bg-gradient-to-br from-slate-900 via-gray-800 to-blue-900 rounded-2xl p-6 shadow-xl border border-blue-700 min-w-[300px] max-w-sm">
                <h2 className="text-xl font-bold mb-3 text-blue-200 drop-shadow text-center">
                    Podsumowanie rundy
                </h2>

                <div className="grid grid-cols-1 gap-2 text-sm text-gray-200">
                    <div className="flex justify-between">
                        <span className="font-semibold">Zakład rundy:</span>
                        <span>{roundSummary.roundBet}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-semibold">Czy my graliśmy?</span>
                        <span>{roundSummary.didWeWonBet ? "Tak" : "Nie"}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-semibold">Nasz wynik z kart:</span>
                        <span className="text-green-300">{roundSummary.myTeamScoreFromCards}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-semibold">Karty przeciwnika:</span>
                        <span className="text-red-300">{roundSummary.opponentScoreFromCards}</span>
                    </div>
                    <div>
                        <span className="font-semibold">Nasze meldunki:</span>{" "}
                        <span className="text-green-300">
                            {roundSummary.myTeamMeldSuits.length > 0
                                ? roundSummary.myTeamMeldSuits.map(
                                      suit => `${SUIT_ICONS[suit]} ${SUIT_VALUES[suit]}`
                                  ).join("  ")
                                : "Brak"}
                        </span>
                    </div>
                    <div>
                        <span className="font-semibold">Meldunki przeciwnika:</span>{" "}
                        <span className="text-red-300">
                            {roundSummary.opponentMeldSuits.length > 0
                                ? roundSummary.opponentMeldSuits.map(
                                      suit => `${SUIT_ICONS[suit]} ${SUIT_VALUES[suit]}`
                                  ).join("  ")
                                : "Brak"}
                        </span>
                    </div>
                    <div className="flex justify-between mt-2 border-t border-gray-700 pt-2">
                        <span className="font-semibold">Finalny wynik:</span>
                        <span className={`text-${roundSummary.myTeamFinalScore > 0 ? "green" : "red"}-400`}>{roundSummary.myTeamFinalScore}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-semibold">Wynik przeciwnika:</span>
                        <span className={`text-${roundSummary.myTeamFinalScore <= 0 ? "green" : "red"}-400`}>{roundSummary.opponentFinalScore}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RoundSummaryModal;
