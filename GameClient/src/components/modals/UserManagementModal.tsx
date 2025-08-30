import { FaTimes } from "react-icons/fa";

type UserManagementModalProps = {
    open: boolean;
    onClose: () => void;
    user: { id: number; login: string; email: string; role: string } | null;
    onSave: (updatedUser: { id: number; login: string; email: string; role: string }) => void;
};

const UserManagementModal: React.FC<UserManagementModalProps> = ({ open, onClose, user, onSave }) => {
    if (!open || !user) return null;

    const handleSave = () => {
        onSave(user);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
            <div className="bg-neutral-900 rounded-2xl p-8 shadow-2xl w-full max-w-lg relative">
                <button
                    className="absolute top-3 right-3 text-gray-400 hover:text-red-400 transition-colors"
                    onClick={onClose}
                >
                    <FaTimes size={20} />
                </button>

                <h2 className="text-2xl font-bold mb-6 text-white">Edycja użytkownika</h2>

                <div className="space-y-4">
                    <div>
                        <label className="text-sm text-gray-300 block mb-1">Login</label>
                        <input
                            type="text"
                            value={user.login}
                            disabled
                            className="w-full p-3 rounded-lg bg-neutral-800 border border-gray-700 text-white"
                        />
                    </div>
                    <div>
                        <label className="text-sm text-gray-300 block mb-1">Email</label>
                        <input
                            type="text"
                            value={user.email}
                            onChange={(e) => (user.email = e.target.value)}
                            className="w-full p-3 rounded-lg bg-neutral-800 border border-gray-700 text-white"
                        />
                    </div>
                    <div>
                        <label className="text-sm text-gray-300 block mb-1">Rola</label>
                        <select
                            value={user.role}
                            onChange={(e) => (user.role = e.target.value)}
                            className="w-full p-3 rounded-lg bg-neutral-800 border border-gray-700 text-white"
                        >
                            <option value="USER">USER</option>
                            <option value="ADMIN">ADMIN</option>
                            <option value="MOD">MOD</option>
                        </select>
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-4">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-semibold"
                    >
                        Anuluj
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold"
                    >
                        Zapisz
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserManagementModal;
