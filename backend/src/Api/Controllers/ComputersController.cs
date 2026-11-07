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

/// <summary>
/// Organizational Units (OUs) Controller.
/// 
/// AUTHENTICATION & AUTHORIZATION DESIGN (PHASE 2):
/// [Authorize(Roles = "Viewer,Helpdesk,ADOperator,SecurityAuditor,SystemAdministrator")]
/// </summary>
[ApiController]
[Route("api/ous")]
public class OrganizationalUnitsController : ControllerBase
{
    private readonly IDirectoryReadService _directoryReadService;

    public OrganizationalUnitsController(IDirectoryReadService directoryReadService)
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
        var ou = await _directoryReadService.GetOuByIdAsync(id, cancellationToken);
        if (ou == null)
        {
            return NotFound(new ApiErrorResponse
            {
                Error = $"Organizational Unit '{id}' was not found.",
                Code = "OBJECT_NOT_FOUND",
                RequestId = HttpContext.TraceIdentifier
            });
        }
        return Ok(ou);
    }
}

/// <summary>
/// Security & Distribution Groups Controller.
/// 
/// AUTHENTICATION & AUTHORIZATION DESIGN (PHASE 2):
/// [Authorize(Roles = "Viewer,Helpdesk,ADOperator,SecurityAuditor,SystemAdministrator")]
/// </summary>
[ApiController]
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
        var group = await _directoryReadService.GetGroupByIdAsync(id, cancellationToken);
        if (group == null)
        {
            return NotFound(new ApiErrorResponse
            {
                Error = $"Group object '{id}' was not found.",
                Code = "OBJECT_NOT_FOUND",
                RequestId = HttpContext.TraceIdentifier
            });
        }
        return Ok(group);
    }
}

/// <summary>
/// Immutable Audit Trails Controller.
/// 
/// AUTHENTICATION & AUTHORIZATION DESIGN (PHASE 2):
/// [Authorize(Roles = "SecurityAuditor,SystemAdministrator")]
/// Enforces restricted access strictly for Auditors and Administrators.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class AuditController : ControllerBase
{
    private readonly IAuditLogRepository _auditRepository;

    public AuditController(IAuditLogRepository auditRepository)
    {
        _auditRepository = auditRepository;
    }

    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<AuditEntry>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetLogs([FromQuery] AuditFilterQuery query, CancellationToken cancellationToken)
    {
        // NOTE FOR PHASE 2:
        // When real JWT / ClaimsPrincipal is active, server validates:
        // if (!User.IsInRole("SecurityAuditor") && !User.IsInRole("SystemAdministrator")) return Forbid();

        var result = await _auditRepository.GetLogsAsync(query, cancellationToken);
        return Ok(result);
    }
}

/// <summary>
/// Health Check Endpoint.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    [HttpGet]
    public IActionResult GetHealth()
    {
        return Ok(new
        {
            status = "Healthy",
            phase = "Phase 1 Mock",
            system = "Samchuk Hospital AD Management API",
            timestampUtc = DateTime.UtcNow
        });
    }
}
