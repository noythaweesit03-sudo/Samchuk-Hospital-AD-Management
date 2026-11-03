using Microsoft.AspNetCore.Mvc;
using SamchukHospital.AdManagement.Application.Common.Interfaces;

namespace SamchukHospital.AdManagement.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ComputersController : ControllerBase
{
    private readonly IDirectoryReadService _directoryReadService;

    public ComputersController(IDirectoryReadService directoryReadService)
    {
        _directoryReadService = directoryReadService;
    }

    [HttpGet]
    public async Task<IActionResult> GetComputers([FromQuery] ComputerFilterQuery query, CancellationToken cancellationToken)
    {
        var result = await _directoryReadService.GetComputersAsync(query, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetComputerById(string id, CancellationToken cancellationToken)
    {
        var computer = await _directoryReadService.GetComputerByIdAsync(id, cancellationToken);
        if (computer == null) return NotFound(new { error = "Computer object not found" });
        return Ok(computer);
    }
}

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
    public async Task<IActionResult> GetOuTree(CancellationToken cancellationToken)
    {
        var tree = await _directoryReadService.GetOuTreeAsync(cancellationToken);
        return Ok(tree);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetOuById(string id, CancellationToken cancellationToken)
    {
        var ou = await _directoryReadService.GetOuByIdAsync(id, cancellationToken);
        if (ou == null) return NotFound(new { error = "Organizational Unit not found" });
        return Ok(ou);
    }
}

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
    public async Task<IActionResult> GetGroups([FromQuery] GroupFilterQuery query, CancellationToken cancellationToken)
    {
        var groups = await _directoryReadService.GetGroupsAsync(query, cancellationToken);
        return Ok(groups);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetGroupById(string id, CancellationToken cancellationToken)
    {
        var group = await _directoryReadService.GetGroupByIdAsync(id, cancellationToken);
        if (group == null) return NotFound(new { error = "Group not found" });
        return Ok(group);
    }
}

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
    public async Task<IActionResult> GetLogs([FromQuery] AuditFilterQuery query, CancellationToken cancellationToken)
    {
        var result = await _auditRepository.GetLogsAsync(query, cancellationToken);
        return Ok(result);
    }
}

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
