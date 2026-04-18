const getAvailableDeckSkins = async () => {
    try {
        const assetsPath = import.meta.env.VITE_ASSETS_PATH || "/assets/";
        const response = await fetch(`${assetsPath}skins.json`);
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