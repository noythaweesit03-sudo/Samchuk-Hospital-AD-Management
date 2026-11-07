using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace SamchukHospital.AdManagement.Api.Controllers;

/// <summary>
/// Health Check Endpoint for Samchuk Hospital AD Management Web API.
/// Allows uptime monitoring, load balancer checks, and Phase 1 readiness verification.
/// </summary>
[ApiController]
[AllowAnonymous]
[Route("api/[controller]")]
[Route("health")]
public class HealthController : ControllerBase
{
    private readonly IWebHostEnvironment _environment;

    public HealthController(IWebHostEnvironment environment)
    {
        _environment = environment;
    }

    [HttpGet]
    public IActionResult GetHealth()
    {
        return Ok(new
        {
            status = "Healthy",
            system = "Samchuk Hospital Active Directory Management API",
            environment = _environment.EnvironmentName,
            mode = "Mock-Only (Phase 1 Final Hardening)",
            activeDirectory = new
            {
                liveConnection = false,
                writeOperations = "Disabled (Phase 4 Planned)",
                provider = "In-Memory Synthetic Mock Provider"
            },
            architecture = "Option A: Independent AD Management (Isolated Application Server)",
            timestampUtc = DateTime.UtcNow
        });
    }
}
