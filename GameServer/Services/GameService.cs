using GameServer.Models;
using GameServer.Models.Context;
using GameServer.Models.impl;

namespace GameServer.Services;

public class GameService 
{
    private readonly ILogger<GameService> _logger;
    public HashSet<IPlayer> Players;
    
    public IPlayer Player1 { get; set; }
    public IPlayer Player2 { get; set; }
    public IPlayer Player3 { get; set; }
    public IPlayer Player4 { get; set; }

    public Round Round { get; set; }
    
    private readonly Stack<ICard> _deck = [];

    public int PointsTeam1 = 0;
    public int PointsTeam2 = 0;

    public GamePhase CurrentPhase { get; set; } = GamePhase.Start;
    
    // public Dictionary<string, List<ICard>> PlayerHands { get; } = new();

    // public Dictionary<string, UserSpecificData> PlayerContexts { get; } = new();
    
    public GameService(LobbyContext lobbyCtx, ILogger<GameService> logger)
    {
        Players = lobbyCtx.Players.ToHashSet();
        _logger = logger;
        ShuffleDeck(
            InitCards()
            )
            .ForEach(card => _deck.Push(card));
        InitGame(lobbyCtx);
    }
    
    private void InitGame(LobbyContext lobbyCtx)
    {
        //ustaw kolejność graczy
        Player1 = lobbyCtx.Team1[0];
        Player2 = lobbyCtx.Team2[0];
        Player3 = lobbyCtx.Team1[1];
        Player4 = lobbyCtx.Team2[1];
        
        //nowa runda
        Round = new Round();
        
        Round.TurnQueue.Enqueue(Player1);
        Round.TurnQueue.Enqueue(Player2);
        Round.TurnQueue.Enqueue(Player3);
        Round.TurnQueue.Enqueue(Player4);
        
        Round.OrginalTurnQueue = new Queue<IPlayer>(Round.TurnQueue);
        Round.CurrentBidWinner = Player1;
    }
    
    private void StartQueueFromPlayer(IPlayer player)
    {
        Round.TurnQueue.Enqueue(player);
        Round.TurnQueue.Enqueue(GetLeftPlayer(player));
        Round.TurnQueue.Enqueue(GetTeammate(player));
        Round.TurnQueue.Enqueue(GetRightPlayer(player));
    }
    private void AdvanceTurn()
    {
        Round.TurnQueue.Dequeue();
        
        if (GamePhase.CardDistribution == CurrentPhase)
        {
            Round.TurnQueue.Clear();
            Round.TurnQueue.Enqueue(Round.CurrentBidWinner);
        }
        if (Round.TurnQueue.Count == 0)
        {
            if (GamePhase.Auction == CurrentPhase)
            {
                if (Round.Pass.Count != 3) 
                    StartQueueFromPlayer(Round.CurrentBidWinner);
            }
            
            if (CurrentPhase == GamePhase.Playing)
            {
                _logger.LogInformation("GamePhase.Playing");
                if (Round.CurrentCardsOnTable.Count < 4)
                {
                    // nie ma jeszcze 4 kart na stole, więc kontynuujemy grę
                    StartQueueFromPlayer(Round.CurrentBidWinner);

                }
                else
                {
                    // jest 4 karty na stole, więc kończymy lewę
                    CompleteTake();
                    
                }
                if (_deck.Count > 0)
                {
                    // skończone rozdanie - policz  i jedziemy dalej 
                }
                else
                {
                    // koniec rozdań sumujemy i sprawdzamy kto wygrał 
                }
            }
        }
        _logger.LogInformation("Turn advanced to player {Player}" ,Round.TurnQueue.Peek());
    }
    private IPlayer GetTeammate(IPlayer player)
    {
        ArgumentNullException.ThrowIfNull(player);
        
        if (player == Player1)
            return Player3;
        if (player == Player2)
            return Player4;
        if (player == Player3)
            return Player1;
        if (player == Player4)
            return Player2;
        
        throw new ArgumentException("Unknown player");
    }
    private IPlayer GetLeftPlayer(IPlayer player)
    {
        ArgumentNullException.ThrowIfNull(player);
        
        if (player == Player1)
            return Player2;
        if (player == Player2)
            return Player3;
        if (player == Player3)
            return Player4;
        if (player == Player4)
            return Player1;
        
        throw new ArgumentException("Unknown player");
    }
    private IPlayer GetRightPlayer(IPlayer player)
    {
        ArgumentNullException.ThrowIfNull(player);
        
        if (player == Player1)
            return Player4;
        if (player == Player2)
            return Player1;
        if (player == Player3)
            return Player2;
        if (player == Player4)
            return Player3;
        
        throw new ArgumentException("Unknown player");
    }
    
    private int GetTeamPoints(IPlayer player, bool enemy = false)
    {

        if (player == Player1 || player == Player3)
        {
            return enemy ? PointsTeam2 : PointsTeam1;
        }
        //team 2
        return enemy ? PointsTeam1 : PointsTeam2;
    }
    
    public GameContext GetGameState()
    {
        return new GameContext(
            Round.TurnQueue.Peek(),
                CurrentPhase,
                Round.CurrentCardsOnTable,
                Round.TrumpSuit.GetValueOrDefault(),
                Round.Musik.Count,
                Round.CurrentBet
            );
    }

    public UserContext GetUserState(IPlayer player)
    {
        var teammate = GetTeammate(player);
        var leftPlayer = GetLeftPlayer(player);
        var rightPlayer = GetRightPlayer(player);
        return new UserContext(
            player,
            teammate,
            leftPlayer,
            rightPlayer,
            GetTeamPoints(player),
            GetTeamPoints(player, true)
            );
    }
    
    private void DealCards()
    {
        for (var i = 0; i < 5; i++)
        {
            Player1.Hand.Add(_deck.Pop());
            Player2.Hand.Add(_deck.Pop());
            Player3.Hand.Add(_deck.Pop());
            Player4.Hand.Add(_deck.Pop());
        }
        Round.Musik = _deck.ToList();
        _deck.Clear();
    }

    public IPlayer? GetPlayerFromRoom(string contextConnectionId)
    {
        return Players.FirstOrDefault(p => p.ConnectionId == contextConnectionId);
    }
    
    public void StartGame()
    {
        if (Players.Count != 4)
            throw new InvalidOperationException("Game not ready to start");
        
        DealCards();
        StartAuction();
    }
    
    private void StartAuction()
    {
        CurrentPhase = GamePhase.Auction;
        Round.CurrentBet = 100;
    }
    
    public void PlaceBid(IPlayer player, int bid)
    {
        if (bid <= Round.CurrentBet) throw new ArgumentException("Bid must be higher");
        Round.CurrentBet = bid;
        Round.CurrentBidWinner = player;
        
        AdvanceTurn();
    }
    
    public void PassBid(IPlayer player)
    {
        Round.Pass.Add(player);
        _logger.LogInformation("Player {Player} passed", player);
        if (Round.Pass.Count == 3)
        {
            var winner = Round.CurrentBidWinner;
            _logger.LogInformation("Player {Player} won auction", winner);
            MoveMusikToBindWinner(winner);
            CurrentPhase = GamePhase.CardDistribution;
        }
        AdvanceTurn();
    }

    private IPlayer? GetPlayerRef(IPlayer player)
    {
        if (player == Player1) return Player1;
        if (player == Player2) return Player2;
        if (player == Player3) return Player3;
        if (player == Player4) return Player4;
        return null;
    }

    private void MoveMusikToBindWinner(IPlayer winner)
    {
        var playerRef = GetPlayerRef(winner);
        playerRef?.Hand.AddRange(Round.Musik);
    }
    
    public void DistributeCard(IPlayer distributor, string cardToGiveShortName, IPlayer target)
    {
        if (CurrentPhase != GamePhase.CardDistribution)
            throw new InvalidOperationException("Invalid State!");

        if (distributor == target)
            throw new InvalidOperationException("Can't give yourself a card!");

        var distributorRef = GetPlayerRef(distributor);
        var targetRef = GetPlayerRef(target);
        if (distributorRef == null || targetRef == null)
            throw new InvalidOperationException("Invalid player reference");
        var cardToGive = distributorRef.Hand.FirstOrDefault(c => c.ShortName == cardToGiveShortName);
        
        if (cardToGive == null)
            throw new InvalidOperationException($"{distributorRef} doesn't have a card {cardToGive}");

        distributorRef.Hand.Remove(cardToGive);
        targetRef.Hand.Add(cardToGive);
        
        // Sprawdź czy rozdanie kart się skończyło
        if (distributorRef.Hand.Count == 6)
        {
            // Wszystkie karty rozdane, przechodzimy do fazy gry
            CurrentPhase = GamePhase.Playing;
            _logger.LogInformation("All cards distributed, moving to playing phase");
        }
        else
        {
            AdvanceTurn();
        }
    }
    
    public void PlayCard(IPlayer player, ICard card)
    {
        // if (player != CurrentPlayerTurn)
        //     throw new InvalidOperationException("Not your turn");
        var playerRef = GetPlayerRef(player);
        if (playerRef == null)
            throw new InvalidOperationException("Invalid player reference");
        if (!playerRef.Hand.Contains(card))
            throw new InvalidOperationException("Card not in hand");
        if (!CanPlay(card, Round.CurrentCardsOnTable.Last()))
        {
            throw new InvalidOperationException("Cannot play card");
        }
        playerRef.Hand.Remove(card);
        Round.CurrentCardsOnTable.Add(card);
        // Check for meld announcement
        if (card.Rank == CardRank.Queen && 
            playerRef.Hand.Any(c => c.Suit == card.Suit && c.Rank == CardRank.King))
        {
            Round.TrumpSuit = card.Suit;
            //todo Round.TeamXTrumps += GetThrumpPoints(card.Color);
        }
        
        AdvanceTurn();
        
        if (Round.CurrentCardsOnTable.Count == 4)
        {
            CompleteTake();
        }
    }

    public bool CanPlay(ICard card, ICard stackTop)
    {
        //todo musi przebić?
        if (card.Suit != stackTop.Suit)
        {
            return (card.Suit == Round.TrumpSuit);
        }
        return true;
    }

    private void CompleteTake()
    {
        var winner = DetermineTakeWinner();
        // Dodaj punkty za lewę
        int trickPoints = Round.CurrentCardsOnTable.Sum(card => card.Points);
        if (winner == Player1 || winner == Player3)
            PointsTeam1 += trickPoints;
        else
            PointsTeam2 += trickPoints;

        // Wyczyszczenie stołu
        Round.CurrentCardsOnTable.Clear();

        // Ustaw kolejność graczy tak, by zwycięzca zaczynał następną lewę
        Round.TurnQueue.Clear();
        StartQueueFromPlayer(winner);

        // Sprawdź czy wszyscy gracze mają puste ręce (koniec rundy)
        if (Player1.Hand.Count == 0 && Player2.Hand.Count == 0 && Player3.Hand.Count == 0 && Player4.Hand.Count == 0)
        {
            // Zakończ rundę, policz punkty, ogłoś zwycięzcę itp.
            EndRound();
        }
    }

    private IPlayer DetermineTakeWinner()
    {
        var cardsOnTable = Round.CurrentCardsOnTable;
        var playersOrder = Round.TurnQueue.ToArray();
        int winnerIdx = 0;
        ICard highestCard = cardsOnTable[0];
        CardSuit? trump = Round.TrumpSuit;
        for (int i = 1; i < cardsOnTable.Count; i++)
        {
            var card = cardsOnTable[i];
            if ((card.Suit == highestCard.Suit && card.Points > highestCard.Points) ||
                (trump.HasValue && card.Suit == trump && highestCard.Suit != trump))
            {
                highestCard = card;
                winnerIdx = i;
            }
        }
        // Zwróć gracza, który zagrał zwycięską kartę
        return playersOrder[winnerIdx];
    }

    private int GetPlayerIndex(IPlayer player)
    {
        if (player == Player1) return 0;
        if (player == Player2) return 1;
        if (player == Player3) return 2;
        if (player == Player4) return 3;
        throw new ArgumentException("Unknown player");
    }

    private IPlayer GetPlayerByIndex(int idx)
    {
        return idx switch
        {
            0 => Player1,
            1 => Player2,
            2 => Player3,
            3 => Player4,
            _ => throw new ArgumentException("Invalid player index")
        };
    }

    private void EndRound()
    {
        _logger.LogInformation("Ending round");
        // Tu możesz dodać logikę podsumowania rundy, sprawdzenia zakładów, ogłoszenia zwycięzcy itd.
        // Przykład:
        // - sprawdź czy drużyna, która wygrała licytację, zdobyła wymaganą liczbę punktów
        // - zresetuj stan gry lub przygotuj do nowej rundy
    }
    private static List<ICard> ShuffleDeck( List<ICard> deck)
    {
        var rng = new Random();
        var n = deck.Count;
        while (n > 1)
        {
            n--;
            var k = rng.Next(n + 1);
            ( deck[n], deck[k] ) = ( deck[k], deck[n] );
        }
        return deck;
    }
    
    private List<ICard> InitCards()
    {
        _logger.LogInformation("Initializing TableService");
        var tempDeck = new List<ICard>();
        foreach (var color in Enum.GetValues<CardSuit>())
        {
            foreach (var name in Enum.GetValues<CardRank>())
            {
                if (name is CardRank.As or CardRank.King or CardRank.Queen or CardRank.Jack or CardRank.Ten or CardRank.Nine)
                {
                    tempDeck.Add(new Card(name, color));
                }
            }
        }

        return tempDeck;
    }
}