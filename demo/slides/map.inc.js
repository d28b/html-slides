const mapDiv = slide.getElementsByTagName('div')[0];
const map = L.map(mapDiv).setView([51.51, -0.11], 13);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

L.marker([51.5, -0.09]).addTo(map)
    .bindPopup('Our headquarters')
    .openPopup();
