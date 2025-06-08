using GameServer;
using GameServer.Models;
using GameServer.Services;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

builder.Logging.ClearProviders(); // Clear default logging providers
builder.Host.UseSerilog((context, configuration) =>
    configuration.ReadFrom.Configuration(context.Configuration));

builder.Services.AddSignalR();
var corsOrigins = builder.Configuration.GetSection("Cors:Origins").Get<string[]>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(corsOrigins ?? [])
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

app.UseCors("AllowFrontend");

await app.RunAsync();