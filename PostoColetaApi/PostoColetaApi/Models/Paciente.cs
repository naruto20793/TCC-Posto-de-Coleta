public class Paciente
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Cpf { get; set; }
    public DateTime? DataNascimento { get; set; }
    public string Endereco { get; set; }
    public string Telefone { get; set; }
    public string Convenio { get; set; }
    public User User { get; set; }
}