using GameServer.Models;
using GameServer.Models.Context;
using GameServer.Models.Enums;
using GameServer.Models.impl;
using GameServer.Utils;
using Serilog;

namespace GameServer.Services;

public static class AiService
{
    
    public static void ProcessTurn(GameService gameService , AIPlayer player)
    {
        var gameCtx = gameService.GetGameState();
        var userCtx = gameService.GetUserState(player);
        Log.Debug("Game Stage {Stage}",gameCtx.GamePhase );
        Log.Debug("Processing move for {BotName}", userCtx.Me.Nickname);
        var cardsString = userCtx.Hand.Select(v => v+" ");
        Log.Debug("[ {Cards}] player cards", cardsString);
        switch (gameCtx.GamePhase)
        {
            case GamePhase.Auction:
            {
                ProcessAuction(gameService, player, gameCtx, userCtx);
                break;
            }
            case GamePhase.CardDistribution:
            {
                ProcessCardDistribution(gameService, player, userCtx);
                break;
            }
            case GamePhase.Playing:
            {
                ProcessPlaying(gameService, player, userCtx, gameCtx);
                break;
            }
            case GamePhase.Start:
            case GamePhase.GameOver:
            case GamePhase.ShowTable:
            default:
            {
                Log.Debug("Game Phase {Phase}", gameCtx.GamePhase);
                break;
            }
        }
    }

    private static void ProcessCardDistribution(GameService gameService, AIPlayer player, UserContext userCtx)
    {
        var botHand = userCtx.Hand;

        if (userCtx.LeftPlayerCards == 5)
        {
            var card = botHand.OrderBy(card => card.Points).ToList()[0];
            var trumps = CardUtils.GetTrumps(botHand);
            //daj mu damę nie rozbijając meldunków
            var queens = botHand.Where(c => c.Rank == CardRank.Queen).ToList();
            if(queens.Any(c => !trumps.Contains(c.Suit )))
            {
                card = queens[0];
            }
            gameService.DistributeCard(player, card.ShortName,
                gameService.GetPlayerFromRoom(userCtx.LeftPlayer.ConnectionId) ?? throw new InvalidOperationException("Bot's Left player not found"));
                    
        }
        else if (userCtx.TeammateCards == 5)
        {
            var card = botHand.OrderByDescending(card => card.Points).ToList()[0];
            var trumps = CardUtils.GetTrumps(botHand);
            //daj mu króla nie rozbijając meldunków
            var kings = botHand.Where(c => c.Rank == CardRank.King).ToList();
            if(kings.Any(c => !trumps.Contains(c.Suit )))
            {
                card = kings[0];
            }

            gameService.DistributeCard(player, card.ShortName
                , gameService.GetPlayerFromRoom(userCtx.Teammate.ConnectionId) ?? throw new InvalidOperationException("Bot's teammate not found"));
        }
        else if (userCtx.RightPlayerCards == 5)
        {
            var card = botHand.OrderBy(card => card.Points).ToList()[0];
            var trumps = CardUtils.GetTrumps(botHand);
            //daj mu damę nie rozbijając meldunków
            var queens = botHand.Where(c => c.Rank == CardRank.Queen).ToList();
            if(queens.Any(c => !trumps.Contains(c.Suit )))
            {
                card = queens[0];
            }
                    
            gameService.DistributeCard(player, card.ShortName, gameService.GetPlayerFromRoom(userCtx.RightPlayer.ConnectionId) ?? throw new InvalidOperationException("Bot's right player not found"));
        }
    }

    private static void ProcessPlaying(GameService gameService, AIPlayer player, UserContext userCtx, GameContext gameCtx)
    {
        var botHand = userCtx.Hand;
        var cards = botHand.Where(card => gameCtx.CardsOnTable.Count > 0 && CardUtils.CanPlay(card, gameCtx.CardsOnTable[0], botHand,
            gameCtx.CardsOnTable, gameCtx.TrumpSuit)).ToList();
        if (cards.Count == 0)
        {
            cards = botHand;
        }
        var card = CardUtils.GetCardToPlay(cards); 
        if (gameCtx.CardsOnTable.Count == 0)
        {
            var trumps = CardUtils.GetTrumps(botHand);
            //try to play queen and meld 
            if (trumps.Count != 0)
            {
                card = cards.Where(c => trumps.Contains(c.Suit) && c.Rank == CardRank.Queen).OrderByDescending(c => c.Points)
                    .ToList()[0];
            }
        }else
        {
            var cardToPlayOn = gameCtx.CardsOnTable.Last();
            if (cardToPlayOn.Rank == CardRank.Queen && cards.Any(card =>
                    card.Rank == CardRank.King && card.Suit == cardToPlayOn.Suit))
            {
                card = cards.First(c => c.Rank == CardRank.King && c.Suit == cardToPlayOn.Suit);
            }
        }
        gameService.PlayCard(player, card);
        Log.Debug("Bot plays {Card}", card);
    }

    private static void ProcessAuction(GameService gameService, AIPlayer player, GameContext gameCtx, UserContext userCtx)
    {
        var currentBid = gameCtx.CurrentBet;
        var botHand = userCtx.Hand;
        const int maxBid = 210;
                
        var trumps = CardUtils.GetTrumps(botHand);
        var pointsFromTrumps = trumps.Select(CardUtils.GetTrumpPoints).Sum();
        var halfTrumps = CardUtils.GetHalfTrumps(botHand)
            .Select(c => CardUtils.GetTrumpPoints(c.Suit))
            .Select(v => v/2).Sum();
                
        var possibleToPLay = Math.Min(pointsFromTrumps + halfTrumps, maxBid); // make sure not to bet over 210
        possibleToPLay += botHand.Select(c => c.Points).Sum(arg => arg);
        var random = new Random().Next( possibleToPLay/20); // add 20% risk
        possibleToPLay += random;
        if (possibleToPLay == 0)
            possibleToPLay = maxBid;
                
        Log.Debug("Points:{Points}", possibleToPLay);
                
        if (currentBid + 10 <= possibleToPLay)
        {
            gameService.PlaceBid(player, currentBid + 10);
            Log.Debug("Bot bids {Bid}", currentBid + 10);
        }
        else
        {
            gameService.PassBid(player);
            Log.Debug("Bot passes");
        }
    }
}