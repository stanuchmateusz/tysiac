import { Line } from "react-chartjs-2";
import type { UpdateContext } from "../pages/Models";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
    Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

type Props = {
    gameUserCtx: UpdateContext["userCtx"] | null;
};

const ScoreTable: React.FC<Props> = ({ gameUserCtx }) => {
    const rounds = (gameUserCtx?.myTeamScore || []).length;
    const labels = Array.from({ length: rounds - 1 }).map((_, i) => i + 1);
    const myScores = (gameUserCtx?.myTeamScore || []).slice(0, rounds).reverse().slice(1);
    const oppScores = (gameUserCtx?.opponentScore || []).slice(0, rounds).reverse().slice(1);

    const data = {
        labels,
        datasets: [
            {
                label: "MY",
                data: myScores,
                borderColor: "#38bdf8", // tailwind sky-400
                backgroundColor: "rgba(56,189,248,0.2)",
                tension: 0.3,
                pointBackgroundColor: "#38bdf8",
                pointBorderColor: "#0ea5e9",
            },
            {
                label: "WY",
                data: oppScores,
                borderColor: "#f472b6", // tailwind pink-400
                backgroundColor: "rgba(244,114,182,0.2)",
                tension: 0.3,
                pointBackgroundColor: "#f472b6",
                pointBorderColor: "#be185d",
            },
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                labels: {
                    color: "#fff",
                    font: { size: 14, weight: "bold" as const },
                },
            },
            tooltip: {
                enabled: true,
                backgroundColor: "#222",
                titleColor: "#fff",
                bodyColor: "#fff",
            },
        },
        scales: {
            x: {
                title: { display: true, text: "Runda", color: "#fff" },
                ticks: { color: "#fff" },
                grid: { color: "#334155" },
            },
            y: {
                title: { display: true, text: "Punkty", color: "#fff" },
                ticks: { color: "#fff" },
                grid: { color: "#334155" },
                beginAtZero: true,
            },
        },
    };
    return (
        <div className="w-full max-h-72 overflow-y-auto rounded-lg">
            <table className="mb-3 w-full text-white text-sm border border-gray-700">
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
            {(myScores.length > 1 && oppScores.length > 1) && (
                <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                    <Line data={data} options={options} height={180} />
                </div>
            )}
        </div>
    )
};

export default ScoreTable;