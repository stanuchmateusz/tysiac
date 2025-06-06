using GameServer.Models;
using GameServer.Models.Context;
using GameServer.Models.Enums;
using GameServer.Models.impl;

namespace GameServer.Services;

public class GameService 
{
    private const int WinRequiredPoints = 1000;
    
    private readonly ILogger<GameService> _logger;
    
    public HashSet<IPlayer> Players;
    private IPlayer Player1 { get; set; }
    private IPlayer Player2 { get; set; }
    private IPlayer Player3 { get; set; }
    private IPlayer Player4 { get; set; }

    private Round Round { get; set; }

    private readonly Stack<ICard> _deck = [];

    private int _pointsTeam1 = 0;
    private int _pointsTeam2 = 0;

    private GamePhase CurrentPhase { get; set; } = GamePhase.Start;
    public string RoomCode { get; }
    public int DisconnectedPlayersCount { get; set; } = 0;
    
    public GameService(LobbyContext lobbyCtx, ILogger<GameService> logger)
    {
        Players = lobbyCtx.Players.ToHashSet();
        RoomCode = lobbyCtx.Code;
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
        
        Round = new Round
        {
            TurnQueue = new Queue<IPlayer>()
        };
        Round.TurnQueue.Enqueue(Player1);
        Round.TurnQueue.Enqueue(Player2);
        Round.TurnQueue.Enqueue(Player3);
        Round.TurnQueue.Enqueue(Player4);
        Round.OrginalTurnQueue = new Queue<IPlayer>(Round.TurnQueue);
        Round.CurrentBidWinner = Player4;
        
    }
    public void PauseGame()
    {
        DisconnectedPlayersCount++;
        _logger.LogInformation("[{Room}] Game paused", RoomCode);
    }
    
    public void TryResumeGame()
    {
        DisconnectedPlayersCount--;
        if (DisconnectedPlayersCount > 0)
        {
            _logger.LogInformation("[{Room}] Game cannot be resumed, {X} players are still disconnected", RoomCode, DisconnectedPlayersCount);
            return;
        }
        _logger.LogInformation("[{Room}] Game resumed", RoomCode);
    }
    
    private void CreateAndInitNewRound(IPlayer startingPlayer)
    {
        _logger.LogInformation("[{Room}] Creating new round", RoomCode);
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
        _logger.LogDebug("[{Room}] Dequeuing player {Player}",RoomCode, Round.TurnQueue.Peek());
        Round.TurnQueue.Dequeue();
        _logger.LogDebug("[{Room}] {X} players left in turn queue",RoomCode,Round.TurnQueue.Count);
        
        if (GamePhase.CardDistribution == CurrentPhase)
        {
            _logger.LogDebug("[{Room}] GamePhase.CardDistribution", RoomCode);
            Round.TurnQueue.Clear();
            Round.TurnQueue.Enqueue(Round.CurrentBidWinner);
        }
        if (Round.TurnQueue.Count == 0)
        {
            switch (CurrentPhase)
            {
                case GamePhase.Auction:
                {
                    _logger.LogDebug("[{Room}] GamePhase.Auction", RoomCode);
                    if (Round.Pass.Count != 3) 
                    {
                        StartQueueFromPlayer(Round.OrginalTurnQueue.First());
                        // filter the queue - remove players that passed
                        Round.TurnQueue = new Queue<IPlayer>(Round.TurnQueue.ToArray().Where(p => !Round.Pass.Contains(p)));
                        
                        _logger.LogDebug("[{Room}] Starting queue from player {Player} with passed players {Players}", RoomCode, Round.CurrentBidWinner, Round.Pass);
                    }
                    break;
                }
                case GamePhase.Playing:
                {
                    _logger.LogDebug("[{Room}] GamePhase.Playing", RoomCode);
                    if (Round.CurrentCardsOnTable.Count < 4)
                    {
                        //queue is empty and there aren't 4 cards on the table
                        //(case after change of gamePhase From Card dist to Playing)
                        _logger.LogDebug("[{Room}] Queue is empty, but there are cards on the table ( this should be called only after card distribution)", RoomCode);
                        StartQueueFromPlayer(Round.CurrentBidWinner);
                        Round.TurnQueue.Dequeue();
                    }
                    else
                    {
                        // 4 cards on the table, we need to complete the take
                        CompleteTake();
                    }

                    break;
                }
                case GamePhase.Start:
                case GamePhase.CardDistribution:
                case GamePhase.GameOver:
                    break;
                default:
                    throw new ArgumentOutOfRangeException("Unknown game phase: " + CurrentPhase);
            }
        }
        _logger.LogDebug("[{Room}] Turn advanced to player {Player}" ,RoomCode,Round.TurnQueue.Peek());
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
            return enemy ? _pointsTeam2 : _pointsTeam1;
        }
        //team 2
        return enemy ? _pointsTeam1 : _pointsTeam2;
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
                Round.CurrentBet,
                DisconnectedPlayersCount
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
        _logger.LogDebug("[{Room}] Player {Player} passed", RoomCode ,player);
        if (Round.Pass.Count == 3)
        {
            var winner = Round.CurrentBidWinner;
            _logger.LogDebug("[{Room}] Player {Player} won auction", RoomCode,winner);
            MoveMusikToBindWinner(winner);
            CurrentPhase = GamePhase.CardDistribution;
        }
        AdvanceTurn();
    }
    
    private void MoveMusikToBindWinner(IPlayer winner)
    {
        winner.Hand.AddRange(Round.Musik);
    }
    
    public void DistributeCard(IPlayer distributor, string cardToGiveShortName, IPlayer target)
    {
        if (CurrentPhase != GamePhase.CardDistribution)
            throw new InvalidOperationException("Invalid State!");

        if (distributor == target)
            throw new InvalidOperationException("Can't give yourself a card!");

        var distributorRef = distributor;
        var targetRef = target;
        if (distributorRef == null || targetRef == null)
            throw new InvalidOperationException("Invalid player reference");
        var cardToGive = distributorRef.Hand.FirstOrDefault(c => c.ShortName == cardToGiveShortName);
        
        if (cardToGive == null)
            throw new InvalidOperationException($"{distributorRef} doesn't have a card {cardToGive}");

        distributorRef.Hand.Remove(cardToGive);
        targetRef.Hand.Add(cardToGive);
        
        // check if all cards are distributed
        if (distributorRef.Hand.Count == 6)
        {
            // All players should have 6 cards, move to playing phase
            CurrentPhase = GamePhase.Playing;
            _logger.LogInformation("[{Room}] All cards distributed, moving to playing phase", RoomCode);
        }
        else
        {
            AdvanceTurn();
        }
    }
    
    public void PlayCard(IPlayer player, ICard card)
    {
        if (player != Round.TurnQueue.Peek())
            throw new InvalidOperationException("Not your turn");
        
        if (!player.Hand.Contains(card))
            throw new InvalidOperationException("Card not in hand");
        
        var firstCardOnTheTable = Round.CurrentCardsOnTable.FirstOrDefault();
        var lastCardOnTheTable = Round.CurrentCardsOnTable.LastOrDefault();
        
        if (firstCardOnTheTable != null && !CanPlay(card, firstCardOnTheTable, player.Hand))
        {
            throw new InvalidOperationException("Cannot play that card");
        }
        player.Hand.Remove(card);
        
        // Check for meld announcement
        _logger.LogDebug("[{Room}] {Player} is putting {Card} on {LastCard} ", RoomCode,player ,card, lastCardOnTheTable);
        if (
            (
                card.Rank == CardRank.Queen &&
                player.Hand.Any(c => c.Suit == card.Suit && c.Rank == CardRank.King) && 
                firstCardOnTheTable == null 
                ) || (
                lastCardOnTheTable != null &&
                card.Rank == CardRank.King  &&
                card.Suit == lastCardOnTheTable.Suit &&
                lastCardOnTheTable.Rank == CardRank.Queen
                )
            )
        {
            _logger.LogDebug("[{Room}] New Trump Suit announced by player {Player} with card {Card}", RoomCode,player.Nickname, card.ShortName);
            Round.TrumpSuit = card.Suit;
            if (IsPlayerInTeam1(player))
                Round.Team1Trumps += GetTrumpPoints(card.Suit);
            else
                Round.Team2Trumps += GetTrumpPoints(card.Suit);
        }
        Round.CurrentCardsOnTable.Add(card);
        _logger.LogDebug("[{Room}] Player {Player} played card {Card}, and there are {X} cards on the table", RoomCode,player.Nickname, card.ShortName,Round.CurrentCardsOnTable.Count);
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
            _logger.LogDebug("[{Room}] Card {Card} is valid to play - suit is ok",RoomCode, cardToPlay.ShortName);
            return true;
        }
        var isTrumpValid = cardToPlay.Suit == Round.TrumpSuit;
        if (isTrumpValid)
        {
            _logger.LogDebug("[{Room}] Card {Card} is valid to play - trump suit is ok",RoomCode, cardToPlay.ShortName);
            return true;
        }
        var noOtherOption =
            playersCards.All(c => c.Suit != firstOnStack.Suit) &&
            playersCards.All(c => c.Suit != Round.TrumpSuit);
        
        if (!noOtherOption) return false;
            _logger.LogDebug("[{Room}] Card {Card} is valid to play - no other options",RoomCode, cardToPlay.ShortName);
        return true;
    }
    
    private static int RoundTo10(int value)
    {
        return ((value + 5) / 10) * 10;
    }
    private void CompleteTake()
    {
        var winner = DetermineTakeWinner();
        
        var trickPoints = Round.CurrentCardsOnTable.Sum(card => card.Points);
        if (IsPlayerInTeam1(winner))
        {
            Round.Team1Points += trickPoints ;
        }
        else
        {
            Round.Team2Points += trickPoints;
        }

        // Clear the current cards on the table 
        Round.CurrentCardsOnTable.Clear();

        // Set the queue that the winner starts the next turn
        Round.TurnQueue.Clear();
        StartQueueFromPlayer(winner);

        // check if all players have played their cards
        if (Player1.Hand.Count == 0 &&
            Player2.Hand.Count == 0 &&
            Player3.Hand.Count == 0 &&
            Player4.Hand.Count == 0)
        {
            EndRound();
        }
    }

    private IPlayer DetermineTakeWinner()
    {
        var cardsOnTable = Round.CurrentCardsOnTable;
        var playersOrder = Round.OrginalTurnQueue.ToArray();
        var trump = Round.TrumpSuit;
        var winnerIdx = 0;
        ICard? highestTrump = null;
        var highestTrumpIdx = -1;
        var highestCard = cardsOnTable[0];
        // First card on the table determines the lead suit
        if (trump.HasValue)
        {
            for (var i = 0; i < cardsOnTable.Count; i++)
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
                // If there is a trump card, the winner is the player with the highest trump
                return playersOrder[highestTrumpIdx];
            }
        }
        //If there is no trump, we need to find the highest card in the lead suit
        var leadSuit = cardsOnTable[0].Suit;
        for (var i = 1; i < cardsOnTable.Count; i++)
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
        _logger.LogInformation("[{Room}]  Round ended. Team 1 points: {PointsTeam1}, Team 2 points: {PointsTeam2}",RoomCode, Round.Team1Points, Round.Team2Points);
        // Check if the team that won the round has enough points to win the bet
        var betWinner = Round.CurrentBidWinner;
        if (IsPlayerInTeam1(betWinner))
        {
            var finalPoints = RoundTo10(Round.Team1Points + Round.Team1Trumps);
            if (finalPoints >= Round.CurrentBet)
            {
                _logger.LogDebug("[{Room}] Team 1 managed to get required points {Points}/{BetAmount} ",RoomCode, finalPoints ,Round.CurrentBet);
                _pointsTeam1 += Round.CurrentBet;
            }
            else
            {
                _logger.LogDebug("[{Room}] Team 2 failed to get required points {Points}/{BetAmount} ",RoomCode ,finalPoints ,Round.CurrentBet);
                _pointsTeam1 -= Round.CurrentBet;
            }
            _pointsTeam2 += Round.Team2Points + Round.Team2Trumps;
        }
        else
        {
           var finalPoints = RoundTo10( Round.Team2Points + Round.Team2Trumps);
            if (finalPoints >= Round.CurrentBet)
            {
                _logger.LogDebug("[{Room}] Team 2 managed to get required points {Points}/{BetAmount} ",RoomCode,finalPoints ,Round.CurrentBet);
                _pointsTeam2 += Round.CurrentBet;
            }
            else
            {
                _logger.LogDebug("[{Room}] Team 1 failed to get required points {Points}/{BetAmount} ", RoomCode,finalPoints ,Round.CurrentBet);
                _pointsTeam2 -= Round.CurrentBet;
            }
            _pointsTeam1 += Round.Team1Points + Round.Team1Trumps;
        }
        
        _logger.LogInformation("[{Room}] Points after round: Team 1: {PointsTeam1}, Team 2: {PointsTeam2}",RoomCode, _pointsTeam1, _pointsTeam2);
        if (_pointsTeam1 >= WinRequiredPoints || _pointsTeam2 >= WinRequiredPoints) 
        {
            _logger.LogInformation("[{Room}] Game over! Team 1 points: {PointsTeam1}, Team 2 points: {PointsTeam2}", RoomCode,_pointsTeam1, _pointsTeam2);
            FinishGame();
            return;
        }
        
        if (_pointsTeam1 > 900) 
        { 
            _pointsTeam1 = 900;
        }
        if (_pointsTeam2 > 900) 
        {
            _pointsTeam2 = 900;
        }
        
        CurrentPhase = GamePhase.Auction;
        _logger.LogInformation("[{Room}] Game reset to start phase", RoomCode);
        var lastRoomStartPlayer = Round.OrginalTurnQueue.First();
        CreateAndInitNewRound(lastRoomStartPlayer);
        _logger.LogInformation("[{Room}] New round created, starting player: {Player}",RoomCode, Round.TurnQueue.FirstOrDefault());
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
    
    private bool IsPlayerInTeam1(IPlayer player)
    {
        return Players.Contains(player) && (player == Player1 || player == Player3);
    }
    
    private List<ICard> InitCards()
    {
        _logger.LogInformation("[{Room}] Initializing TableService", RoomCode);
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