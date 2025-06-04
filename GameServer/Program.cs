using GameServer;
using GameServer.Models;
using GameServer.Services;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

builder.Logging.ClearProviders(); // Clear default logging providers
builder.Host.UseSerilog((context, configuration) =>
    configuration.ReadFrom.Configuration(context.Configuration));

builder.Services.AddSignalR();
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:5173") // todo change me frontend dev url - read from appsettings
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// builder.Services.AddSingleton<IGameManager,GameManager>();
builder.Services.AddSingleton<GameManager>();
builder.Services.AddSingleton<LobbyService>();

var app = builder.Build();

app.MapHub<GameHub>("/gameHub");

app.UseCors();

await app.RunAsync();