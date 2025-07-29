using Microsoft.AspNetCore.Mvc;

namespace GameServer.Controllers;

[Route("api/[controller]")]
[ApiController]
public class GameDataController : ControllerBase
{
    private static readonly string[] AvailableDeckNames = ["default","custom1"];

    [HttpGet]
    [Route("skins")]
    public async Task<IActionResult> GetAvailableDeckSkins()
    {
        return Ok(AvailableDeckNames);
    }
}