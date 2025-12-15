const express = require('express');
const router = express.Router();
const SavedEvent = require('../models/SavedEvent');
const ticketmasterService = require('../services/ticketmasterService');

router.get('/', async (req, res) => {
  try {
    const savedEvents = await SavedEvent.find().sort({ createdAt: -1 });
    
    res.render('pages/wishlist', {
      title: 'My Wishlist',
      events: savedEvents,
      error: null,
      success: req.query.success || null
    });
  } catch (error) {
    console.error('Error fetching wishlist:', error.message);
    res.render('pages/wishlist', {
      title: 'My Wishlist',
      events: [],
      error: 'Failed to load your wishlist. Please try again.',
      success: null
    });
  }
});

router.post('/', async (req, res) => {
  const {
    ticketmasterId,
    name,
    dateTime,
    venueName,
    address,
    city,
    state,
    lat,
    lng,
    url,
    imageUrl
  } = req.body;

  if (!ticketmasterId || !name) {
    return res.redirect('/events/search?error=Missing+event+information');
  }

  try {
    const existingEvent = await SavedEvent.findOne({ ticketmasterId });
    
    if (existingEvent) {
      return res.redirect('/wishlist?success=Event+is+already+in+your+wishlist');
    }

    const savedEvent = new SavedEvent({
      ticketmasterId,
      name,
      dateTime: dateTime || null,
      venueName: venueName || '',
      address: address || '',
      city: city || '',
      state: state || '',
      lat: lat ? parseFloat(lat) : null,
      lng: lng ? parseFloat(lng) : null,
      url: url || '',
      imageUrl: imageUrl || '',
      notes: ''
    });

    await savedEvent.save();
    res.redirect('/wishlist?success=Event+saved+to+wishlist!');

  } catch (error) {
    console.error('Error saving event:', error.message);
    
    if (error.code === 11000) {
      return res.redirect('/wishlist?success=Event+is+already+in+your+wishlist');
    }
    
    res.redirect('/events/search?error=Failed+to+save+event');
  }
});

router.get('/:id', async (req, res) => {
  try {
    const event = await SavedEvent.findById(req.params.id);
    
    if (!event) {
      return res.render('pages/error', {
        title: 'Event Not Found',
        message: 'The requested event was not found in your wishlist.'
      });
    }

    res.render('pages/event', {
      title: event.name,
      event: event,
      error: null,
      success: req.query.success || null
    });

  } catch (error) {
    console.error('Error fetching event:', error.message);
    res.render('pages/error', {
      title: 'Error',
      message: 'Failed to load event details.'
    });
  }
});

router.post('/:id/notes', async (req, res) => {
  const { notes } = req.body;

  try {
    const event = await SavedEvent.findByIdAndUpdate(
      req.params.id,
      { notes: notes || '' },
      { new: true }
    );

    if (!event) {
      return res.render('pages/error', {
        title: 'Event Not Found',
        message: 'The requested event was not found in your wishlist.'
      });
    }

    res.redirect(`/wishlist/${req.params.id}?success=Notes+updated+successfully!`);

  } catch (error) {
    console.error('Error updating notes:', error.message);
    res.redirect(`/wishlist/${req.params.id}?error=Failed+to+update+notes`);
  }
});

router.post('/:id/delete', async (req, res) => {
  try {
    const event = await SavedEvent.findByIdAndDelete(req.params.id);

    if (!event) {
      return res.redirect('/wishlist?error=Event+not+found');
    }

    res.redirect('/wishlist?success=Event+removed+from+wishlist');

  } catch (error) {
    console.error('Error deleting event:', error.message);
    res.redirect('/wishlist?error=Failed+to+remove+event');
  }
});

module.exports = router;
