using Microsoft.EntityFrameworkCore;

public class PostoDbContext : DbContext
{
    public DbSet<User> Users { get; set; }
    public DbSet<Paciente> Pacientes { get; set; }
    public DbSet<Medico> Medicos { get; set; }
    public DbSet<Agendamento> Agendamentos { get; set; }
    public DbSet<Servico> Servicos { get; set; }
    public DbSet<Laudo> Laudos { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        optionsBuilder.UseNpgsql("Host=localhost;Database=posto_ararangua_db;Username=postgres;Password=20679Acer");
    }
}