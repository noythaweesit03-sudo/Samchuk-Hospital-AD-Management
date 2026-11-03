namespace SamchukHospital.AdManagement.Domain.Entities;

public class AdComputer
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string DnsHostName { get; set; } = string.Empty;
    public string OperatingSystem { get; set; } = string.Empty;
    public string OperatingSystemVersion { get; set; } = string.Empty;
    public string DistinguishedName { get; set; } = string.Empty;
    public string OuPath { get; set; } = string.Empty;
    public string Status { get; set; } = "Enabled";
    
    // Explicitly approximate, never asserting real-time online status
    public DateTime? LastLogonTimestamp { get; set; }
    public string? IpAddressSimulated { get; set; }
    public bool BitLockerConfigured { get; set; }
    public string DepartmentTag { get; set; } = string.Empty;
    public DateTime CreatedDate { get; set; }
}
