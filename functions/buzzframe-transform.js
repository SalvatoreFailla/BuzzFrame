// functions/buzzframe-transform.js
const axios = require('axios');

exports.handler = async function (event) {
  // CORS Preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: 'Preflight OK',
    };
  }

  // Nur POST erlauben
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ message: 'Method Not Allowed' }),
    };
  }

  const MAKE_WEBHOOK_URL = process.env.MAKE_WEBHOOK_URL;
  const SECRET = process.env.MAKE_SECRET;

  if (!MAKE_WEBHOOK_URL) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ message: 'MAKE_WEBHOOK_URL not configured' }),
    };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (e) {
    return {
      statusCode: 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ message: 'Invalid JSON payload' }),
    };
  }

  // Secret für Make anhängen, falls gesetzt
  if (SECRET) {
    payload.secret = SECRET;
  }

  try {
    const response = await axios.post(MAKE_WEBHOOK_URL, payload, {
      headers: { 'Content-Type': 'application/json' },
    });

    const data = response.data;
    let text;

    if (typeof data === 'string') {
      // Make liefert Plaintext
      text = data;
    } else if (data && (data.text || data.output)) {
      // Make liefert JSON mit text/output
      text = data.text || data.output;
    } else {
      // Fallback: komplettes JSON als Text
      text = JSON.stringify(data);
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Error calling Make webhook',
        error: error.message,
      }),
    };
  }
};
