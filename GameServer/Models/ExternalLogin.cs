namespace GameServer.Models;

public class ExternalLogin
{
    public string Provider { get; set; }  // "Google", "GitHub", "Discord"
    public string ProviderUserId { get; set; } // Google "sub", GitHub "id"
}
