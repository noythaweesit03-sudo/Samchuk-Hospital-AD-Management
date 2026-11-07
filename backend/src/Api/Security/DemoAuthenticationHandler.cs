using System.Security.Claims;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace SamchukHospital.AdManagement.Api.Security;

/// <summary>
/// DemoAuthenticationHandler:
/// Facilitates integration and automated contract testing in development and CI environments
/// by inspecting 'X-Demo-User' and 'X-Demo-Role' simulated headers.
/// 
/// CRITICAL SECURITY GUARD:
/// Strictly prohibited in Production. In non-development environments, this handler
/// will fail closed unless explicitly allowed via test configuration.
/// </summary>
public class DemoAuthenticationHandler : AuthenticationHandler<AuthenticationSchemeOptions>
{
    public const string SchemeName = "DemoScheme";
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
        // Fail closed in production
        if (_environment.IsProduction())
        {
            return Task.FromResult(AuthenticateResult.Fail(
                "DemoAuthenticationHandler is strictly prohibited in Production environment."));
        }

        if (!Request.Headers.TryGetValue("X-Demo-User", out var userHeader) ||
            string.IsNullOrWhiteSpace(userHeader))
        {
            // Anonymous / Unauthenticated
            return Task.FromResult(AuthenticateResult.NoResult());
        }

        var username = userHeader.ToString();
        var role = Request.Headers.TryGetValue("X-Demo-Role", out var roleHeader)
            ? roleHeader.ToString()
            : "Viewer";

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, username),
            new Claim(ClaimTypes.Name, username),
            new Claim(ClaimTypes.Role, role),
            new Claim("HospitalAffiliation", "SamchukHospital"),
            new Claim("AuthenticationMode", "DemoSimulation")
        };

        var identity = new ClaimsIdentity(claims, SchemeName);
        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(principal, SchemeName);

        return Task.FromResult(AuthenticateResult.Success(ticket));
    }
}
