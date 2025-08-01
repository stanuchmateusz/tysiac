export const musicVolumeCookieName = "musicVolume"
export const soundVolumeCookieName = "soundVolume"
export const musicMutedCookieName = "musicMuted"
export const soundMutedCookieName = "soundMuted"
export const userIdCookieName = "tysiac_userId"
export const userNicknameCookieName = "tysiac_nickname"
export const deckSkinCookieName = "deckSkin"

export const getCookie = (name: string): string | null => {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
};
export const setCookie = (name: string, value: string, days: number, sameSite: "Lax" | "Strict" | "None" = "Lax") => {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    let sameSiteAttr = `; SameSite=${sameSite}`;
    let secureAttr = sameSite === "None" ? "; Secure" : "";
    document.cookie = name + "=" + (value || "") + expires + "; path=/" + sameSiteAttr + secureAttr;
};