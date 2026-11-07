using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SamchukHospital.AdManagement.Api.Models;
using SamchukHospital.AdManagement.Api.Security;
using SamchukHospital.AdManagement.Application.Common.Interfaces;
using SamchukHospital.AdManagement.Domain.Entities;

namespace SamchukHospital.AdManagement.Api.Controllers;

/// <summary>
/// Active Directory Computers & Servers Controller.
/// Accessible to Viewer, Helpdesk, ADOperator, SecurityAuditor, SystemAdministrator.
/// </summary>
[ApiController]
[Authorize(Policy = AuthorizationPolicies.ViewerOrAbove)]
[Route("api/[controller]")]
public class ComputersController : ControllerBase
{
    private readonly IDirectoryReadService _directoryReadService;

    public ComputersController(IDirectoryReadService directoryReadService)
    {
        _directoryReadService = directoryReadService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<AdComputer>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetComputers([FromQuery] ComputerFilterQuery query, CancellationToken cancellationToken)
    {
        if (query.PageNumber < 1 || query.PageSize < 1 || query.PageSize > 100)
        {
            return BadRequest(new ApiErrorResponse
            {
                Error = "Invalid pagination parameters.",
                Code = "INVALID_PAGINATION",
                RequestId = HttpContext.TraceIdentifier
            });
        }

        var result = await _directoryReadService.GetComputersAsync(query, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id}")]
    [ProducesResponseType(typeof(AdComputer), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetComputerById(string id, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(id))
        {
            return BadRequest(new ApiErrorResponse
            {
                Error = "Computer ID cannot be empty.",
                Code = "INVALID_IDENTIFIER",
                RequestId = HttpContext.TraceIdentifier
            });
        }

        var computer = await _directoryReadService.GetComputerByIdAsync(id, cancellationToken);
        if (computer == null)
        {
            return NotFound(new ApiErrorResponse
            {
                Error = $"Computer object '{id}' was not found.",
                Code = "OBJECT_NOT_FOUND",
                RequestId = HttpContext.TraceIdentifier
            });
        }
        return Ok(computer);
    }
}
