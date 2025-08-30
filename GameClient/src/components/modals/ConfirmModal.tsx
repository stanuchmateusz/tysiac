import { FaTimes } from "react-icons/fa";

type ConfirmModalProps = {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    message?: string;
    confirmText?: string;
    cancelText?: string;
};

const ConfirmModal: React.FC<ConfirmModalProps> = ({
    open,
    onClose,
    onConfirm,
    title = "Potwierdzenie",
    message = "Czy na pewno chcesz to zrobić?",
    confirmText = "Potwierdź",
    cancelText = "Anuluj",
}) => {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
            <div className="bg-neutral-900 rounded-2xl p-8 shadow-2xl w-full max-w-md relative">
                <button
                    className="absolute top-3 right-3 text-gray-400 hover:text-red-400 transition-colors"
                    onClick={onClose}
                >
                    <FaTimes size={20} />
                </button>

                <h2 className="text-2xl font-bold mb-4 text-white">{title}</h2>
                <p className="text-gray-300 mb-6">{message}</p>

                <div className="flex justify-end gap-4">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-semibold"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className="px-6 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold"
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
