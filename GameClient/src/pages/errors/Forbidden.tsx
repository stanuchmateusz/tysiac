export default function Forbidden() {
    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-neutral-900 via-gray-900 to-blue-950">
            <div className="bg-gray-800/90 rounded-2xl shadow-2xl px-10 py-12 flex flex-col items-center border border-gray-700 animate-fade-in w-full max-w-lg">
                <h1 className="text-5xl font-extrabold mb-4 text-blue-300 drop-shadow-lg tracking-wide">403 Forbidden</h1>
                <p className="text-lg text-gray-200 mb-8 text-center">You do not have permission to access this page.</p>
                <a href="/" className="mt-2 px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white rounded-lg font-semibold shadow-md transition-all duration-150 cursor-pointer">Go to Home</a>
            </div>
        </div>
    );
}