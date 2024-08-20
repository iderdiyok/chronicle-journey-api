const dotenv = require('dotenv');
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

dotenv.config();
const port = process.env.PORT;
app.use(express.json());
app.use(cors());

app.get('/events', async (req, res) => {
  const { date, lang } = req.query;
  console.log(date, lang);

  const apiEndpoint = 'https://api.openai.com/v1/chat/completions';
  const apiKey = process.env.OPENAI_API_KEY;

  const prompt = `List important historical events from ${date} to today in the language ${lang}. Include a short summary and detailed description for each event. Make sure that the data is formatted clearly and consistently in your language locale format and that each event has a short summary and a detailed description.`;

  try {
    const response = await axios.post(apiEndpoint, {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1500,
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    const eventsText = response.data.choices[0].message.content.trim();


    // Process the events text
    const events = eventsText.split('\n\n').map((event, index) => {
        const parts = event.split('\n');
        if (parts.length < 2) return null;

        // Extract and format date
        const datePart = parts[0].match(/^\d{4}(-\d{2})?(-\d{2})?/);
        const summary = parts[0].replace(datePart ? datePart[0] : '', '').trim().replace(/^\d+\.\s*/, '');
        const details = parts.slice(1).join('\n').trim();

        return {
            id: index + 1,
            summary: summary,
            details: details || ''
        };
    }).filter(event => event && event.summary.trim() !== '');

    console.log('Processed events:', events);
    
    res.json(events);
  } catch (error) {
    console.error('Error fetching events from OpenAI:', error.message || error);
    res.status(500).json({ error: 'Failed to fetch events from OpenAI' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
