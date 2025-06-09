import { CiSettings } from "react-icons/ci";

const OptionsButton = ({ showOptions }: { showOptions: Function }) => {
    return <div className="fixed top-4 right-4 z-50 " >
        <button
            onClick={() => showOptions(true)}
            className="cursor-pointer p-3 bg-gray-700/80 hover:bg-gray-600/80 backdrop-blur-sm rounded-full text-white shadow-lg transition-colors"
            aria-label="Ustawienia"
        >
            <CiSettings size={26} />
        </button>
    </div>
}
export default OptionsButton;