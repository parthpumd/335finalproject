const express = require('express');
const router = express.Router();
const ticketmasterService = require('../services/ticketmasterService');

router.get('/search', (req, res) => {
  res.render('pages/search', {
    title: 'Search Events',
    events: [],
    searchParams: {},
    error: null,
    searched: false
  });
});

router.post('/search', async (req, res) => {
  const { keyword, city, stateCode, startDateTime, endDateTime } = req.body;

  if (!keyword || keyword.trim() === '') {
    return res.render('pages/search', {
      title: 'Search Events',
      events: [],
      searchParams: req.body,
      error: 'Please enter a search keyword.',
      searched: false
    });
  }

  try {
    const events = await ticketmasterService.searchEvents({
      keyword: keyword.trim(),
      city: city?.trim() || null,
      stateCode: stateCode?.trim().toUpperCase() || null,
      startDateTime: startDateTime || null,
      endDateTime: endDateTime || null
    });

    res.render('pages/search', {
      title: 'Search Results',
      events: events,
      searchParams: req.body,
      error: null,
      searched: true
    });

  } catch (error) {
    console.error('Search error:', error.message);
    res.render('pages/search', {
      title: 'Search Events',
      events: [],
      searchParams: req.body,
      error: error.message,
      searched: true
    });
  }
});

router.get('/', (req, res) => {
  res.redirect('/events/search');
});

module.exports = router;
