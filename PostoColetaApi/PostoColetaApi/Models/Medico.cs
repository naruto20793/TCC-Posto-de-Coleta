public class Medico
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Crm { get; set; }
    public string Especialidade { get; set; }
    public string Biografia { get; set; }
    public User User { get; set; }
}