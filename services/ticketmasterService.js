const axios = require('axios');

const TICKETMASTER_BASE_URL = 'https://app.ticketmaster.com/discovery/v2/events.json';

async function searchEvents({ keyword, city, stateCode, startDateTime, endDateTime }) {
  try {
    const params = {
      apikey: process.env.TICKETMASTER_API_KEY,
      keyword: keyword,
      size: 20,
      sort: 'date,asc'
    };

    if (city) {
      params.city = city;
    }

    if (stateCode) {
      params.stateCode = stateCode;
    }

    if (startDateTime) {
      params.startDateTime = formatDateTimeForAPI(startDateTime);
    }

    if (endDateTime) {
      params.endDateTime = formatDateTimeForAPI(endDateTime);
    }

    const response = await axios.get(TICKETMASTER_BASE_URL, { params });

    if (!response.data._embedded || !response.data._embedded.events) {
      return [];
    }

    const events = response.data._embedded.events.map(normalizeEvent);
    return events;

  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      
      if (status === 401) {
        throw new Error('Invalid API key. Please check your Ticketmaster API configuration.');
      }
      
      if (status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a few moments.');
      }
      
      if (status >= 500) {
        throw new Error('Ticketmaster API is currently unavailable. Please try again later.');
      }
    }

    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      throw new Error('Unable to connect to Ticketmaster API. Please check your internet connection.');
    }

    throw new Error(`Error fetching events: ${error.message}`);
  }
}

async function getEventById(eventId) {
  try {
    const url = `https://app.ticketmaster.com/discovery/v2/events/${eventId}.json`;
    const response = await axios.get(url, {
      params: {
        apikey: process.env.TICKETMASTER_API_KEY
      }
    });

    return normalizeEvent(response.data);
  } catch (error) {
    if (error.response && error.response.status === 404) {
      throw new Error('Event not found.');
    }
    throw new Error(`Error fetching event: ${error.message}`);
  }
}

function normalizeEvent(event) {
  const venue = event._embedded?.venues?.[0] || {};
  const location = venue.location || {};
  
  let imageUrl = '';
  if (event.images && event.images.length > 0) {
    const preferredImage = event.images.find(img => img.ratio === '16_9' && img.width >= 500);
    imageUrl = preferredImage ? preferredImage.url : event.images[0].url;
  }

  const addressParts = [];
  if (venue.address?.line1) addressParts.push(venue.address.line1);
  
  return {
    id: event.id,
    name: event.name,
    dateTime: event.dates?.start?.dateTime || event.dates?.start?.localDate || null,
    localDate: event.dates?.start?.localDate || null,
    localTime: event.dates?.start?.localTime || null,
    venueName: venue.name || '',
    address: addressParts.join(', '),
    city: venue.city?.name || '',
    state: venue.state?.stateCode || venue.state?.name || '',
    lat: location.latitude ? parseFloat(location.latitude) : null,
    lng: location.longitude ? parseFloat(location.longitude) : null,
    url: event.url || '',
    imageUrl: imageUrl,
    priceRange: event.priceRanges?.[0] || null,
    genre: event.classifications?.[0]?.genre?.name || '',
    segment: event.classifications?.[0]?.segment?.name || ''
  };
}

function formatDateTimeForAPI(dateStr) {
  if (dateStr.includes('T')) {
    return dateStr.endsWith('Z') ? dateStr : dateStr + 'Z';
  }
  return `${dateStr}T00:00:00Z`;
}

module.exports = {
  searchEvents,
  getEventById,
  normalizeEvent
};
