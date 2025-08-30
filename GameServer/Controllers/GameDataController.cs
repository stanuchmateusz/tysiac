using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GameServer.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class GameDataController : ControllerBase
{
    private static readonly string[] AvailableDeckNames = ["default"];

    [HttpGet]
    [Route("skins")]
    public async Task<IActionResult> GetAvailableDeckSkins()
    {
        return Ok(AvailableDeckNames);
    }
}