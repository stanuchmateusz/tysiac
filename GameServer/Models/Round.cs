namespace GameServer.Models;

public class Round
{
    
    public int CurrentBet = 100;
    
    public Queue<IPlayer> OrginalTurnQueue = new();
    public Queue<IPlayer> TurnQueue = new();
    
    public List<ICard> CurrentCardsOnTable { get; } = [];
    public CardSuit? TrumpSuit { get; set; }
    public IPlayer CurrentBidWinner { get; set; }
    
    public List<ICard> Team1Cards { get; set; } = [];
    public List<ICard> Team2Cards { get; set; } = [];
    public int Team1Trumps { get; set; }
    public int Team2Trumps { get; set; }
    public int Team1Points { get; set; }
    public int Team2Points { get; set; }
    public List<ICard> Musik = [];
    public HashSet<IPlayer> Pass = [];
    
}