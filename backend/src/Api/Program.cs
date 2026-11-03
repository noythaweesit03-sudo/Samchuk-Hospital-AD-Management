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

// Dependency Injection:
// In Phase 1, strictly register Mock Directory Reader and In-Memory Audit Repository
builder.Services.AddSingleton<IDirectoryReadService, LdapReadServiceMock>();
builder.Services.AddSingleton<IAuditLogRepository, InMemoryAuditLogRepository>();

// =========================================================================
// PHASE 2 & 3 AUTHENTICATION / AUTHORIZATION DESIGN:
// =========================================================================
// In Phase 1 Mock mode, backend RBAC is NOT enforced; mock data is returned directly.
// For Phase 2/3 live deployment, authentication must be activated via:
//
// 1. Windows Authentication (Negotiate / Kerberos) on Hospital Intranet:
//    builder.Services.AddAuthentication(NegotiateDefaults.AuthenticationScheme)
//                   .AddNegotiate();
//
// 2. OR Enterprise Hospital OIDC/JWT Bearer Token:
//    builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
//                   .AddJwtBearer(options => {
//                       options.Authority = builder.Configuration["Authentication:Authority"];
//                       options.Audience = "samchuk-ad-mgmt";
//                   });
//
// 3. Claims Transformation to UserRole (Viewer, Helpdesk, ADOperator, SecurityAuditor, SystemAdministrator):
//    builder.Services.AddTransient<IClaimsTransformation, HospitalAdRoleClaimsTransformation>();
//
// 4. Role Authorization Policies:
//    builder.Services.AddAuthorization(options => {
//        options.AddPolicy("AuditorOnly", policy => policy.RequireRole("SecurityAuditor", "SystemAdministrator"));
//        options.AddPolicy("ConfigAccess", policy => policy.RequireRole("ADOperator", "SecurityAuditor", "SystemAdministrator"));
//    });
//
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

// PRODUCTION SECURITY GUARD (Directive 5):
// Prohibits exposing unauthenticated Phase 1 Mock endpoints to production network.
if (!app.Environment.IsDevelopment())
{
    app.Use(async (context, next) =>
    {
        var allowMockInProd = app.Configuration.GetValue<bool>("Security:AllowUnauthenticatedMockInProduction", false);
        var isAuthenticated = context.User.Identity?.IsAuthenticated ?? false;

        if (!allowMockInProd && !isAuthenticated && context.Request.Path.StartsWithSegments("/api"))
        {
            // Allow health check endpoint only
            if (context.Request.Path.StartsWithSegments("/api/health"))
            {
                await next();
                return;
            }

            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsJsonAsync(new
            {
                error = "Unauthenticated Phase 1 Mock endpoints are forbidden in Production. Access requires Phase 2/3 Enterprise Authentication.",
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
