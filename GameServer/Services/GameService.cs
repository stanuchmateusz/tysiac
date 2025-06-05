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

    public bool isGameFinished;
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
        
        Round = new Round();
        Round.TurnQueue = new Queue<IPlayer>();
        Round.TurnQueue.Enqueue(Player1);
        Round.TurnQueue.Enqueue(Player2);
        Round.TurnQueue.Enqueue(Player3);
        Round.TurnQueue.Enqueue(Player4);
        Round.OrginalTurnQueue = new Queue<IPlayer>(Round.TurnQueue);
        Round.CurrentBidWinner = Player4;
        
    }
    private void CreateAndInitNewRound(IPlayer startingPlayer)
    {
        _logger.LogInformation("Creating new round");
        Round = new Round();
        StartQueueFromPlayer(startingPlayer);
        Round.CurrentBidWinner = startingPlayer;
        _deck.Clear(); //should be empty at the start of the round but clear anyway
        ShuffleDeck(
                InitCards()
            )
            .ForEach(card => _deck.Push(card));
        DealCards();
    }
    
    private void StartQueueFromPlayer(IPlayer player)
    {
        Round.TurnQueue.Enqueue(player);
        Round.TurnQueue.Enqueue(GetLeftPlayer(player));
        Round.TurnQueue.Enqueue(GetTeammate(player));
        Round.TurnQueue.Enqueue(GetRightPlayer(player));
        Round.OrginalTurnQueue = new Queue<IPlayer>(Round.TurnQueue);
    }
    private void AdvanceTurn()
    {
        _logger.LogInformation("Dequeuing player {Player}", Round.TurnQueue.Peek());
        Round.TurnQueue.Dequeue();
        _logger.LogInformation(" {X} players left in turn queue", Round.TurnQueue.Count);
        
        if (GamePhase.CardDistribution == CurrentPhase)
        {
            Round.TurnQueue.Clear();
            Round.TurnQueue.Enqueue(Round.CurrentBidWinner);
        }
        if (Round.TurnQueue.Count == 0)
        {
            if (GamePhase.Auction == CurrentPhase)
            {
                //todo usunąć osoby które już passowały
                if (Round.Pass.Count != 3) 
                    StartQueueFromPlayer(Round.CurrentBidWinner);
            }
            
            if (CurrentPhase == GamePhase.Playing)
            {
                _logger.LogInformation("GamePhase.Playing");
                if (Round.CurrentCardsOnTable.Count < 4)
                {
                    // nie ma jeszcze 4 kart na stole
                    //kolejka jest pusta, ale są karty na stole (case zaraz po zmianie stare na Playing
                    _logger.LogInformation("Queue is empty, but there are cards on the table ( this should be called only after card distribution)");
                    StartQueueFromPlayer(Round.CurrentBidWinner);
                    Round.TurnQueue.Dequeue();
                }
                else
                {
                    // 4 cards on the table, we need to complete the take
                    CompleteTake();
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
    
    private int GetTeamRoundPoints(IPlayer player, bool enemy = false)
    {
        if (player == Player1 || player == Player3)
        {
            return enemy ? Round.Team2Points : Round.Team1Points;
        }
        //team 2
        return enemy ? Round.Team1Points : Round.Team2Points;
    }
    
    public GameContext GetGameState()
    {
        return new GameContext(
            Round.TurnQueue.Peek(),
                CurrentPhase,
                Round.CurrentCardsOnTable,
                Round.TrumpSuit.GetValueOrDefault(),
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
            GetTeamPoints(player, true), GetTeamRoundPoints(player), GetTeamRoundPoints(player, true));
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
        
        var firstCardOnTheTable = Round.CurrentCardsOnTable.FirstOrDefault();
        var lastCardOnTheTable = Round.CurrentCardsOnTable.LastOrDefault();
        
        if (firstCardOnTheTable != null && !CanPlay(card, firstCardOnTheTable, playerRef.Hand))
        {
            throw new InvalidOperationException("Cannot play that card");
        }
        playerRef.Hand.Remove(card);
        
        // Check for meld announcement
        _logger.LogInformation("Putting {Card} on {LastCard} ", card, lastCardOnTheTable);
        if (
            (
                card.Rank == CardRank.Queen &&
                playerRef.Hand.Any(c => c.Suit == card.Suit && c.Rank == CardRank.King) && 
                firstCardOnTheTable == null 
                ) || (
                lastCardOnTheTable != null &&
                card.Rank == CardRank.King  &&
                card.Suit == lastCardOnTheTable.Suit &&
                lastCardOnTheTable.Rank == CardRank.Queen
                )
            )
        {
            _logger.LogInformation("New Trump Suit announced by player {Player} with card {Card}", playerRef.Nickname, card.ShortName);
            Round.TrumpSuit = card.Suit;
            if (isPlayerInTeam1(playerRef))
                Round.Team1Trumps += GetTrumpPoints(card.Suit);
            else
                Round.Team2Trumps += GetTrumpPoints(card.Suit);
        }
        Round.CurrentCardsOnTable.Add(card);
        _logger.LogInformation("Player {Player} played card {Card}, and there are {X} cards on the table", playerRef.Nickname, card.ShortName,Round.CurrentCardsOnTable.Count);
        if (Round.CurrentCardsOnTable.Count == 4)
        {
            CompleteTake();
        }
        else
        {
            AdvanceTurn();
        }
    }

    private static int GetTrumpPoints(CardSuit cardSuit)
    {
        return cardSuit switch
        {
            CardSuit.Hearts => 100,
            CardSuit.Diamonds => 80,
            CardSuit.Clubs => 60,
            CardSuit.Spades => 40,
            _ => throw new ArgumentException("Invalid suit for trump points")
        };
    }

    public bool CanPlay(ICard cardToPlay, ICard firstOnStack,List<ICard> playersCards)
    {
        var isSuitValid = cardToPlay.Suit == firstOnStack.Suit;
        if (isSuitValid)
        {
            _logger.LogInformation("Card {Card} is valid to play - suit is ok", cardToPlay.ShortName);
            return true;
        }
        var isTrumpValid = cardToPlay.Suit == Round.TrumpSuit;
        if (isTrumpValid)
        {
            _logger.LogInformation("Card {Card} is valid to play - trump suit is ok", cardToPlay.ShortName);
            return true;
        }
        var noOtherOption =
            playersCards.All(c => c.Suit != firstOnStack.Suit) &&
            playersCards.All(c => c.Suit != Round.TrumpSuit);
                 //||
        if (noOtherOption)
        {
            _logger.LogInformation("Card {Card} is valid to play - no other options", cardToPlay.ShortName);
            return true;
        }
        return isSuitValid || isTrumpValid || noOtherOption;
    }

    private void CompleteTake()
    {
        var winner = DetermineTakeWinner(); //tu coś śmierdzi, bo albo złego ustala albo źle kolejka się robi
        
        var trickPoints = Round.CurrentCardsOnTable.Sum(card => card.Points);
        if (isPlayerInTeam1(winner))
        {
            Round.Team1Points += trickPoints ;
        }
        else
            Round.Team2Points += trickPoints;

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
        var playersOrder = Round.OrginalTurnQueue.ToArray();
        var trump = Round.TrumpSuit;
        int winnerIdx = 0;
        ICard? highestTrump = null;
        int highestTrumpIdx = -1;
        ICard highestCard = cardsOnTable[0];
        // Szukamy najwyższego trumpa
        if (trump.HasValue)
        {
            for (int i = 0; i < cardsOnTable.Count; i++)
            {
                if (cardsOnTable[i].Suit == trump)
                {
                    if (highestTrump == null || cardsOnTable[i].Points > highestTrump.Points)
                    {
                        highestTrump = cardsOnTable[i];
                        highestTrumpIdx = i;
                    }
                }
            }
            if (highestTrump != null)
            {
                // Ktoś zagrał trumpa, wygrywa najwyższy trump
                return playersOrder[highestTrumpIdx];
            }
        }
        // Jeśli nie ma trumpa, wygrywa najwyższa karta w kolorze pierwszej karty
        var leadSuit = cardsOnTable[0].Suit;
        for (int i = 1; i < cardsOnTable.Count; i++)
        {
            if (cardsOnTable[i].Suit == leadSuit && cardsOnTable[i].Points > highestCard.Points)
            {
                highestCard = cardsOnTable[i];
                winnerIdx = i;
            }
        }
        return playersOrder[winnerIdx];
    }
    
    private void EndRound()
    {
        _logger.LogInformation("Ending round");
        // Tu możesz dodać logikę podsumowania rundy, sprawdzenia zakładów, ogłoszenia zwycięzcy itd.
        // Przykład:
        // - sprawdź czy drużyna, która wygrała licytację, zdobyła wymaganą liczbę punktów
        // - zresetuj stan gry lub przygotuj do nowej rundy
        _logger.LogInformation("Round ended. Team 1 points: {PointsTeam1}, Team 2 points: {PointsTeam2}", Round.Team1Points, Round.Team2Points);
        //sprawdź kto wygrał aukcję
        var betWinner = Round.CurrentBidWinner;
        if (isPlayerInTeam1(betWinner))
        {
            var finalPoints = Round.Team1Points + Round.Team1Trumps;
            if (finalPoints >= Round.CurrentBet)
            {
                _logger.LogInformation("Team 1 managed to get required points {Points}/{BetAmount} ",finalPoints ,Round.CurrentBet);
                PointsTeam1 += Round.CurrentBet;
            }
            else
            {
                _logger.LogInformation("Team 2 failed to get required points {Points}/{BetAmount} ",finalPoints ,Round.CurrentBet);
                PointsTeam1 -= Round.CurrentBet;
            }
            PointsTeam2 += Round.Team2Points;
        }
        else
        {
           var finalPoints = Round.Team2Points + Round.Team2Trumps;
            if (finalPoints >= Round.CurrentBet)
            {
                _logger.LogInformation("Team 2 managed to get required points {Points}/{BetAmount} ",finalPoints ,Round.CurrentBet);
                PointsTeam2 += Round.CurrentBet;
            }
            else
            {
                _logger.LogInformation("Team 1 failed to get required points {Points}/{BetAmount} ",finalPoints ,Round.CurrentBet);
                PointsTeam2 -= Round.CurrentBet;
            }
            PointsTeam1 += Round.Team1Points;
        }
        _logger.LogInformation("Points after round: Team 1: {PointsTeam1}, Team 2: {PointsTeam2}", PointsTeam1, PointsTeam2);
        if (PointsTeam1 >= 1000 || PointsTeam2 >= 1000) //todo zmień na 1000 potem
        {
            _logger.LogInformation("Game over! Team 1 points: {PointsTeam1}, Team 2 points: {PointsTeam2}", PointsTeam1, PointsTeam2);
            FinishGame();
            return;
        }
        
        CurrentPhase = GamePhase.Auction;
        _logger.LogInformation("Game reset to start phase");
        var lastRoomStartPlayer = Round.OrginalTurnQueue.First();
        CreateAndInitNewRound(lastRoomStartPlayer);
        _logger.LogInformation("New round created, starting player: {Player}", Round.TurnQueue.FirstOrDefault());
    }

    private void FinishGame()
    {
        CurrentPhase = GamePhase.GameOver;
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
    private bool isPlayerInTeam1(IPlayer player)
    {
        return Players.Contains(player) && (player == Player1 || player == Player3);
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