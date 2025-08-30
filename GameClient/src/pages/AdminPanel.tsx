import { useState, useMemo } from "react";
import ReturnButton from "../components/ReturnButton";
import UserManagementModal from "../components/modals/UserManagementModal";
import ConfirmModal from "../components/modals/ConfirmModal";

type User = {
    id: number;
    login: string;
    email: string;
    role: string;
};

const AdminPanel = () => {
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [isUserModalOpen, setUserModalOpen] = useState(false);
    const [isConfirmOpen, setConfirmOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    const users: User[] = [
        { id: 1, login: "piotr", email: "example@example.com", role: "USER" },
        { id: 2, login: "mateusz", email: "mateusz@example.com", role: "ADMIN" },
        { id: 3, login: "ania", email: "ania@example.com", role: "USER" },
        { id: 4, login: "kasia", email: "kasia@example.com", role: "USER" },
        { id: 5, login: "marek", email: "marek@example.com", role: "USER" },
        { id: 6, login: "ola", email: "ola@example.com", role: "USER" },
        { id: 7, login: "krzys", email: "krzys@example.com", role: "USER" },
        { id: 8, login: "admin", email: "admin@example.com", role: "ADMIN" },
        { id: 9, login: "tester", email: "tester@example.com", role: "USER" },
    ];

    const itemsPerPage = 8;

    // filtrowanie
    const filteredUsers = useMemo(() => {
        return users.filter(
            (u) =>
                u.login.toLowerCase().includes(search.toLowerCase()) ||
                u.email.toLowerCase().includes(search.toLowerCase())
        );
    }, [users, search]);

    // stronicowanie
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const startIndex = (page - 1) * itemsPerPage;
    const currentUsers = filteredUsers.slice(
        startIndex,
        startIndex + itemsPerPage
    );
    const handleEdit = (user: User) => {
        setSelectedUser({ ...user });
        setUserModalOpen(true);
    };

    const handleSave = (updatedUser: User) => {
        console.log("Zapisano:", updatedUser);

    };

    const handleDelete = (user: User) => {
        console.log("Usunięto:", user);
        setConfirmOpen(true);
    };
    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white px-6 py-10">
            <ReturnButton />
            <UserManagementModal
                open={isUserModalOpen}
                onClose={() => setUserModalOpen(false)}
                user={selectedUser}
                onSave={(updatedUser) => console.log("Zapisano:", updatedUser)}
            />

            <ConfirmModal
                open={isConfirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={() => console.log("Usunięto")}
                title="Potwierdź usunięcie"
                message="Czy na pewno chcesz usunąć tego użytkownika?"
                confirmText="Usuń"
            />

            <h1 className="text-5xl font-extrabold mb-10 text-center text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-purple-500 drop-shadow-lg">
                Panel administratora
            </h1>

            <div className="max-w-7xl mx-auto flex flex-col gap-12">
                {/* Ogólne statystyki */}
                <div>
                    <h2 className="text-2xl font-bold mb-6 text-green-400 text-center">Ogólne statystyki</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gray-900/80 backdrop-blur-md rounded-3xl shadow-2xl p-6 border border-gray-700/50 flex flex-col items-center justify-center">
                            <h3 className="text-xl font-semibold mb-2 text-blue-400">Liczba użytkowników</h3>
                            <p className="text-4xl font-bold">{users.length}</p>
                        </div>
                        <div className="bg-gray-900/80 backdrop-blur-md rounded-3xl shadow-2xl p-6 border border-gray-700/50 flex flex-col items-center justify-center">
                            <h3 className="text-xl font-semibold mb-2 text-purple-400">Aktywne gry</h3>
                            <p className="text-4xl font-bold">12</p>
                        </div>
                    </div>
                </div>
                {/* Zarządzanie użytkownikami */}
                <div className="bg-gray-900/80 backdrop-blur-md rounded-3xl shadow-2xl p-6 border border-gray-700/50">
                    <h2 className="text-2xl font-bold mb-6 text-red-400">
                        Zarządzanie użytkownikami
                    </h2>

                    {/* Wyszukiwarka */}
                    <div className="mb-4 flex justify-between items-center">
                        <input
                            type="text"
                            placeholder="Szukaj po loginie lub emailu..."
                            value={search}
                            onChange={(e) => {
                                setPage(1);
                                setSearch(e.target.value);
                            }}
                            className="p-3 rounded-xl bg-neutral-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full max-w-md"
                        />
                    </div>

                    {/* Tabela */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-gray-300 border-b border-gray-700">
                                    <th className="py-3 px-4">ID</th>
                                    <th className="py-3 px-4">Login</th>
                                    <th className="py-3 px-4">Email</th>
                                    <th className="py-3 px-4">Rola</th>
                                    <th className="py-3 px-4">Akcje</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentUsers.map((user) => (
                                    <tr
                                        key={user.id}
                                        className="hover:bg-gray-800/40 transition-colors"
                                    >
                                        <td className="py-3 px-4">{user.id}</td>
                                        <td className="py-3 px-4">{user.login}</td>
                                        <td className="py-3 px-4">{user.email}</td>
                                        <td className="py-3 px-4">{user.role}</td>
                                        <td className="py-3 px-4 flex gap-2">
                                            <button
                                                onClick={() => handleEdit(user)}
                                                className="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-semibold">
                                                Edytuj
                                            </button>

                                            <button
                                                onClick={() => handleDelete(user)}
                                                className="px-3 py-1 bg-red-600 hover:bg-red-500 rounded-lg text-sm font-semibold">
                                                Usuń
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {currentUsers.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="py-6 text-center text-gray-400 italic"
                                        >
                                            Brak wyników
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Paginacja */}
                    <div className="flex justify-center items-center mt-6 gap-4">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-40 rounded-lg"
                        >
                            Poprzednia
                        </button>
                        <span className="text-gray-300">
                            Strona {page} z {totalPages || 1}
                        </span>
                        <button
                            disabled={page === totalPages || totalPages === 0}
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-40 rounded-lg"
                        >
                            Następna
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminPanel;
