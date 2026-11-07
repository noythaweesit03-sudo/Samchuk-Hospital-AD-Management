using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SamchukHospital.AdManagement.Api.Security;
using SamchukHospital.AdManagement.Application.Common.Interfaces;

namespace SamchukHospital.AdManagement.Api.Controllers;

/// <summary>
/// Phase 2A Connection Readiness & Offline Diagnostics Controller.
/// Restricted to ADOperator, SecurityAuditor, and SystemAdministrator roles (matches Settings view RBAC).
/// Strictly returns Simulated / NotTested / NotConfigured statuses without connecting to a live DC.
/// </summary>
[ApiController]
[Authorize(Policy = AuthorizationPolicies.ADOperatorOrAbove)]
[Route("api/[controller]")]
public class DiagnosticsController : ControllerBase
{
    private readonly IConnectionDiagnosticsService _diagnosticsService;

    public DiagnosticsController(IConnectionDiagnosticsService diagnosticsService)
    {
        _diagnosticsService = diagnosticsService;
    }

    [HttpGet("connection-readiness")]
    [ProducesResponseType(typeof(ConnectionReadinessReportDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetConnectionReadiness(CancellationToken cancellationToken)
    {
        var report = await _diagnosticsService.GetConnectionReadinessAsync(cancellationToken);
        return Ok(report);
    }
}
