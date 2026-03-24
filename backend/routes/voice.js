const express = require('express');
const router = express.Router();
const { createClient } = require('@deepgram/sdk');

// Deepgram Token Proxy
router.get('/token', async (req, res) => {
  try {
    const key = process.env.DEEPGRAM_API_KEY;
    if (!key) {
      return res.status(500).json({ error: 'Deepgram API Key not configured' });
    }

    const deepgram = createClient(key);
    
    // Create a temporary, short-lived key
    const { result, error } = await deepgram.manage.createProjectKey(process.env.DEEPGRAM_PROJECT_ID, {
      comment: 'Temporary CoderSpeak token',
      scopes: ['usage:runtime'],
      time_to_live_in_seconds: 60
    });

    if (error) {
      console.error('[Deepgram Proxy Error]', error);
      return res.status(500).json({ error: 'Failed to generate token' });
    }

    res.json({ token: result.key });
  } catch (err) {
    console.error('[Deepgram Proxy Error]', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
