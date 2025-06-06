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
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
            "http://localhost:5173", // for local dev
            "http://frontend:80",    // for Docker Compose networking
            "http://localhost:5224", // mapped frontend: 5224:80
            "http://localhost"        // mapped frontend: 80:80
        )
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