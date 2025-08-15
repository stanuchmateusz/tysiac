import { SUIT_ICONS } from "../../utils/CardUtils";

interface TrumpModalProps {
    open: boolean;
    trumpSuit?: number | null;
}

const TrumpModal: React.FC<TrumpModalProps> = ({ open, trumpSuit }) => {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 animate-fade-in-fast">
            <div className="bg-yellow-900 bg-opacity-90 rounded-2xl p-8 shadow-2xl flex flex-col items-center border-4 border-yellow-400 animate-trump-pop">
                <span className="text-5xl font-bold text-yellow-300 mb-4 drop-shadow-lg animate-trump-shine">
                    Nowy meldunek: {trumpSuit ? SUIT_ICONS[trumpSuit] : '-'}
                </span>
            </div>
        </div>
    );
};

export default TrumpModal;