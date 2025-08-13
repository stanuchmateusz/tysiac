import { CiSettings } from "react-icons/ci";

const OptionsButton = ({ showOptions }: { showOptions: () => void }) => {
    return <div className="fixed bottom-4 right-4 z-50" >
        <button
            onClick={showOptions}
            className="p-3 bg-gray-800/80 hover:bg-gray-700/80 backdrop-blur-sm rounded-full text-white shadow-lg transition-colors cursor-pointer"
            aria-label="Ustawienia"
        >
            <CiSettings size={26} />
        </button>
    </div>
}
export default OptionsButton;