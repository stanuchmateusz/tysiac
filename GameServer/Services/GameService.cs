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
        
        Player1.Team = Team.Team1;
        Player2.Team = Team.Team2;
        Player3.Team = Team.Team1;
        Player4.Team = Team.Team2;
        
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
    
    /// <summary>
    /// Pauses the game and increments the count of disconnected players.
    /// </summary>
    public void PauseGame()
    {
        DisconnectedPlayersCount++;
        _logger.LogInformation("[{Room}] Game paused", RoomCode);
    }
    
    /// <summary>
    /// Attempts to resume a paused game.
    /// Decrements the count of disconnected players. If all players are reconnected (DisconnectedPlayersCount is 0),
    /// the game is resumed. Otherwise, it remains paused.
    /// </summary>
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
                        //todo pozwolić na przesłanie info o 4 karcie żeby wyświetlić na ui
                        // i potem timeout 2 sec i znów notyfikacja 
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
        var teammate = Players.FirstOrDefault(p => p.Team == player.Team && p.Id != player.Id);
        if (teammate == null)
            throw new ArgumentException("Cannot find teammate for player " + player);
        return teammate;
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

        if (player.Team == Team.Team1)
        {
            return enemy ? _pointsTeam2 : _pointsTeam1;
        }
        //team 2
        return enemy ? _pointsTeam1 : _pointsTeam2;
    }
    
    private int GetTeamRoundPoints(IPlayer player, bool enemy = false)
    {
        if (player.Team == Team.Team1)
        {
            return enemy ? Round.Team2Points : Round.Team1Points;
        }
        //team 2
        return enemy ? Round.Team1Points : Round.Team2Points;
    }
    
    /// <summary>
    /// Retrieves the current overall state of the game.
    /// This includes information about whose turn it is, the current game phase,
    /// cards currently on the table, the trump suit, the current bid, and the count of disconnected players.
    /// </summary>
    /// <returns>A <see cref="GameContext"/> object representing the current state of the game.</returns>
    /// <exception cref="InvalidOperationException">Thrown if the turn queue is empty, which can happen in certain uninitialized states.</exception>
    public GameContext GetGameState()
    {
        return new GameContext(
            Round.TurnQueue.Peek(),
                CurrentPhase,
                Round.CurrentCardsOnTable,
                Round.TrumpSuit.GetValueOrDefault(),
                Round.CurrentBet,
                DisconnectedPlayersCount,
                Round.Pass
            );
    }
    
    /// <summary>
    /// Retrieves the context for a specific player, including their identity, teammate, adjacent players,
    /// and current team scores (both overall and for the current round).
    /// </summary>
    /// <param name="player">The player for whom to get the user context.</param>
    /// <returns>A <see cref="UserContext"/> object containing player-specific game state information.</returns>
    /// <exception cref="ArgumentNullException">Thrown if the input <paramref name="player"/> is null.</exception>
    /// <exception cref="ArgumentException">Thrown if the <paramref name="player"/>'s teammate cannot be found (which implies an invalid game state).</exception>
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
    
    /// <summary>
    /// Retrieves a player from the current game room based on their connection ID.
    /// </summary>
    /// <param name="contextConnectionId">The connection ID of the player to find.</param>
    /// <returns>The <see cref="IPlayer"/> object if found; otherwise, <c>null</c>.</returns>
    public IPlayer? GetPlayerFromRoom(string contextConnectionId)
    {
        return Players.FirstOrDefault(p => p.ConnectionId == contextConnectionId);
    }
    
    /// <summary>
    /// Starts the game if there are exactly four players.
    /// Deals cards to all players and transitions the game to the <c>GamePhase.Auction</c> phase.
    /// </summary>
    /// <exception cref="InvalidOperationException">Thrown if the number of players is not equal to 4.</exception>
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
    
    /// <summary>
    /// Allows a player to place a bid during the auction phase.
    /// The bid must be higher than the current highest bid.
    /// If the bid is valid, the player becomes the current highest bidder, and the turn is advanced.
    /// This method should only be used during the <c>GamePhase.Auction</c>.
    /// </summary>
    /// <param name="player">The player placing the bid.</param>
    /// <param name="bid">The amount of the bid.</param>
    /// <exception cref="ArgumentException">Thrown if the bid is not higher than the current highest bid.</exception>
    public void PlaceBid(IPlayer player, int bid)
    {
        if (bid <= Round.CurrentBet) throw new ArgumentException("Bid must be higher");
        Round.CurrentBet = bid;
        Round.CurrentBidWinner = player;
        
        AdvanceTurn();
    }
    
    /// <summary>
    /// Allows a player to pass their turn during the auction phase.
    /// If three players have passed, the auction ends, the current highest bidder wins,
    /// receives the 'musik' cards, and the game transitions to the <c>GamePhase.CardDistribution</c> phase.
    /// The turn is advanced after the pass. This method should only be used during the <c>GamePhase.Auction</c>.
    /// </summary>
    /// <param name="player">The player who is passing the bid.</param>
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
    
    /// <summary>
    /// Allows the auction winner (distributor) to give one of their surplus cards to another player (target).
    /// This method is used exclusively during the <c>GamePhase.CardDistribution</c> phase.
    /// After successfully transferring a card, if the distributor is left with 6 cards, the game phase changes to <c>GamePhase.Playing</c>.
    /// Otherwise, the turn remains with the distributor to continue distributing cards.
    /// </summary>
    /// <param name="distributor">The player distributing the card (the auction winner).</param>
    /// <param name="cardToGiveShortName">The short name of the card to be given.</param>
    /// <param name="target">The player who will receive the card.</param>
    /// <exception cref="InvalidOperationException">Thrown when:
    /// - The current game phase is not <c>GamePhase.CardDistribution</c>.
    /// - The distributor attempts to give a card to themselves.
    /// - It is not the distributor's turn.
    /// - The distributor has already distributed all their surplus cards (has 6 or fewer cards).
    /// - The distributor does not have the specified card in their hand.
    /// </exception>
    public void DistributeCard(IPlayer distributor, string cardToGiveShortName, IPlayer target)
    {
        if (CurrentPhase != GamePhase.CardDistribution)
            throw new InvalidOperationException("Invalid State!");

        if (distributor == target)
            throw new InvalidOperationException("Can't give yourself a card!");
        
        if (distributor != Round.TurnQueue.Peek())
            throw new InvalidOperationException("It's not your turn");
        
        if (distributor.Hand.Count <= 6)
        {
            throw new InvalidOperationException("You have already distributed all your cards");
        }
        
        var cardToGive = distributor.Hand.FirstOrDefault(c => c.ShortName == cardToGiveShortName);
        
        if (cardToGive == null)
            throw new InvalidOperationException($"{distributor} doesn't have a card {cardToGive}");

        distributor.Hand.Remove(cardToGive);
        target.Hand.Add(cardToGive);
        
        // check if all cards are distributed
        if (distributor.Hand.Count == 6)
        {
            // All players should have 6 cards, move to playing phase
            CurrentPhase = GamePhase.Playing;
            _logger.LogDebug("[{Room}] All cards distributed, moving to playing phase", RoomCode);
        }
        else
        {
            AdvanceTurn();
        }
    }
    
    /// <summary>
    /// Plays a card, and advances the turn.
    /// Use Only in <c>GamePhase.Playing</c>. 
    /// <param name="player">Player that is playing the card</param>
    /// <param name="card">Card to play</param>
    ///  <exception cref="InvalidOperationException">
    ///  <list type="bullet">
    /// <item><term>Thrown when it's not the player's turn</term></item>
    /// <item><term>Thrown when player doesn't have the card on his hand </term></item>
    /// <item><term>Thrown when GamePhase is not <c>GamePhase.Playing</c></term></item>
    /// <item> <term>Thrown when card is not valid to play</term></item>
    /// </list>
    /// </exception>
    /// </summary>
    public void PlayCard(IPlayer player, ICard card)
    {
        if (player != Round.TurnQueue.Peek())
            throw new InvalidOperationException("Not your turn");
        
        if (!player.Hand.Contains(card))
            throw new InvalidOperationException("Card not in hand");

        if (CurrentPhase != GamePhase.Playing)
            throw new InvalidOperationException("Invalid gamePhase:" + CurrentPhase);
                
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
            if (Round.CurrentCardsOnTable.Count == 0) // announce trump right away
            {
                _logger.LogDebug("[{Room}] New Trump Suit announced by player {Player} with card {Card}", RoomCode,
                    player.Nickname, card.ShortName);
                Round.TrumpSuit = card.Suit;
                Round.SuitToTeam.Add(new Tuple<CardSuit, Team>(card.Suit,
                    player.Team ?? throw new ArgumentException("Team must be set at this point")));
            }
            else
            {
                _logger.LogDebug("[{Room}] New Trump will be announced next round",RoomCode);
                Round.QueuedTrumpSuit = card.Suit;
            }
        }
        Round.CurrentCardsOnTable.Add(card);
        _logger.LogDebug("[{Room}] Player {Player} played card {Card}, and there are {X} cards on the table", RoomCode,player.Nickname, card.ShortName,Round.CurrentCardsOnTable.Count);
        if (Round.CurrentCardsOnTable.Count == 4)
        {
            CompleteTake();
            //dequeue trump suit (if required)
            if (Round.QueuedTrumpSuit != null)
            {
                Round.TrumpSuit = Round.QueuedTrumpSuit;
                Round.QueuedTrumpSuit = null;
            }
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

    private bool CanPlay(ICard cardToPlay, ICard firstOnStack,List<ICard> playersCards)
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
        if (winner.Team == Team.Team1)
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

    private int TrumpPointsForTeam(Team team)
    {
        var trumps = Round.SuitToTeam.Where(x => x.Item2 == team);
        return trumps.Sum(tuple => GetTrumpPoints(tuple.Item1));
    }

    private void EndRound()
    {
        _logger.LogDebug("[{Room}]  Round ended. Team 1 points: {PointsTeam1}, Team 2 points: {PointsTeam2}",RoomCode, Round.Team1Points, Round.Team2Points);
        
        // Check if the team that won the round has enough points to win the bet
        var betWinner = Round.CurrentBidWinner;
        if (betWinner.Team == Team.Team1)
        {
            var finalPoints = RoundTo10(Round.Team1Points + TrumpPointsForTeam(Team.Team1));
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
            _pointsTeam2 += RoundTo10(Round.Team2Points + TrumpPointsForTeam(Team.Team2));
        }
        else
        {
           var finalPoints = RoundTo10( Round.Team2Points + TrumpPointsForTeam(Team.Team2));
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
            _pointsTeam1 += RoundTo10(Round.Team1Points + TrumpPointsForTeam(Team.Team1));
        }
        
        _logger.LogDebug("[{Room}] Points after round: Team 1: {PointsTeam1}, Team 2: {PointsTeam2}",RoomCode, _pointsTeam1, _pointsTeam2);

        if (
            (_pointsTeam1 >= WinRequiredPoints && Round.CurrentBidWinner.Team == Team.Team1) ||
            (_pointsTeam2 >= WinRequiredPoints && Round.CurrentBidWinner.Team == Team.Team2) || 
            _pointsTeam1 <= -WinRequiredPoints ||
            _pointsTeam2 <= -WinRequiredPoints
            ) 
        {
            _logger.LogInformation("[{Room}] Game over! Team 1 points: {PointsTeam1}, Team 2 points: {PointsTeam2}", RoomCode,_pointsTeam1, _pointsTeam2);
            FinishGame();
            return;
        }
        const int threshold = WinRequiredPoints - WinRequiredPoints / 10;
        if (_pointsTeam1 > threshold) 
        { 
            _pointsTeam1 = threshold;
        }
        if (_pointsTeam2 > threshold) 
        {
            _pointsTeam2 = threshold;
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