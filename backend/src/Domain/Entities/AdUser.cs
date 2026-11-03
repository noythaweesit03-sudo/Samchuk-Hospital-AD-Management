namespace SamchukHospital.AdManagement.Domain.Entities;

public class AdUser
{
    public string Id { get; set; } = string.Empty;
    public string SamAccountName { get; set; } = string.Empty;
    public string UserPrincipalName { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Office { get; set; } = string.Empty;
    public string TelephoneNumber { get; set; } = string.Empty;
    public string EmployeeId { get; set; } = string.Empty;
    public string DistinguishedName { get; set; } = string.Empty;
    public string OuPath { get; set; } = string.Empty;
    public string Status { get; set; } = "Enabled"; // Enabled, Disabled, LockedOut
    public int UserAccountControl { get; set; }
    public List<string> UacFlags { get; set; } = new();
    public DateTime? PasswordLastSet { get; set; }
    public DateTime? PasswordExpires { get; set; }
    public int BadPasswordCount { get; set; }
    
    // Explicitly labeled as approximate in accordance with Active Directory replication cycle
    public DateTime? LastLogonTimestamp { get; set; }
    public DateTime CreatedDate { get; set; }
    public List<string> MemberOf { get; set; } = new();
}
