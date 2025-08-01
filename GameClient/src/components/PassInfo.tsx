interface PassInfoProps {
    open: boolean;
}

const PassInfo: React.FC<PassInfoProps> = ({ open }) => {
    if (!open) return null;
    return (
        <div className="absolute left-1/2 top-3/4 -translate-x-1/2 -translate-y-1/2 z-30 flex items-center justify-center animate-fade-in-fast">
            <span className="text-5xl font-bold text-green-600 mb-4">
                PASS
            </span>
        </div>
    );
};

export default PassInfo;