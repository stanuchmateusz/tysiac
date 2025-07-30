
export const ParseHubExcepion = (err: Error): string => {
    var e = err.message.split("HubException: ")
    if (e.length > 1) {
        return e[1]
    }
    return err.message;
}

export const MapErrorMessage = (errMessage: string): string => {
    switch (errMessage) {
        case "Room is full":
            return "Pokój jest pełny";
        case "Room not found":
            return "Pokój z takim kodem nie istnieje";
        default:
            return errMessage;
    }
}