using System.Security.Claims;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace SamchukHospital.AdManagement.Api.Security;

/// <summary>
/// DemoAuthenticationHandler (DEVELOPMENT & TEST ENVIRONMENTS ONLY):
/// Facilitates local development and automated CI contract testing by inspecting
/// simulated HTTP headers: 'X-Demo-User' and 'X-Demo-Role'.
///
/// SECURITY WARNING:
/// 'X-Demo-User' and 'X-Demo-Role' are unverified, client-supplied simulated headers
/// that are COMPLETELY INSECURE for real/production usage (trivial header spoofing risk).
///
/// STRICT ENVIRONMENT ISOLATION:
/// This handler uses a strict allowlist: it ONLY executes when IWebHostEnvironment is
/// 'Development' or 'Test'. In 'Production' or any other environment, it immediately
/// fails closed and rejects authentication.
/// </summary>
public class DemoAuthenticationHandler : AuthenticationHandler<AuthenticationSchemeOptions>
{
    public const string SchemeName = "DemoScheme";
    public const string InsecureDemoUserHeader = "X-Demo-User";
    public const string InsecureDemoRoleHeader = "X-Demo-Role";

    private readonly IWebHostEnvironment _environment;

    public DemoAuthenticationHandler(
        IOptionsMonitor<AuthenticationSchemeOptions> options,
        ILoggerFactory logger,
        UrlEncoder encoder,
        IWebHostEnvironment environment)
        : base(options, logger, encoder)
    {
        _environment = environment;
    }

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        // STRICT ALLOWLIST: Only permit in Development or Test environments.
        // Any other environment (Production, Staging, UAT, etc.) immediately fails closed.
        var isAllowedEnvironment = _environment.IsDevelopment() || _environment.IsEnvironment("Test");
        if (!isAllowedEnvironment)
        {
            Logger.LogCritical(
                "SECURITY BLOCK: DemoAuthenticationHandler rejected authentication attempt in '{Environment}'. " +
                "Simulated headers '{UserHeader}' and '{RoleHeader}' are insecure and strictly forbidden outside Development/Test.",
                _environment.EnvironmentName,
                InsecureDemoUserHeader,
                InsecureDemoRoleHeader);

            return Task.FromResult(AuthenticateResult.Fail(
                $"DemoAuthenticationHandler is restricted exclusively to Development and Test environments. " +
                $"Headers '{InsecureDemoUserHeader}' and '{InsecureDemoRoleHeader}' are insecure simulated headers and cannot be used in Production."));
        }

        if (!Request.Headers.TryGetValue(InsecureDemoUserHeader, out var userHeader) ||
            string.IsNullOrWhiteSpace(userHeader))
        {
            return Task.FromResult(AuthenticateResult.NoResult());
        }

        var username = userHeader.ToString().Trim();
        var role = Request.Headers.TryGetValue(InsecureDemoRoleHeader, out var roleHeader) &&
                   !string.IsNullOrWhiteSpace(roleHeader)
            ? roleHeader.ToString().Trim()
            : "Viewer";

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, username),
            new Claim(ClaimTypes.Name, username),
            new Claim(ClaimTypes.Role, role),
            new Claim("HospitalAffiliation", "SamchukHospital"),
            new Claim("AuthenticationMode", "DemoSimulation_DevTestOnly")
        };

        var identity = new ClaimsIdentity(claims, SchemeName);
        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(principal, SchemeName);

        return Task.FromResult(AuthenticateResult.Success(ticket));
    }
}
