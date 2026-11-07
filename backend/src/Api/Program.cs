using Microsoft.AspNetCore.Authentication;
using SamchukHospital.AdManagement.Api.Security;
using SamchukHospital.AdManagement.Application.Common.Interfaces;
using SamchukHospital.AdManagement.Infrastructure.Audit;
using SamchukHospital.AdManagement.Infrastructure.Directory;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new()
    {
        Title = "Samchuk Hospital AD Management API (Phase 1 Mock)",
        Version = "v1",
        Description = "ASP.NET Core Web API for Samchuk Hospital Active Directory Management (Mock Architecture & Read-Only Services)"
    });
});

// CORS: Strictly configure allowed origins (no wildcard with credentials)
builder.Services.AddCors(options =>
{
    options.AddPolicy("SamchukAppPolicy", policy =>
    {
        policy.WithOrigins("http://localhost:3000", "https://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Bind Phase 2A Active Directory & LDAPS Configuration Options (Placeholder-based, Feature Flag Disabled)
var adOptions = builder.Configuration
    .GetSection(ActiveDirectoryOptions.SectionName)
    .Get<ActiveDirectoryOptions>() ?? new ActiveDirectoryOptions();
builder.Services.AddSingleton(adOptions);

// Dependency Injection:
// In Phase 2A, strictly register Mock Directory Reader (Live AD connection remains hard-locked),
// Offline Connection Diagnostics Service, and In-Memory Audit Repository
builder.Services.AddSingleton<IDirectoryReadService, LdapReadServiceMock>();
builder.Services.AddSingleton<LdapsReadService>();
builder.Services.AddSingleton<IConnectionDiagnosticsService, LdapsDiagnosticsService>();
builder.Services.AddSingleton<IAuditLogRepository, InMemoryAuditLogRepository>();

// Always register Policy-Based RBAC policies across all environments
builder.Services.AddHospitalAdAuthorization();

// =========================================================================
// MOCK AUTHENTICATION (STRICTLY ISOLATED TO DEVELOPMENT & TEST ONLY):
// X-Demo-User and X-Demo-Role are insecure simulated headers for Dev/Test only.
// Never registered in Production.
// =========================================================================
var isDevOrTest = builder.Environment.IsDevelopment() || builder.Environment.IsEnvironment("Test");
if (isDevOrTest)
{
    builder.Services.AddAuthentication(DemoAuthenticationHandler.SchemeName)
                    .AddScheme<AuthenticationSchemeOptions, DemoAuthenticationHandler>(
                        DemoAuthenticationHandler.SchemeName, _ => { });
}
else
{
    builder.Services.AddAuthentication();
}

// CRITICAL SECURITY GUARD: IDirectoryWriteService is intentionally NOT registered!
// This guarantees zero write capabilities in Phase 1.
// =========================================================================

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("SamchukAppPolicy");

// Security Headers
app.Use(async (context, next) =>
{
    context.Response.Headers.Append("X-Content-Type-Options", "nosniff");
    context.Response.Headers.Append("X-Frame-Options", "DENY");
    context.Response.Headers.Append("X-XSS-Protection", "1; mode=block");
    context.Response.Headers.Append("Referrer-Policy", "strict-origin-when-cross-origin");
    await next();
});

app.UseAuthentication();

// STRICT PRODUCTION SECURITY GUARD (Zero-Override Enforcement):
// 1. Rejects any attempt to pass simulated headers (X-Demo-User / X-Demo-Role) outside Development/Test.
// 2. Prohibits exposing unauthenticated Phase 1 Mock API endpoints in Production.
// 3. No configuration overrides exist to weaken or bypass this guard.
if (!app.Environment.IsDevelopment() && !app.Environment.IsEnvironment("Test"))
{
    app.Use(async (context, next) =>
    {
        // Allow anonymous health check only
        if (context.Request.Path.StartsWithSegments("/api/health") || context.Request.Path.StartsWithSegments("/health"))
        {
            await next();
            return;
        }

        // Explicitly reject insecure simulated headers in Production
        if (context.Request.Headers.ContainsKey(DemoAuthenticationHandler.InsecureDemoUserHeader) ||
            context.Request.Headers.ContainsKey(DemoAuthenticationHandler.InsecureDemoRoleHeader))
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsJsonAsync(new
            {
                error = "Simulated authentication headers (X-Demo-User, X-Demo-Role) are insecure and strictly forbidden in Production.",
                code = "DEMO_HEADERS_FORBIDDEN_IN_PRODUCTION",
                requestId = context.TraceIdentifier,
                timestampUtc = DateTime.UtcNow
            });
            return;
        }

        var isAuthenticated = context.User.Identity?.IsAuthenticated ?? false;
        var isDemoScheme = string.Equals(
            context.User.Identity?.AuthenticationType,
            DemoAuthenticationHandler.SchemeName,
            StringComparison.OrdinalIgnoreCase);

        if ((!isAuthenticated || isDemoScheme) && context.Request.Path.StartsWithSegments("/api"))
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsJsonAsync(new
            {
                error = "Phase 1 Mock endpoints are strictly forbidden in Production without enterprise authentication. No configuration overrides are permitted.",
                code = "PRODUCTION_MOCK_FORBIDDEN",
                requestId = context.TraceIdentifier,
                timestampUtc = DateTime.UtcNow
            });
            return;
        }

        await next();
    });
}

app.UseAuthorization();
app.MapControllers();

app.Run();
