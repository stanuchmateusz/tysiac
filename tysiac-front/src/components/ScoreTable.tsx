import React from "react";
import type { UpdateContext } from "../pages/Models";

type Props = {
    gameUserCtx: UpdateContext["userCtx"] | null;
};

const ScoreTable: React.FC<Props> = ({ gameUserCtx }) => (
    <div className="max-h-72 overflow-y-auto rounded-lg">
        <table className="w-full text-white text-sm border border-gray-700">
            <thead>
                <tr className="bg-blue-800 text-white">
                    <th className="px-4 py-2 border border-gray-700">Runda</th>
                    <th className="px-4 py-2 border border-gray-700">My</th>
                    <th className="px-4 py-2 border border-gray-700">Wy</th>
                </tr>
            </thead>
            <tbody>
                {(gameUserCtx?.myTeamScore || [])
                    .map((_, i, arr) => {
                        const reversedIndex = arr.length - 1 - i;
                        const prevMy = arr[reversedIndex + 1];
                        const prevOpp = gameUserCtx?.opponentScore[reversedIndex + 1];

                        const myVal = arr[reversedIndex];
                        const oppVal = gameUserCtx?.opponentScore[reversedIndex] ?? 0;

                        const myColor =
                            prevMy === undefined
                                ? "text-white"
                                : myVal > prevMy
                                    ? "text-green-400"
                                    : myVal < prevMy
                                        ? "text-red-400"
                                        : "text-white";

                        const oppColor =
                            prevOpp === undefined
                                ? "text-white"
                                : oppVal > prevOpp
                                    ? "text-green-400"
                                    : oppVal < prevOpp
                                        ? "text-red-400"
                                        : "text-white";

                        return (
                            i !== 0 ? (
                                <tr key={reversedIndex} className="odd:bg-gray-800 even:bg-gray-700">
                                    <td className="px-4 py-2 border border-gray-700 text-center">{i}</td>
                                    <td className={`px-4 py-2 border border-gray-700 text-center ${myColor}`}>{myVal}</td>
                                    <td className={`px-4 py-2 border border-gray-700 text-center ${oppColor}`}>{oppVal}</td>
                                </tr>
                            ) : null
                        );
                    })}
            </tbody>
        </table>
    </div>
);

export default ScoreTable;