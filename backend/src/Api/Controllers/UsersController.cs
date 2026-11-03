using Microsoft.AspNetCore.Mvc;
using SamchukHospital.AdManagement.Api.Models;
using SamchukHospital.AdManagement.Application.Common.Interfaces;
using SamchukHospital.AdManagement.Domain.Entities;

namespace SamchukHospital.AdManagement.Api.Controllers;

/// <summary>
/// Active Directory Users Controller.
/// 
/// AUTHENTICATION & AUTHORIZATION DESIGN (PHASE 2):
/// [Authorize(Roles = "Viewer,Helpdesk,ADOperator,SecurityAuditor,SystemAdministrator")]
/// NOTE: In Phase 1 Mock-Only mode, this endpoint returns synthetic mock user records.
/// Write operations (create, update, unlock, reset password) are strictly not implemented in Phase 1.
/// </summary>
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
    [ProducesResponseType(typeof(PagedResult<AdUser>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetUsers([FromQuery] UserFilterQuery query, CancellationToken cancellationToken)
    {
        if (query.PageNumber < 1 || query.PageSize < 1 || query.PageSize > 100)
        {
            return BadRequest(new ApiErrorResponse
            {
                Error = "Invalid pagination parameters. PageNumber must be >= 1 and PageSize between 1 and 100.",
                Code = "INVALID_PAGINATION",
                RequestId = HttpContext.TraceIdentifier
            });
        }

        var result = await _directoryReadService.GetUsersAsync(query, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id}")]
    [ProducesResponseType(typeof(AdUser), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetUserById(string id, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(id))
        {
            return BadRequest(new ApiErrorResponse
            {
                Error = "User ID or sAMAccountName cannot be empty.",
                Code = "INVALID_IDENTIFIER",
                RequestId = HttpContext.TraceIdentifier
            });
        }

        var user = await _directoryReadService.GetUserByIdAsync(id, cancellationToken);
        if (user == null)
        {
            return NotFound(new ApiErrorResponse
            {
                Error = $"User object with identifier '{id}' was not found in Active Directory.",
                Code = "OBJECT_NOT_FOUND",
                RequestId = HttpContext.TraceIdentifier
            });
        }

        return Ok(user);
    }
}
