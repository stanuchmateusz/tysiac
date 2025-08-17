import { useEffect, useRef, useState } from "react";

function formatTime(seconds: number) {
    const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
    const ss = String(seconds % 60).padStart(2, "0");
    return `${mm}:${ss}`;
}

const Timer = () => {
    const [timer, setTimer] = useState(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        // Start timer on mount
        timerRef.current = setInterval(() => {
            setTimer(prev => prev + 1);
        }, 1000);
        // Cleanup on unmount
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    return (
        <span className="flex items-center gap-1 bg-gray-900/80 text-gray-200 px-3 py-1.5 rounded-lg font-semibold shadow text-base">
            ⏱ <span>{formatTime(timer)}</span>
        </span>
    );
};

export default Timer;