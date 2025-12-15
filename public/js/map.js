document.addEventListener('DOMContentLoaded', function() {
  if (window.wishlistEvents && document.getElementById('wishlist-map')) {
    initWishlistMap(window.wishlistEvents);
  }
  
  if (window.singleEvent && document.getElementById('event-map')) {
    initSingleEventMap(window.singleEvent);
  }
});

function initWishlistMap(events) {
  const eventsWithCoords = events.filter(e => e.lat && e.lng);
  
  if (eventsWithCoords.length === 0) {
    const mapContainer = document.getElementById('wishlist-map');
    mapContainer.innerHTML = `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        background-color: #1e1e26;
        color: #a0a0ab;
        text-align: center;
        padding: 2rem;
      ">
        <div>
          <div style="font-size: 3rem; margin-bottom: 1rem;">🗺️</div>
          <p>No event locations available to display on map.</p>
        </div>
      </div>
    `;
    return;
  }
  
  const avgLat = eventsWithCoords.reduce((sum, e) => sum + e.lat, 0) / eventsWithCoords.length;
  const avgLng = eventsWithCoords.reduce((sum, e) => sum + e.lng, 0) / eventsWithCoords.length;
  
  const map = L.map('wishlist-map').setView([avgLat, avgLng], 4);
  
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(map);
  
  const eventIcon = L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background: linear-gradient(135deg, #ff6b5b, #ff8577);
        width: 30px;
        height: 30px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 10px rgba(255, 107, 91, 0.4);
        border: 2px solid #fff;
      ">
        <span style="transform: rotate(45deg); font-size: 14px;">🎫</span>
      </div>
    `,
    iconSize: [30, 42],
    iconAnchor: [15, 42],
    popupAnchor: [0, -42]
  });
  
  const markers = [];
  eventsWithCoords.forEach(event => {
    const marker = L.marker([event.lat, event.lng], { icon: eventIcon })
      .addTo(map)
      .bindPopup(createPopupContent(event));
    markers.push(marker);
  });
  
  if (markers.length > 1) {
    const group = L.featureGroup(markers);
    map.fitBounds(group.getBounds().pad(0.1));
  } else if (markers.length === 1) {
    map.setView([eventsWithCoords[0].lat, eventsWithCoords[0].lng], 12);
  }
}

function initSingleEventMap(event) {
  if (!event.lat || !event.lng) {
    return;
  }
  
  const map = L.map('event-map').setView([event.lat, event.lng], 14);
  
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(map);
  
  const eventIcon = L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background: linear-gradient(135deg, #ff6b5b, #ff8577);
        width: 36px;
        height: 36px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 10px rgba(255, 107, 91, 0.4);
        border: 3px solid #fff;
      ">
        <span style="transform: rotate(45deg); font-size: 18px;">🎫</span>
      </div>
    `,
    iconSize: [36, 50],
    iconAnchor: [18, 50],
    popupAnchor: [0, -50]
  });
  
  L.marker([event.lat, event.lng], { icon: eventIcon })
    .addTo(map)
    .bindPopup(createPopupContent(event))
    .openPopup();
}

function createPopupContent(event) {
  let content = `<div class="popup-content">`;
  content += `<div class="popup-title">${escapeHtml(event.name)}</div>`;
  
  if (event.venueName) {
    content += `<div class="popup-venue">📍 ${escapeHtml(event.venueName)}</div>`;
  }
  
  if (event.city || event.state) {
    const location = [event.city, event.state].filter(Boolean).join(', ');
    content += `<div class="popup-venue">🏙️ ${escapeHtml(location)}</div>`;
  }
  
  if (event.dateTime) {
    const date = new Date(event.dateTime).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    content += `<div class="popup-venue">📅 ${date}</div>`;
  }
  
  content += `</div>`;
  return content;
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
