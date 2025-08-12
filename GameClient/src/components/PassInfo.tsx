interface PassInfoProps {
    open: boolean;
}

const PassInfo: React.FC<PassInfoProps> = ({ open }) => {
    if (!open) return null;
    return (
        <div className="absolute left-1/2 top-3/4 -translate-x-1/2 -translate-y-1/2 z-30 flex items-center justify-center animate-fade-in-fast">
            <div className="bg-green-700/90 rounded-2xl px-10 py-6 shadow-2xl flex items-center justify-center">
                <span className="text-5xl font-extrabold text-white drop-shadow-lg animate-pulse tracking-widest">
                    PASS
                </span>
            </div>
        </div>
    );
};

export default PassInfo;