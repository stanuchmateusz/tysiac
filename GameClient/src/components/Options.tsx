import React, { useState, useEffect } from 'react';
import { IoMdClose } from 'react-icons/io';
import { FaVolumeUp, FaVolumeMute } from 'react-icons/fa';
import { cardSizeCookieName, deckSkinCookieName, getCookie, musicMutedCookieName, musicVolumeCookieName, setCookie, soundMutedCookieName, soundVolumeCookieName, userIdCookieName } from '../utils/Cookies';
import MusicService from '../services/MusicService';
import getAvailableDeckSkins from '../services/CustomsService';

interface OptionsProps {
    isOpen: boolean;
    onClose: () => void;
}

const Options: React.FC<OptionsProps> = ({ isOpen, onClose }) => {

    const [musicVolume, setMusicVolume] = useState<number>(() => {
        const savedMusicVolume = getCookie(musicVolumeCookieName);
        return savedMusicVolume ? parseInt(savedMusicVolume, 10) : 20; // Default 20%
    });
    const [soundVolume, setSoundVolume] = useState<number>(() => {
        const savedSoundVolume = getCookie(soundVolumeCookieName);
        return savedSoundVolume ? parseInt(savedSoundVolume, 10) : 50; // Default 50%
    });
    const [availableDeckSkins, setAvailableDeckSkins] = useState<string[]>([]);

    useEffect(() => {
        getAvailableDeckSkins()
            .then(skins => {
                (skins as string[]).push('default');
                setAvailableDeckSkins(skins);
            })
            .catch(error => {
                console.error('Error fetching deck skins:', error);
            });
    }, []);

    const [isMusicMuted, setIsMusicMuted] = useState<boolean>(() => {
        const savedMuteState = getCookie(musicMutedCookieName);
        return savedMuteState === "true";
    });
    const [isSoundMuted, setIsSoundMuted] = useState<boolean>(() => {
        const savedMuteState = getCookie(soundMutedCookieName);
        return savedMuteState === "true";
    });

    const [playerId, setPlayerId] = useState<string | null>(null);
    const [cardSize, setCardSize] = useState<string>(getCookie(cardSizeCookieName) ?? "m"); // Default card size

    useEffect(() => {
        setCookie(cardSizeCookieName, cardSize.toString(), 365);
    }, [cardSize]);

    useEffect(() => {
        setCookie(musicVolumeCookieName, musicVolume.toString(), 365);
        if (!isMusicMuted) {
            MusicService.setBackgroundMusicVolume(musicVolume);
        }
    }, [musicVolume, isMusicMuted]);

    useEffect(() => {
        setCookie(soundVolumeCookieName, soundVolume.toString(), 365);
        if (!isSoundMuted) {
            MusicService.setEffectsVolume(soundVolume);
        }
    }, [soundVolume, isSoundMuted]);


    useEffect(() => {
        setCookie(musicMutedCookieName, isMusicMuted.toString(), 365);
        MusicService.setBackgroundMusicVolume(isMusicMuted ? 0 : musicVolume);
    }, [isMusicMuted, musicVolume]);


    useEffect(() => {
        setCookie(soundMutedCookieName, isSoundMuted.toString(), 365);
        MusicService.setEffectsVolume(isSoundMuted ? 0 : soundVolume);
    }, [isSoundMuted, soundVolume]);


    useEffect(() => {
        const localId = getCookie(userIdCookieName);
        if (localId) setPlayerId(localId);
    }, []);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 animate-fade-in">
            <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-blue-950 rounded-2xl p-6 shadow-2xl flex flex-col items-center border-2 border-blue-700 min-w-[320px] max-w-md w-full relative">
                <button
                    onClick={onClose}
                    className="cursor-pointer absolute top-3 right-3 text-gray-400 hover:text-white transition-colors"
                    aria-label="Zamknij ustawienia"
                >
                    <IoMdClose size={28} />
                </button>
                <h2 className="text-2xl font-bold mb-6 text-blue-300 drop-shadow-lg">Ustawienia</h2>
                <div className="w-full mb-4">
                    <div className="flex justify-between items-center mb-2">
                        <label htmlFor="musicVolume" className="block text-lg text-gray-200">
                            Głośność muzyki: <span className="font-bold text-blue-300">{isMusicMuted ? 'Wyciszona' : `${musicVolume}%`}</span>
                        </label>
                        <button onClick={() => setIsMusicMuted(!isMusicMuted)} className="cursor-pointer text-xl p-2 hover:bg-gray-700 rounded-full text-gray-300 hover:text-white transition-colors" aria-label={isMusicMuted ? "Włącz muzykę" : "Wycisz muzykę"}>
                            {isMusicMuted ? <FaVolumeMute /> : <FaVolumeUp />}
                        </button>
                    </div>
                    <input type="range" id="musicVolume" min="0" max="100" value={musicVolume} onChange={(e) => setMusicVolume(parseInt(e.target.value, 10))} className={`w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500 ${isMusicMuted ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={isMusicMuted} />
                </div>
                <div className="w-full mb-6">
                    <div className="flex justify-between items-center mb-2">
                        <label htmlFor="soundVolume" className="block text-lg text-gray-200">
                            Głośność dźwięków: <span className="font-bold text-green-300">{isSoundMuted ? 'Wyciszone' : `${soundVolume}%`}</span>
                        </label>
                        <button onClick={() => setIsSoundMuted(!isSoundMuted)} className="cursor-pointer text-xl p-2 hover:bg-gray-700 rounded-full text-gray-300 hover:text-white transition-colors" aria-label={isSoundMuted ? "Włącz dźwięki" : "Wycisz dźwięki"}>
                            {isSoundMuted ? <FaVolumeMute /> : <FaVolumeUp />}
                        </button>
                    </div>
                    <input
                        type="range" id="soundVolume" min="0" max="100" value={soundVolume}
                        onChange={(e) => setSoundVolume(parseInt(e.target.value, 10))}
                        className={`w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500 ${isSoundMuted ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={isSoundMuted}
                    />
                </div>
                <div className="w-full mb-4">
                    <label htmlFor="cardSize" className="block text-lg text-gray-200 mb-2">Rozmiar karty:</label>
                    <select
                        id="cardSize"
                        className="cursor-pointer w-full p-2 bg-gray-700 text-gray-200 rounded-lg border border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        defaultValue={cardSize}
                        onChange={(e) => setCardSize(e.target.value)}
                    >
                        <option value={'xs'}>XS</option>
                        <option value={'s'}>S</option>
                        <option value={'m'}>M</option>
                        <option value={'l'}>L</option>
                        <option value={'xl'}>XL</option>
                        <option value={'xxl'}>XXL</option>
                        <option value={'xxxl'}>XXXL</option>
                    </select>

                </div>
                <div className="w-full mb-4" >
                    <label htmlFor="deckSkin" className="block text-lg text-gray-200 mb-2">Wybierz skórkę talii:</label>
                    <select
                        id="deckSkin"
                        className="cursor-pointer w-full p-2 bg-gray-700 text-gray-200 rounded-lg border border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onChange={(e) => setCookie(deckSkinCookieName, e.target.value, 365)}
                        defaultValue={getCookie(deckSkinCookieName) || "default"}
                    >
                        {availableDeckSkins.map((skin) => (
                            <option key={skin} value={skin}>{skin}</option>
                        ))}
                    </select>
                </div>
                <p>
                    <i>ID gracza: {playerId}</i>
                </p>
            </div>
        </div>
    );
};

export default Options;