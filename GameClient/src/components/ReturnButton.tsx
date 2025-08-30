import { useNavigate } from "react-router-dom";

const ReturnButton = ({ title = 'Powrót' }: { title?: string }) => {
    const navigate = useNavigate();
    return (
        <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            onClick={() => { navigate(-1) }}
        >
            {title}
        </button>
    );
};

export default ReturnButton;