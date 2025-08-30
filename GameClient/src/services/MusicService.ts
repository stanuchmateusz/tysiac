import { Howl } from 'howler';
import { getCookie, soundMutedCookieName, soundVolumeCookieName } from '../utils/Cookies';

export const SOUNDS_PATH = import.meta.env.VITE_ASSETS_PATH + "sounds/" || "/public/assets/sounds/";

class MusicServiceController {
    private backgroundMusic: Howl | null = null;
    private bellSound: Howl | null = null;
    private clickSound: Howl | null = null;
    private placeCardSound: Howl | null = null;
    private meldSound: Howl | null = null;
    private defaultMusicVolume = 0.2;
    private defaultSoundVolume = 0.5;

    constructor() {
        this.initializeBackgroundMusic();
        this.initializeBellSound();
        this.initializeClickSound();
        this.initializePlaceCardSound();
        this.initializeMeldSound();
    }

    private getVolumeFromCookie(cookieName: string, defaultValue: number): number {
        const savedVolume = getCookie(cookieName);
        return savedVolume ? parseInt(savedVolume, 10) / 100 : defaultValue;
    }

    private initializeBackgroundMusic() {
        const initialMusicVolume = this.getVolumeFromCookie("musicVolume", this.defaultMusicVolume);
        this.backgroundMusic = new Howl({
            src: [SOUNDS_PATH + 'background.mp3'],
            volume: initialMusicVolume,
            loop: true,
        });
    }
    private initializeMeldSound() {
        const initialSoundVolume = this.getVolumeFromCookie(soundVolumeCookieName, this.defaultSoundVolume);
        this.meldSound = new Howl({
            src: [SOUNDS_PATH + 'meld.mp3'],
            volume: initialSoundVolume,
        });
    }
    private initializePlaceCardSound() {
        const initialSoundVolume = this.getVolumeFromCookie(soundVolumeCookieName, this.defaultSoundVolume);
        this.placeCardSound = new Howl({
            src: [SOUNDS_PATH + 'place_card.mp3'],
            volume: initialSoundVolume,
        });
    }

    private initializeBellSound() {
        const initialSoundVolume = this.getVolumeFromCookie(soundVolumeCookieName, this.defaultSoundVolume);
        this.bellSound = new Howl({
            src: [SOUNDS_PATH + 'bell.mp3'],
            volume: initialSoundVolume,
        });
    }

    private initializeClickSound() {
        const initialSoundVolume = this.getVolumeFromCookie(soundVolumeCookieName, this.defaultSoundVolume);
        this.clickSound = new Howl({
            src: [SOUNDS_PATH + 'click.mp3'],
            volume: initialSoundVolume,
        });
    }

    playBackgroundMusic() {
        if (this.backgroundMusic && !this.backgroundMusic.playing()) {
            this.backgroundMusic.play();
        }
    }

    stopBackgroundMusic() {
        if (this.backgroundMusic && this.backgroundMusic.playing()) {
            this.backgroundMusic.stop();
        }
    }

    setBackgroundMusicVolume(volumePercent: number) {
        const newVolume = volumePercent / 100;
        if (this.backgroundMusic) {
            this.backgroundMusic.volume(newVolume);
        }
    }

    playBell() {
        if (this.bellSound) {
            this.bellSound.volume(this.getSoundVolumeFromCookies())
            this.bellSound.stop();
            this.bellSound.play();
        }
    }

    playClick() {
        if (this.clickSound) {
            this.clickSound.volume(this.getSoundVolumeFromCookies())
            this.clickSound.play();
        }
    }

    playPlaceCard() {
        if (this.placeCardSound && !this.placeCardSound.playing()) {
            this.placeCardSound.volume(this.getSoundVolumeFromCookies())
            this.placeCardSound.play();
        }
    }

    playMeld() {
        if (this.meldSound) {
            this.meldSound.volume(this.getSoundVolumeFromCookies())
            this.meldSound.play();
        }
    }

    private getSoundVolumeFromCookies() {
        const isMuted = getCookie(soundMutedCookieName) === "true";
        return isMuted ? 0 : this.getVolumeFromCookie(soundVolumeCookieName, this.defaultSoundVolume);
    }

    setEffectsVolume(volumePercent: number) {
        const newVolume = volumePercent / 100;
        if (this.bellSound) {
            this.bellSound.volume(newVolume);
        }
    }
}

const MusicService = new MusicServiceController();
export default MusicService;