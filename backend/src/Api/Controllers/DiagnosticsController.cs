using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SamchukHospital.AdManagement.Api.Models;
using SamchukHospital.AdManagement.Api.Security;
using SamchukHospital.AdManagement.Application.Common.Interfaces;

namespace SamchukHospital.AdManagement.Api.Controllers;

/// <summary>
/// Phase 2A Connection Readiness & Offline Diagnostics Controller.
/// Strictly aligned with Settings View RBAC: restricted to ADOperator, SecurityAuditor, and SystemAdministrator.
/// Denied (HTTP 403) for Viewer and Helpdesk roles.
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

    public static bool IsRolePermittedForDiagnostics(string? role)
    {
        if (string.IsNullOrWhiteSpace(role))
        {
            return false;
        }

        var allowedRoles = AuthorizationPolicies.GetAllowedRolesForPolicy(AuthorizationPolicies.ADOperatorOrAbove);
        return allowedRoles.Contains(role.Trim(), StringComparer.OrdinalIgnoreCase);
    }

    [HttpGet("connection-readiness")]
    [ProducesResponseType(typeof(ConnectionReadinessReportDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetConnectionReadiness(CancellationToken cancellationToken)
    {
        // Defense-in-depth RBAC verification matching Settings view allowed roles
        var allowedRoles = AuthorizationPolicies.GetAllowedRolesForPolicy(AuthorizationPolicies.ADOperatorOrAbove);
        var hasAllowedRole = allowedRoles.Any(r => User.IsInRole(r));
        if (!hasAllowedRole)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new ApiErrorResponse
            {
                Error = "Current role is not authorized to access AD Connection Readiness Diagnostics. Required: ADOperator, SecurityAuditor, or SystemAdministrator.",
                Code = "FORBIDDEN_DIAGNOSTICS_ROLE",
                RequestId = HttpContext.TraceIdentifier
            });
        }

        var report = await _diagnosticsService.GetConnectionReadinessAsync(cancellationToken);
        return Ok(report);
    }
}
