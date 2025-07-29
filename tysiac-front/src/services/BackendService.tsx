const getAvailableDeckSkins = async () => {
    try {
        const response = await fetch(import.meta.env.VITE_BACKEND_URL + '/api/GameData/skins');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Failed to fetch available deck skins:', error);
        throw error;
    }
};

export default getAvailableDeckSkins;