// Config
const ROUTING_API = 'https://api.digitransit.fi/routing/v1/routers/hsl/index/graphql';
const NOMINATIM_API = 'https://nominatim.openstreetmap.org/search';
const PROXY = 'https://users.metropolia.fi/~ilkkamtk/proxy.php?url=';
const SCHOOL_ADDRESS = 'Karaportti 2, Espoo';
const SCHOOL_COORDS = { lat: 60.2041, lon: 24.6559 }; // Karaportti 2, Espoo

// DOM Elements
const form = document.getElementById('routeForm');
const addressInput = document.getElementById('addressInput');
const suggestionsContainer = document.getElementById('suggestions');
const routeInfo = document.getElementById('routeInfo');
const error = document.getElementById('error');
const loading = document.getElementById('loading');

// Map
let map = null;
let routeLayer = null;
let markerGroup = null;

window.addEventListener('DOMContentLoaded', () => {
    initMap();
    setupEventListeners();
});

function initMap() {
    map = L.map('map').setView([60.1699, 24.9384], 11);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    markerGroup = L.featureGroup().addTo(map);
    routeLayer = L.featureGroup().addTo(map);
}

function setupEventListeners() {
    form.addEventListener('submit', handleFormSubmit);
    addressInput.addEventListener('input', handleAddressInput);
    addressInput.addEventListener('focus', () => {
        if (suggestionsContainer.children.length > 0) {
            suggestionsContainer.classList.add('active');
        }
    });
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.form-group')) {
            closeSuggestions();
        }
    });
}

async function handleAddressInput(e) {
    const query = e.target.value.trim();

    if (query.length < 3) {
        closeSuggestions();
        return;
    }

    try {
        const suggestions = await searchAddresses(query);
        displaySuggestions(suggestions);
    } catch (err) {
        console.error('Search error:', err);
        showError(`Search error: ${err.message}`);
    }
}

async function searchAddresses(query) {
    console.log('Searching for:', query);

    const url = PROXY + encodeURIComponent(NOMINATIM_API + `?q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=fi`);

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('API response:', data);

    // Parse Nominatim response
    const places = data.map(item => ({
        label: item.display_name,
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon)
    })) || [];

    console.log('Parsed places:', places);
    return places;
}

function displaySuggestions(suggestions) {
    suggestionsContainer.innerHTML = '';

    if (suggestions.length === 0) {
        closeSuggestions();
        return;
    }

    suggestions.forEach(suggestion => {
        const item = document.createElement('div');
        item.className = 'suggestion-item';
        item.textContent = suggestion.label;
        item.addEventListener('click', () => selectSuggestion(suggestion));
        suggestionsContainer.appendChild(item);
    });

    suggestionsContainer.classList.add('active');
}

function selectSuggestion(suggestion) {
    addressInput.value = suggestion.label;
    addressInput.dataset.lat = suggestion.lat;
    addressInput.dataset.lon = suggestion.lon;
    closeSuggestions();
}

function closeSuggestions() {
    suggestionsContainer.classList.remove('active');
}

async function handleFormSubmit(e) {
    e.preventDefault();

    const address = addressInput.value.trim();
    const startLat = parseFloat(addressInput.dataset.lat);
    const startLon = parseFloat(addressInput.dataset.lon);

    if (!address || !startLat || !startLon) {
        showError('Please select a valid address from the suggestions');
        return;
    }

    clearMessages();
    showLoading();

    try {
        const route = await getRoute(startLat, startLon, SCHOOL_COORDS.lat, SCHOOL_COORDS.lon);
        displayRoute(route, address);
        closeSuggestions();
    } catch (err) {
        showError(`Error fetching route: ${err.message}`);
    } finally {
        hideLoading();
    }
}

async function getRoute(startLat, startLon, endLat, endLon) {
    const graphqlQuery = `{
        plan(
            from: {lat: ${startLat}, lon: ${startLon}}
            to: {lat: ${endLat}, lon: ${endLon}}
            numItineraries: 1
        ) {
            itineraries {
                startTime
                endTime
                duration
                legs {
                    startTime
                    endTime
                    distance
                    leg {
                        startTime
                        endTime
                    }
                    from {
                        lat
                        lon
                    }
                    to {
                        lat
                        lon
                    }
                }
            }
        }
    }`;

    const url = PROXY + encodeURIComponent(ROUTING_API);

    const response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify({ query: graphqlQuery })
    });

    const data = await response.json();

    if (data.errors) {
        throw new Error(data.errors[0].message);
    }

    const itineraries = data.data?.plan?.itineraries;
    if (!itineraries || itineraries.length === 0) {
        throw new Error('No route found');
    }

    return itineraries[0];
}

function displayRoute(route, startAddress) {
    markerGroup.clearLayers();
    routeLayer.clearLayers();

    const coordinates = [];
    route.legs.forEach(leg => {
        coordinates.push([leg.from.lat, leg.from.lon]);
        coordinates.push([leg.to.lat, leg.to.lon]);
    });

    const uniqueCoords = [];
    coordinates.forEach(coord => {
        if (!uniqueCoords.some(c => c[0] === coord[0] && c[1] === coord[1])) {
            uniqueCoords.push(coord);
        }
    });

    if (uniqueCoords.length > 0) {
        const polyline = L.polyline(uniqueCoords, {
            color: '#3498db',
            weight: 4,
            opacity: 0.8
        }).addTo(routeLayer);

        L.marker([uniqueCoords[0][0], uniqueCoords[0][1]], {
            title: 'Start'
        }).bindPopup(`<strong>Start:</strong> ${startAddress}`).addTo(markerGroup).openPopup();

        L.marker([uniqueCoords[uniqueCoords.length - 1][0], uniqueCoords[uniqueCoords.length - 1][1]], {
            title: 'End'
        }).bindPopup(`<strong>End:</strong> ${SCHOOL_ADDRESS}`).addTo(markerGroup);

        const group = new L.featureGroup([polyline, markerGroup]);
        map.fitBounds(group.getBounds().pad(0.1));
    }

    displayRouteInfo(route);
}

function displayRouteInfo(route) {
    const startTime = new Date(route.startTime);
    const endTime = new Date(route.endTime);
    const duration = Math.round(route.duration / 60);
    const distance = route.legs.reduce((sum, leg) => sum + leg.distance, 0).toFixed(0);

    document.getElementById('startTime').textContent = startTime.toLocaleTimeString('fi-FI', {
        hour: '2-digit',
        minute: '2-digit'
    });

    document.getElementById('endTime').textContent = endTime.toLocaleTimeString('fi-FI', {
        hour: '2-digit',
        minute: '2-digit'
    });

    document.getElementById('duration').textContent = `${duration} minutes`;
    document.getElementById('distance').textContent = `${distance} meters`;

    routeInfo.classList.remove('hidden');
}

function showError(msg) {
    error.textContent = msg;
    error.classList.remove('hidden');
}

function showLoading() {
    loading.classList.remove('hidden');
}

function hideLoading() {
    loading.classList.add('hidden');
}

function clearMessages() {
    error.classList.add('hidden');
    routeInfo.classList.add('hidden');
}