using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SamchukHospital.AdManagement.Api.Models;
using SamchukHospital.AdManagement.Api.Security;
using SamchukHospital.AdManagement.Application.Common.Interfaces;
using SamchukHospital.AdManagement.Domain.Entities;

namespace SamchukHospital.AdManagement.Api.Controllers;

/// <summary>
/// Security Audit Logs Controller (Phase 1 Mock / Phase 2 Design)
/// Restricted to SecurityAuditor and SystemAdministrator roles.
/// </summary>
[ApiController]
[Authorize(Policy = AuthorizationPolicies.SecurityAuditorOrAbove)]
[Route("api/[controller]")]
public class AuditController : ControllerBase
{
    private readonly IAuditLogRepository _auditLogRepository;

    public AuditController(IAuditLogRepository auditLogRepository)
    {
        _auditLogRepository = auditLogRepository;
    }

    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<AuditEntry>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAuditLogs([FromQuery] AuditFilterQuery query, CancellationToken cancellationToken)
    {
        var logs = await _auditLogRepository.GetLogsAsync(query, cancellationToken);
        return Ok(logs);
    }
}
