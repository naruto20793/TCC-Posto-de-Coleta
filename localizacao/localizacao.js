// localizacao/localizacao.js - Script para página de localização
let map;

function initMap() {
    const config = database.getItem('configuracoes');
    const location = { lat: -28.935, lng: -49.485 }; // Coordenadas aproximadas de Araranguá

    map = new google.maps.Map(document.getElementById('mapa'), {
        center: location,
        zoom: 15,
        mapTypeControl: true,
        streetViewControl: true,
        zoomControl: true,
        fullscreenControl: true
    });

    const marker = new google.maps.Marker({
        position: location,
        map,
        title: config.nomeClinica || 'Policlínica Araranguá',
        animation: google.maps.Animation.DROP
    });

    const infoWindow = new google.maps.InfoWindow({
        content: '<h5>Policlínica Araranguá</h5><p>Rua Petronilha Jamic, 160<br>Centro, Araranguá - SC</p>'
    });

    marker.addListener('click', () => {
        infoWindow.open(map, marker);
    });

    // Adicionar estilos customizados (opcional)
    map.setOptions({
        styles: [
            {
                featureType: 'poi.medical',
                elementType: 'geometry',
                stylers: [{ color: '#ff0000' }]
            }
        ]
    });
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('🗺️ Sistema de localização iniciado');
    // initMap é chamado via callback da API do Google

    // Função para abrir mapa externo
    window.abrirMapa = function() {
        const endereco = encodeURIComponent('Rua Petronilha Jamic, 160, Centro, Araranguá - SC');
        window.open(`https://www.google.com/maps/search/?api=1&query=${endereco}`, '_blank');
    };
});