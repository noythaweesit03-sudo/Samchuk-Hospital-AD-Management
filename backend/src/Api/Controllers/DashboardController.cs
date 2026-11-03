using Microsoft.AspNetCore.Mvc;
using SamchukHospital.AdManagement.Api.Models;
using SamchukHospital.AdManagement.Application.Common.Interfaces;

namespace SamchukHospital.AdManagement.Api.Controllers;

/// <summary>
/// Dashboard Overview Controller.
/// 
/// AUTHENTICATION & AUTHORIZATION DESIGN (PHASE 2):
/// [Authorize(Roles = "Viewer,Helpdesk,ADOperator,SecurityAuditor,SystemAdministrator")]
/// NOTE: In Phase 1 Mock-Only mode, this endpoint returns synthetic mock summary data.
/// Production RBAC and server-side claims validation will be enforced upon Phase 2/3 activation.
/// </summary>
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
    [ProducesResponseType(typeof(DashboardSummaryDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetSummary(CancellationToken cancellationToken)
    {
        try
        {
            var summary = await _directoryReadService.GetDashboardSummaryAsync(cancellationToken);
            return Ok(summary);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiErrorResponse
            {
                Error = "Failed to retrieve dashboard summary: " + ex.Message,
                Code = "INTERNAL_SERVER_ERROR",
                RequestId = HttpContext.TraceIdentifier
            });
        }
    }
}
