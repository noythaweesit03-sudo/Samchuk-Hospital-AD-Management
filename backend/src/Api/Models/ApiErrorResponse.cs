namespace SamchukHospital.AdManagement.Api.Models;

/// <summary>
/// Standard API Error Response DTO for Samchuk Hospital AD Management Web API.
/// Consistent across all endpoints.
/// </summary>
public class ApiErrorResponse
{
    public string Error { get; set; } = string.Empty;
    public string Code { get; set; } = "ERROR";
    public string RequestId { get; set; } = Guid.NewGuid().ToString("N");
    public DateTime TimestampUtc { get; set; } = DateTime.UtcNow;
}
