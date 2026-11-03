using Microsoft.AspNetCore.Mvc;
using SamchukHospital.AdManagement.Application.Common.Interfaces;

namespace SamchukHospital.AdManagement.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DashboardController : ControllerBase
{
    private readonly IDirectoryReadService _directoryReadService;

    public DashboardController(IDirectoryReadService directoryReadService)
    {
        _directoryReadService = directoryReadService;
    }

    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary(CancellationToken cancellationToken)
    {
        var summary = await _directoryReadService.GetDashboardSummaryAsync(cancellationToken);
        return Ok(summary);
    }
}

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly IDirectoryReadService _directoryReadService;

    public UsersController(IDirectoryReadService directoryReadService)
    {
        _directoryReadService = directoryReadService;
    }

    [HttpGet]
    public async Task<IActionResult> GetUsers([FromQuery] UserFilterQuery query, CancellationToken cancellationToken)
    {
        var result = await _directoryReadService.GetUsersAsync(query, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetUserById(string id, CancellationToken cancellationToken)
    {
        var user = await _directoryReadService.GetUserByIdAsync(id, cancellationToken);
        if (user == null) return NotFound(new { error = "User object not found in Active Directory" });
        return Ok(user);
    }
}
