public class GameSettings : IGameSettings
{
    public bool UnlimitedWin { get; set; }
    public bool AllowRaise { get; set; }

    public GameSettings()
    {
        UnlimitedWin = false;
        AllowRaise = true;
    }
}