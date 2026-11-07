using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SamchukHospital.AdManagement.Api.Models;
using SamchukHospital.AdManagement.Api.Security;
using SamchukHospital.AdManagement.Application.Common.Interfaces;
using SamchukHospital.AdManagement.Domain.Entities;

namespace SamchukHospital.AdManagement.Api.Controllers;

/// <summary>
/// Active Directory Organizational Units (OUs) Controller (Phase 1 Mock / Phase 2 Design)
/// Accessible to Viewer, Helpdesk, ADOperator, SecurityAuditor, SystemAdministrator.
/// </summary>
[ApiController]
[Authorize(Policy = AuthorizationPolicies.ViewerOrAbove)]
[Route("api/[controller]")]
public class OusController : ControllerBase
{
    private readonly IDirectoryReadService _directoryReadService;

    public OusController(IDirectoryReadService directoryReadService)
    {
        _directoryReadService = directoryReadService;
    }

    [HttpGet("tree")]
    [ProducesResponseType(typeof(List<AdOrganizationalUnit>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetOuTree(CancellationToken cancellationToken)
    {
        var tree = await _directoryReadService.GetOuTreeAsync(cancellationToken);
        return Ok(tree);
    }

    [HttpGet("{id}")]
    [ProducesResponseType(typeof(AdOrganizationalUnit), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetOuById(string id, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(id))
        {
            return BadRequest(new ApiErrorResponse
            {
                Error = "OU ID cannot be empty.",
                Code = "INVALID_IDENTIFIER",
                RequestId = HttpContext.TraceIdentifier
            });
        }

        var ou = await _directoryReadService.GetOuByIdAsync(id, cancellationToken);
        if (ou == null)
        {
            return NotFound(new ApiErrorResponse
            {
                Error = $"OU '{id}' was not found in directory.",
                Code = "OU_NOT_FOUND",
                RequestId = HttpContext.TraceIdentifier
            });
        }

        return Ok(ou);
    }
}
