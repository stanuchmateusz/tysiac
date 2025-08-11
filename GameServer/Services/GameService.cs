using System.Collections.Immutable;
using GameServer.Models;
using GameServer.Models.Context;
using GameServer.Models.Enums;
using GameServer.Models.impl;
using GameServer.Utils;
using Serilog;

namespace GameServer.Services;

/// <summary>
/// Manages the core logic and state for a game of "Tysiąc".
/// This includes player management, turn progression, bidding, card play,
/// scoring, and overall game flow from start to finish.
/// </summary>
public class GameService
{
    private const int WinRequiredPoints = 1000;

    public readonly ImmutableHashSet<IPlayer> Players;
    private IPlayer Player1 { get; set; }
    private IPlayer Player2 { get; set; }
    private IPlayer Player3 { get; set; }
    private IPlayer Player4 { get; set; }

    private Round Round { get; set; }

    private readonly Stack<ICard> _deck = [];

    private Stack<int> _pointsTeam1 = new();
    private Stack<int> _pointsTeam2 = new();
    public GamePhase CurrentPhase { get; set; } = GamePhase.Start;
    public string RoomCode { get; }
    private HashSet<IPlayer> DisconnectedPlayers { get; set; } = [];
    private readonly int _humanPlayersCount;
    private readonly IGameSettings settings;

    public GameService(LobbyContext lobbyCtx)
    {
        RoomCode = lobbyCtx.Code;
        settings = lobbyCtx.GameSettings;
        Players = [.. lobbyCtx.Players];
        _humanPlayersCount = Players.Count(player => !player.IsBot);
        _pointsTeam1.Push(0);
        _pointsTeam2.Push(0);
        ShuffleDeck(
            InitCards()
            )
            .ForEach(card => _deck.Push(card));
        InitGame(lobbyCtx);
    }

    /// <summary>
    /// Checks if all human players have left (disconnected from) the game.
    /// </summary>
    /// <returns><c>true</c> if the number of disconnected players equals the total number of human players; otherwise, <c>false</c>.</returns>
    public bool AllPlayersLeft()
    {
        return DisconnectedPlayers.Count == _humanPlayersCount;
    }

    private void InitGame(LobbyContext lobbyCtx)
    {
        //set players sequence
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
    public void PauseGame(IPlayer player)
    {
        DisconnectedPlayers.Add(player);
        Log.Information("[{Room}] Game paused", RoomCode);
    }

    public void AbandoneGame(IPlayer player)
    {
        PauseGame(player);
        player.ConnectionId = "NULL";
        player.Nickname = "UNKNOWN";
        player.Id = "NULL";
    }

    /// <summary>
    /// Attempts to resume a paused game.
    /// Decrements the count of disconnected players. If all players are reconnected (DisconnectedPlayersCount is 0),
    /// the game is resumed. Otherwise, it remains paused.
    /// </summary>
    public void TryResumeGame(IPlayer player)
    {
        DisconnectedPlayers.Remove(player);
        if (DisconnectedPlayers.Count > 0)
        {
            Log.Information("[{Room}] Game cannot be resumed, {X} players are still disconnected", RoomCode, DisconnectedPlayers.Count);
            return;
        }
        Log.Information("[{Room}] Game resumed", RoomCode);
    }

    private void CreateAndInitNewRound(IPlayer startingPlayer)
    {
        Log.Information("[{Room}] Creating new round", RoomCode);
        Round = new Round();
        StartQueueFromPlayer(startingPlayer);
        Round.CurrentBidWinner = GetRightPlayer(startingPlayer);
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
        Log.Debug("[{Room}] Dequeuing player {Player}", RoomCode, Round.TurnQueue.Peek());
        Round.TurnQueue.Dequeue();
        Log.Debug("[{Room}] Queue: {X}", RoomCode, Round.TurnQueue);

        if (CurrentPhase is GamePhase.CardDistribution or GamePhase.IncreaseBet)
        {
            Log.Debug("[{Room}] GamePhase.{GamePhase}", RoomCode, CurrentPhase);
            Round.TurnQueue.Clear();
            Round.TurnQueue.Enqueue(Round.CurrentBidWinner);
        }
        if (Round.TurnQueue.Count == 0)
        {
            switch (CurrentPhase)
            {
                case GamePhase.Auction:
                    {
                        Log.Debug("[{Room}] GamePhase.Auction", RoomCode);
                        if (Round.Pass.Count < 3)
                        {
                            StartQueueFromPlayer(Round.OrginalTurnQueue.First());
                            // filter the queue - remove players that passed
                            Round.TurnQueue = new Queue<IPlayer>(Round.TurnQueue.ToArray().Where(p => !Round.Pass.Contains(p)));

                            Log.Debug("[{Room}] Starting queue from player {Player} with passed players {Players}", RoomCode, Round.CurrentBidWinner, Round.Pass);
                        }
                        break;
                    }
                case GamePhase.Playing:
                    {
                        Log.Debug("[{Room}] GamePhase.Playing", RoomCode);
                        if (Round.CurrentCardsOnTable.Count < 4)
                        {
                            //queue is empty and there aren't 4 cards on the table
                            //(case after change of gamePhase From Card dist to Playing)
                            Log.Debug("[{Room}] Queue is empty, but there are cards on the table ( this should be called only after card distribution)", RoomCode);
                            StartQueueFromPlayer(Round.CurrentBidWinner);
                            Round.TurnQueue.Dequeue();
                        }
                        else
                        {
                            throw new InvalidOperationException("Invalid state - you shouldn't be here if there are 4 cards on the table");
                        }

                        break;
                    }
                case GamePhase.Start:
                case GamePhase.CardDistribution:
                case GamePhase.GameOver:
                case GamePhase.ShowTable:
                case GamePhase.IncreaseBet:
                    break;
                default:
                    throw new ArgumentOutOfRangeException("Unknown game phase: " + CurrentPhase);
            }
        }
        Log.Debug("[{Room}] Turn advanced to player {Player}", RoomCode, Round.TurnQueue.Peek());
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

    private Stack<int> GetTeamPoints(IPlayer player, bool enemy = false)
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
                DisconnectedPlayers,
                Round.Pass,
                CurrentPhase == GamePhase.ShowTable ? DetermineTakeWinner() : null
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
        SortCards(Player1);
        SortCards(Player2);
        SortCards(Player3);
        SortCards(Player4);
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
    /// Allows a player to place a bid during the <c>GamePhase.Auction</c> or to increase their winning bid during <c>GamePhase.IncreaseBet</c>.
    /// The bid must be higher than the current highest bid.
    /// If the bid is valid, the player becomes the current highest bidder.
    /// If the game is in <c>GamePhase.IncreaseBet</c>, placing a bid also signifies the end of the bidding increase,
    /// and the game will transition to <c>GamePhase.CardDistribution</c>.
    /// The turn is advanced after the bid.
    /// </summary>
    /// <param name="player">The player placing or increasing the bid.</param>
    /// <param name="bid">The amount of the bid.</param>
    /// <exception cref="ArgumentException">Thrown if the bid is not higher than the current highest bid.</exception>
    /// <exception cref="InvalidOperationException">Thrown by the subsequent call to <c>PassBid</c> if <c>CurrentPhase</c> is <c>GamePhase.IncreaseBet</c> but other conditions within <c>PassBid</c> are not met (though this specific path in <c>PlaceBid</c> should ensure <c>PassBid</c> is called in a valid context for its <c>GamePhase.IncreaseBet</c> logic).</exception>
    public void PlaceBid(IPlayer player, int bid)
    {
        if (bid <= Round.CurrentBet) throw new ArgumentException("Bid must be higher");
        Round.CurrentBet = bid;
        Round.CurrentBidWinner = player;
        if (CurrentPhase == GamePhase.IncreaseBet)
        {
            PassBid(player);
        }
        AdvanceTurn();
    }

    /// <summary>
    /// Allows a player to pass during the <c>GamePhase.Auction</c> or <c>GamePhase.IncreaseBet</c> phases.
    /// If in <c>GamePhase.Auction</c> and three players have passed, the current highest bidder wins the auction,
    /// receives the 'musik' cards, their hand is sorted, and the game transitions to <c>GamePhase.IncreaseBet</c>.
    /// If in <c>GamePhase.IncreaseBet</c> (meaning the auction winner is passing on increasing their bid further),
    /// the game transitions to <c>GamePhase.CardDistribution</c>.
    /// The turn is advanced after the pass.
    /// </summary>
    /// <param name="player">The player who is passing.</param>
    /// <exception cref="InvalidOperationException">Thrown if the current game phase is not <c>GamePhase.Auction</c> or <c>GamePhase.IncreaseBet</c>.</exception>
    public void PassBid(IPlayer player)
    {
        if (CurrentPhase is not (GamePhase.Auction or GamePhase.IncreaseBet))
        {
            throw new InvalidOperationException("Invalid State!");
        }

        Round.Pass.Add(player);
        Log.Debug("[{Room}] Player {Player} passed", RoomCode, player);
        if (Round.Pass.Count == 3 && CurrentPhase == GamePhase.Auction)
        {
            var winner = Round.CurrentBidWinner;
            Log.Debug("[{Room}] Player {Player} won auction", RoomCode, winner);
            CurrentPhase = GamePhase.IncreaseBet;
            MoveMusikToBindWinner(winner);
            SortCards(winner);
        }
        else if (CurrentPhase == GamePhase.IncreaseBet)
        {
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
    /// - The target player already has 6 cards in their hand.
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
        
        if (target.Hand.Count > 5)
            throw new InvalidOperationException("Target player already has 6 cards");

        if (distributor.Hand.Count <= 6)            
            throw new InvalidOperationException("You have already distributed all your cards");

        var cardToGive = distributor.Hand.FirstOrDefault(c => c.ShortName == cardToGiveShortName);

        if (cardToGive == null)
            throw new InvalidOperationException($"{distributor} doesn't have a card {cardToGive}");

        distributor.Hand.Remove(cardToGive);
        target.Hand.Add(cardToGive);

        // check if all cards are distributed
        if (distributor.Hand.Count == 6)
        {
            SortCards(Player1);
            SortCards(Player2);
            SortCards(Player3);
            SortCards(Player4);
            // All players should have 6 cards, move to playing phase
            CurrentPhase = GamePhase.Playing;
            Log.Debug("[{Room}] All cards distributed, moving to playing phase", RoomCode);
        }
        else
        {
            AdvanceTurn();
        }
    }

    private static void SortCards(IPlayer player)
    {
        if (player.IsBot)
            return;
        var suitOrder = new Dictionary<CardSuit, int>
        {
            { CardSuit.Hearts, 0 },
            { CardSuit.Diamonds, 1 },
            { CardSuit.Clubs, 2 },
            { CardSuit.Spades, 3 }
        };

        player.Hand = player.Hand
            .OrderBy(card => suitOrder[card.Suit])
            .ThenByDescending(card => card.Points)
            .ToList();
    }

    /// <summary>
    /// Allows a player to play a card from their hand.
    /// Validates if it's the player's turn, if the player possesses the card,
    /// if the game is in the 'Playing' phase, and if the card is a valid play according to game rules.
    /// Removes the card from the player's hand and adds it to the cards on the table.
    /// Checks for meld announcements (e.g., King-Queen pair) to set or queue the trump suit.
    /// If four cards are on the table, the phase changes to 'ShowTable'; otherwise, the turn is advanced.
    /// </summary>
    /// <param name="player">The player attempting to play the card.</param>
    /// <param name="card">The card to be played.</param>
    /// <exception cref="InvalidOperationException">Thrown if:
    /// - It's not the specified player's turn.
    /// - The player does not have the specified card in their hand.
    /// - The current game phase is not <c>GamePhase.Playing</c>.
    /// - The card is not a valid play according to the current game state and rules (e.g., not following suit when required and able).
    /// </exception>
    /// <exception cref="ArgumentException">Thrown if the player's team is not set when a meld is announced (should not happen in a valid game state).</exception>
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

        if (firstCardOnTheTable != null && !CardUtils.CanPlay(card, firstCardOnTheTable, player.Hand, Round.CurrentCardsOnTable, Round.TrumpSuit))
        {
            throw new InvalidOperationException("Cannot play that card");
        }

        player.Hand.Remove(card);

        // Check for meld announcement
        Log.Debug("[{Room}] {Player} is putting {Card} on {LastCard} ", RoomCode, player, card, lastCardOnTheTable);
        if (
            (
                card.Rank == CardRank.Queen &&
                player.Hand.Any(c => c.Suit == card.Suit && c.Rank == CardRank.King) &&
                firstCardOnTheTable == null
                ) || (
                lastCardOnTheTable != null &&
                card.Rank == CardRank.King &&
                card.Suit == lastCardOnTheTable.Suit &&
                lastCardOnTheTable.Rank == CardRank.Queen
                )
            )
        {
            if (Round.CurrentCardsOnTable.Count == 0) // announce trump right away
            {
                Log.Debug("[{Room}] New Trump Suit announced by player {Player} with card {Card}", RoomCode,
                    player.Nickname, card.ShortName);
                Round.TrumpSuit = card.Suit;
            }
            else
            {
                Log.Debug("[{Room}] New Trump will be announced next round", RoomCode);
                Round.QueuedTrumpSuit = card.Suit;
            }
            Round.SuitToTeam.Add(new Tuple<CardSuit, Team>(card.Suit,
                player.Team ?? throw new ArgumentException("Team must be set at this point")));
        }
        Round.CurrentCardsOnTable.Add(card);
        Log.Debug("[{Room}] Player {Player} played card {Card}, and there are {X} cards on the table", RoomCode, player.Nickname, card.ShortName, Round.CurrentCardsOnTable.Count);
        if (Round.CurrentCardsOnTable.Count == 4)
        {
            CurrentPhase = GamePhase.ShowTable;
        }
        else
        {
            AdvanceTurn();
        }
    }

    private static int RoundTo10(int value)
    {
        return ((value + 5) / 10) * 10;
    }

    /// <summary>
    /// Finalizes the current take (trick) in the game.
    /// This involves determining the winner of the take, awarding points,
    /// updating the trump suit if a new one was announced, clearing the table,
    /// and setting up the next turn. If all cards have been played, it proceeds to end the round.
    /// </summary>
    public void CompleteTake()
    {
        var winner = DetermineTakeWinner();

        //dequeue trump suit (if required)
        if (Round.QueuedTrumpSuit != null)
        {
            Round.TrumpSuit = Round.QueuedTrumpSuit;
            Round.QueuedTrumpSuit = null;
        }

        var trickPoints = Round.CurrentCardsOnTable.Sum(card => card.Points);
        if (winner.Team == Team.Team1)
        {
            Round.Team1Points += trickPoints;
            Round.Team1WonAnyTake = true;
        }
        else
        {
            Round.Team2Points += trickPoints;
            Round.Team2WonAnyTake = true;
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
                if (cardsOnTable[i].Suit != trump ||
                    (highestTrump != null && cardsOnTable[i].Points <= highestTrump.Points)) continue;
                highestTrump = cardsOnTable[i];
                highestTrumpIdx = i;
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
            if (cardsOnTable[i].Suit != leadSuit || cardsOnTable[i].Points <= highestCard.Points) continue;
            highestCard = cardsOnTable[i];
            winnerIdx = i;
        }
        return playersOrder[winnerIdx];
    }

    private int TrumpPointsForTeam(Team team)
    {
        var teamHasAnyPoints = (team == Team.Team1 && Round.Team1WonAnyTake) || (team == Team.Team2 && Round.Team2WonAnyTake);
        var trumps = Round.SuitToTeam.Where(x => x.Item2 == team);
        return teamHasAnyPoints ? trumps.Sum(tuple => CardUtils.GetTrumpPoints(tuple.Item1)) : 0;
    }

    private void EndRound()
    {
        Log.Information("[{Room}]  Round ended. Team 1 points: {PointsTeam1}, Team 2 points: {PointsTeam2}", RoomCode, Round.Team1Points, Round.Team2Points);

        // Check if the team that won the round has enough points to win the bet
        var betWinner = Round.CurrentBidWinner;
        const int threshold = WinRequiredPoints - WinRequiredPoints / 10; //900 
        if (betWinner.Team == Team.Team1)
        {
            var finalPoints = Round.Team1Points + TrumpPointsForTeam(Team.Team1);

            if (finalPoints >= Round.CurrentBet)
            {
                Log.Debug("[{Room}] Team 1 managed to get required points {Points}/{BetAmount} ", RoomCode, finalPoints, Round.CurrentBet);
                _pointsTeam1.Push(_pointsTeam1.Peek() + Round.CurrentBet);
            }
            else
            {
                Log.Debug("[{Room}] Team 1 failed to get required points {Points}/{BetAmount} ", RoomCode, finalPoints, Round.CurrentBet);
                _pointsTeam1.Push(_pointsTeam1.Peek() - Round.CurrentBet);
            }

            var pointsTeam2 = RoundTo10(Round.Team2Points) + TrumpPointsForTeam(Team.Team2);

            if (_pointsTeam2.Peek() < threshold)
            {
                Log.Debug("[{Room}] Team 2 got {Points} ", RoomCode, pointsTeam2);
                _pointsTeam2.Push(_pointsTeam2.Peek() + pointsTeam2);
            }
            else
            {
                Log.Debug("[{Room}] Team 2 did not get enough points, no points added", RoomCode);
                _pointsTeam2.Push(_pointsTeam2.Peek());
            }
        }
        else // betWinner.Team == Team.Team2
        {
            var finalPoints = Round.Team2Points + TrumpPointsForTeam(Team.Team2);
            if (finalPoints >= Round.CurrentBet)
            {
                Log.Debug("[{Room}] Team 2 managed to get required points {Points}/{BetAmount} ", RoomCode, finalPoints, Round.CurrentBet);
                _pointsTeam2.Push(_pointsTeam2.Peek() + Round.CurrentBet);
            }
            else
            {
                Log.Debug("[{Room}] Team 2 failed to get required points {Points}/{BetAmount} ", RoomCode, finalPoints, Round.CurrentBet);
                _pointsTeam2.Push(_pointsTeam2.Peek() - Round.CurrentBet);
            }
            var pointsTeam1 = RoundTo10(Round.Team1Points) + TrumpPointsForTeam(Team.Team1);
            if (_pointsTeam1.Peek() < threshold)
            {
                Log.Debug("[{Room}] Team 1 got {Points} ", RoomCode, pointsTeam1);
                _pointsTeam1.Push(_pointsTeam1.Peek() + pointsTeam1);
            }
            else
            {
                Log.Debug("[{Room}] Team 1 did not get enough points, no points added", RoomCode);
                _pointsTeam1.Push(_pointsTeam1.Peek());
            }
        }
        Log.Debug("[{Room}] Points after round: Team 1: {PointsTeam1}, Team 2: {PointsTeam2}", RoomCode, _pointsTeam1, _pointsTeam2);

        if (IsGameOver())
        {
            Log.Information("[{Room}] Game over! Team 1 points: {PointsTeam1}, Team 2 points: {PointsTeam2}", RoomCode, _pointsTeam1, _pointsTeam2);
            FinishGame();
            return;
        }

        CurrentPhase = GamePhase.Auction;
        Log.Debug("[{Room}] Game reset to start phase", RoomCode);
        var lastRoomStartPlayer = Round.OrginalTurnQueue.First();
        CreateAndInitNewRound(lastRoomStartPlayer);
        Log.Debug("[{Room}] New round created, starting player: {Player}", RoomCode, Round.TurnQueue.FirstOrDefault());
    }

    private bool IsGameOver()
    {
        return
            _pointsTeam1.Peek() >= WinRequiredPoints ||
            _pointsTeam2.Peek() >= WinRequiredPoints ||
            _pointsTeam1.Peek() <= -WinRequiredPoints ||
            _pointsTeam2.Peek() <= -WinRequiredPoints;
    }

    private void FinishGame()
    {
        CurrentPhase = GamePhase.GameOver;
    }

    private static List<ICard> ShuffleDeck(List<ICard> deck)
    {
        var rng = new Random();
        var n = deck.Count;
        while (n > 1)
        {
            n--;
            var k = rng.Next(n + 1);
            (deck[n], deck[k]) = (deck[k], deck[n]);
        }
        return deck;
    }

    private List<ICard> InitCards()
    {
        Log.Debug("[{Room}] Initializing TableService", RoomCode);

        var allowedRanks = new[]
        {
            CardRank.As, CardRank.King, CardRank.Queen, CardRank.Jack, CardRank.Ten, CardRank.Nine
        };

        return [.. Enum.GetValues<CardSuit>()
            .SelectMany(suit => allowedRanks.Select(rank => new Card(rank, suit)))
            .Cast<ICard>()];
    }

}