using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.DependencyInjection;

namespace SamchukHospital.AdManagement.Api.Security;

/// <summary>
/// Samchuk Hospital AD Management - Policy-based RBAC Design (Phase 1.5 / 2A)
/// 
/// Role Hierarchy and Capabilities:
/// 1. Viewer: Read-only access to Dashboard, Users, Computers, Groups, and OUs.
/// 2. Helpdesk: Read-only access + planned account unlock / password reset (Phase 4).
/// 3. ADOperator: Operator access to OUs, Groups, Settings, and Connection Readiness Diagnostics.
/// 4. SecurityAuditor: Access to Audit Logs, security events, Settings, and Connection Readiness Diagnostics.
/// 5. SystemAdministrator: Full administrative access to all modules.
/// </summary>
public static class AuthorizationPolicies
{
    public const string ViewerOrAbove = "Policy.ViewerOrAbove";
    public const string HelpdeskOrAbove = "Policy.HelpdeskOrAbove";
    public const string ADOperatorOrAbove = "Policy.ADOperatorOrAbove";
    public const string SecurityAuditorOrAbove = "Policy.SecurityAuditorOrAbove";
    public const string SystemAdministratorOnly = "Policy.SystemAdministratorOnly";

    public static IReadOnlyList<string> GetAllowedRolesForPolicy(string policyName)
    {
        return policyName switch
        {
            ViewerOrAbove => new[] { "Viewer", "Helpdesk", "ADOperator", "SecurityAuditor", "SystemAdministrator" },
            HelpdeskOrAbove => new[] { "Helpdesk", "ADOperator", "SecurityAuditor", "SystemAdministrator" },
            ADOperatorOrAbove => new[] { "ADOperator", "SecurityAuditor", "SystemAdministrator" },
            SecurityAuditorOrAbove => new[] { "SecurityAuditor", "SystemAdministrator" },
            SystemAdministratorOnly => new[] { "SystemAdministrator" },
            _ => Array.Empty<string>()
        };
    }

    public static IServiceCollection AddHospitalAdAuthorization(this IServiceCollection services)
    {
        services.AddAuthorization(options =>
        {
            options.AddPolicy(ViewerOrAbove, policy =>
                policy.RequireRole(GetAllowedRolesForPolicy(ViewerOrAbove).ToArray()));

            options.AddPolicy(HelpdeskOrAbove, policy =>
                policy.RequireRole(GetAllowedRolesForPolicy(HelpdeskOrAbove).ToArray()));

            options.AddPolicy(ADOperatorOrAbove, policy =>
                policy.RequireRole(GetAllowedRolesForPolicy(ADOperatorOrAbove).ToArray()));

            options.AddPolicy(SecurityAuditorOrAbove, policy =>
                policy.RequireRole(GetAllowedRolesForPolicy(SecurityAuditorOrAbove).ToArray()));

            options.AddPolicy(SystemAdministratorOnly, policy =>
                policy.RequireRole(GetAllowedRolesForPolicy(SystemAdministratorOnly).ToArray()));
        });

        return services;
    }
}
