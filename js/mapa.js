/* ============================================================
   VÉRTICE GIN — Mapa interactivo (Leaflet)
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  const mapContainer = document.getElementById('mapa-puntos-venta');
  if (!mapContainer) return;

  // Puntos de venta (coordenadas aproximadas de la zona)
  const stores = [
    { name: 'Pasteur — Destilería Vértice', lat: -35.1412, lng: -62.2442, addr: 'Pasteur, Lincoln, Bs. As.', wa: 'Pedí directo' },
    { name: 'Lincoln — Almacén de Bebidas',   lat: -34.8667, lng: -61.5333, addr: 'Lincoln Centro, Bs. As.', wa: 'Consultar stock' },
    { name: 'Junín — Licorería El Encuentro', lat: -34.5850, lng: -60.9467, addr: 'Junín, Bs. As.', wa: 'Consultar stock' },
    { name: 'Salto — Bodegón Salteño',         lat: -34.2928, lng: -60.2503, addr: 'Salto, Bs. As.', wa: 'Consultar stock' },
    { name: 'CABA — Barrio Norte',             lat: -34.5881, lng: -58.4002, addr: 'CABA', wa: 'Consultar stock' },
    { name: 'CABA — Palermo',                  lat: -34.5800, lng: -58.4200, addr: 'Palermo, CABA', wa: 'Consultar stock' },
  ];

  // Load Leaflet from CDN dynamically
  function loadLeaflet(callback) {
    if (typeof L !== 'undefined') { callback(); return; }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = callback;
    document.body.appendChild(script);
  }

  loadLeaflet(() => {
    const map = L.map(mapContainer, {
      center: [-34.8, -61.5],
      zoom: 8,
      scrollWheelZoom: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://openstreetmap.org/copyright">OSM</a>',
      maxZoom: 18,
    }).addTo(map);

    // Custom icon (SVG inline — cobre colored pin)
    const icon = L.divIcon({
      html: `<svg width="32" height="40" viewBox="0 0 32 40" fill="none">
        <path d="M16 0C7.16 0 0 7.16 0 16c0 12 16 24 16 24s16-12 16-24C32 7.16 24.84 0 16 0z" fill="#8B6914"/>
        <circle cx="16" cy="15" r="7" fill="#F5F0E8"/>
        <text x="16" y="18" text-anchor="middle" fill="#8B6914" font-size="8" font-weight="bold">V</text>
      </svg>`,
      iconSize: [32, 40],
      iconAnchor: [16, 40],
      popupAnchor: [0, -40],
      className: '',
    });

    stores.forEach(store => {
      const marker = L.marker([store.lat, store.lng], { icon }).addTo(map);
      marker.bindPopup(`
        <strong style="font-family:serif;font-size:1rem;">${store.name}</strong><br>
        <span style="font-size:0.85rem;color:#5D4E37;">${store.addr}</span><br>
        <a href="https://wa.me/549XXXXXXXXXX?text=Hola%2C%20quiero%20consultar%20por%20${encodeURIComponent(store.wa)}"
           target="_blank"
           style="display:inline-block;margin-top:8px;padding:6px 14px;background:#25D366;color:white;border-radius:20px;text-decoration:none;font-size:0.85rem;font-weight:600;">
          💬 ${store.wa}
        </a>
      `);
    });

    // Fit bounds to markers
    if (stores.length > 1) {
      const bounds = stores.map(s => [s.lat, s.lng]);
      map.fitBounds(bounds, { padding: [50, 50] });
    }

    // Enable scroll on click/tap
    map.on('click', () => { map.scrollWheelZoom.enable(); });
    map.on('mouseout', () => { map.scrollWheelZoom.disable(); });
  });
});