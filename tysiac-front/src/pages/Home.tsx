import StartGame from "../components/StartGame";

export default function Home() {

    return (

        <div className="bg-gray-800/90 rounded-2xl shadow-2xl px-10 py-10 flex flex-col items-center w-full max-w-lg">
            <h1 className="text-5xl font-extrabold mb-4 text-blue-300 drop-shadow-lg tracking-wide">Tysiąc siadany</h1>
            <p className="text-lg text-gray-200 mb-8 text-center">
                Gra karciana dla 4 graczy, rozdzielnych na dwie równe drużyny.<br />
                Celem jest zdobycie <span className="font-bold text-blue-400">1000 punktów</span> przez jedną z drużyn.
            </p>
            <StartGame />
            <p className="text-sm text-gray-400 mt-8">
                <a href="/rules" className="text-blue-400 hover:underline transition-colors duration-150">
                    Zasady gry
                </a>
            </p>
        </div>

    );
}