// profissionais/profissionais.js - Script para página de profissionais
document.addEventListener('DOMContentLoaded', () => {
    console.log('👥 Sistema de profissionais iniciado');
    
    carregarProfissionais();
});

function carregarProfissionais() {
    const medicos = database.getMedicos() || [];
    const container = document.getElementById('listaProfissionais');
    container.innerHTML = '';

    medicos.forEach(medico => {
        const iniciais = medico.nome.split(' ').map(n => n[0]).join('').toUpperCase();
        const cardHTML = `
            <div class="col-md-4">
                <div class="card profissional-card text-center">
                    <div class="card-body">
                        <div class="profissional-avatar">${iniciais}</div>
                        <h5 class="card-title">${medico.nome}</h5>
                        <p class="profissional-especialidade">${medico.especialidade}</p>
                        <p class="profissional-bio">${medico.biografia || 'Profissional qualificado'}</p>
                        <small class="text-muted">CRM: ${medico.crm}</small>
                    </div>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', cardHTML);
    });
}