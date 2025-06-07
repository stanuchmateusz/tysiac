using GameServer.Models.Enums;

namespace GameServer.Models;

public class Round
{
    
    public int CurrentBet = 100;
    
    public Queue<IPlayer> OrginalTurnQueue = new();
    public Queue<IPlayer> TurnQueue = new();
    
    public List<ICard> CurrentCardsOnTable { get; } = [];
    public CardSuit? TrumpSuit { get; set; }
    public IPlayer CurrentBidWinner { get; set; }
    public CardSuit? QueuedTrumpSuit { get; set; }
    public List<ICard> Team1Cards { get; set; } = [];
    public List<ICard> Team2Cards { get; set; } = [];
    public List<Tuple<CardSuit,Team>> SuitToTeam { get; set; } = new List<Tuple<CardSuit, Team>>();

    public int Team1Points { get; set; }
    public int Team2Points { get; set; }
    public List<ICard> Musik = [];
    public HashSet<IPlayer> Pass = [];
    
}