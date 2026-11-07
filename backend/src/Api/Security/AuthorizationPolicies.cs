using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.DependencyInjection;

namespace SamchukHospital.AdManagement.Api.Security;

/// <summary>
/// Samchuk Hospital AD Management - Policy-based RBAC Design (Phase 1.5 / 2)
/// 
/// Role Hierarchy and Capabilities:
/// 1. Viewer: Read-only access to Dashboard, Users, Computers, Groups, and OUs.
/// 2. Helpdesk: Read-only access + planned account unlock / password reset (Phase 4).
/// 3. ADOperator: Operator access to OUs, Groups, and configuration parameters.
/// 4. SecurityAuditor: Access to Audit Logs, security events, and compliance reports.
/// 5. SystemAdministrator: Full administrative access to all modules.
/// </summary>
public static class AuthorizationPolicies
{
    public const string ViewerOrAbove = "Policy.ViewerOrAbove";
    public const string HelpdeskOrAbove = "Policy.HelpdeskOrAbove";
    public const string ADOperatorOrAbove = "Policy.ADOperatorOrAbove";
    public const string SecurityAuditorOrAbove = "Policy.SecurityAuditorOrAbove";
    public const string SystemAdministratorOnly = "Policy.SystemAdministratorOnly";

    public static IServiceCollection AddHospitalAdAuthorization(this IServiceCollection services)
    {
        services.AddAuthorization(options =>
        {
            options.AddPolicy(ViewerOrAbove, policy =>
                policy.RequireRole(
                    "Viewer",
                    "Helpdesk",
                    "ADOperator",
                    "SecurityAuditor",
                    "SystemAdministrator"
                ));

            options.AddPolicy(HelpdeskOrAbove, policy =>
                policy.RequireRole(
                    "Helpdesk",
                    "ADOperator",
                    "SecurityAuditor",
                    "SystemAdministrator"
                ));

            options.AddPolicy(ADOperatorOrAbove, policy =>
                policy.RequireRole(
                    "ADOperator",
                    "SystemAdministrator"
                ));

            options.AddPolicy(SecurityAuditorOrAbove, policy =>
                policy.RequireRole(
                    "SecurityAuditor",
                    "SystemAdministrator"
                ));

            options.AddPolicy(SystemAdministratorOnly, policy =>
                policy.RequireRole("SystemAdministrator"));
        });

        return services;
    }
}
