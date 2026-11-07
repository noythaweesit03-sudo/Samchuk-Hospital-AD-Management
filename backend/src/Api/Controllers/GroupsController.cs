using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SamchukHospital.AdManagement.Api.Models;
using SamchukHospital.AdManagement.Api.Security;
using SamchukHospital.AdManagement.Application.Common.Interfaces;
using SamchukHospital.AdManagement.Domain.Entities;

namespace SamchukHospital.AdManagement.Api.Controllers;

/// <summary>
/// Active Directory Groups Controller (Phase 1 Mock / Phase 2 Design)
/// Accessible to Viewer, Helpdesk, ADOperator, SecurityAuditor, SystemAdministrator.
/// </summary>
[ApiController]
[Authorize(Policy = AuthorizationPolicies.ViewerOrAbove)]
[Route("api/[controller]")]
public class GroupsController : ControllerBase
{
    private readonly IDirectoryReadService _directoryReadService;

    public GroupsController(IDirectoryReadService directoryReadService)
    {
        _directoryReadService = directoryReadService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(List<AdGroup>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetGroups([FromQuery] GroupFilterQuery query, CancellationToken cancellationToken)
    {
        var groups = await _directoryReadService.GetGroupsAsync(query, cancellationToken);
        return Ok(groups);
    }

    [HttpGet("{id}")]
    [ProducesResponseType(typeof(AdGroup), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetGroupById(string id, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(id))
        {
            return BadRequest(new ApiErrorResponse
            {
                Error = "Group ID cannot be empty.",
                Code = "INVALID_IDENTIFIER",
                RequestId = HttpContext.TraceIdentifier
            });
        }

        var group = await _directoryReadService.GetGroupByIdAsync(id, cancellationToken);
        if (group == null)
        {
            return NotFound(new ApiErrorResponse
            {
                Error = $"Group '{id}' was not found in directory.",
                Code = "GROUP_NOT_FOUND",
                RequestId = HttpContext.TraceIdentifier
            });
        }

        return Ok(group);
    }
}
