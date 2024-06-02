const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(bodyParser.json());

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

app.post('/dream', async (req, res) => {
    console.log('asd');
    const { firstName, lastName, gender, age, dream, language } = req.body;
    console.log(req.body,'hey')
    if (!firstName || !lastName || !gender || !age || !dream) {
        return res.status(400).json({ error: 'Tüm alanlar gereklidir' });
    }

    try {
        const openaiResponse = await getDreamInterpretation({ firstName, lastName, gender, age, dream, language });
        await sendToThirdParty({ firstName, lastName, gender, age, dream });

        res.json(openaiResponse);
    } catch (error) {
        console.error('Rüya işlenirken hata oluştu:', error.message);
        res.status(500).json({ error: 'Rüya işlenirken hata oluştu' });
    }
});

async function getDreamInterpretation({ firstName, lastName, gender, age, dream, language }) {
    const apiKey = process.env.OPENAI_API_KEY;
    const url = 'https://api.openai.com/v1/chat/completions';

    let prompt;
    if (language === 'en') {
        prompt = `A ${age}-year-old ${gender} named ${firstName} ${lastName} had the following dream: ${dream}. Can you provide a detailed interpretation of this dream? Please also include insights on how this dream might relate to their personal growth, emotional state, and any advice for their daily life.`;
    } else {
        prompt = `Bir ${age} yaşındaki ${gender} olan ${firstName} ${lastName} şu rüyayı gördü: ${dream}. Bu rüyayı detaylı bir şekilde yorumlayabilir misiniz? Lütfen rüyanın kişisel gelişim, duygusal durum ve günlük hayata dair ipuçlarını da içerecek şekilde açıklayın.`;
    }

    const payload = {
        model: 'gpt-3.5-turbo',
        messages: [
            { role: 'system', content: 'You are a helpful assistant.' },
            { role: 'user', content: prompt }
        ],
        max_tokens: 1000,
    };

    try {
        const response = await axios.post(url, payload, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            }
        });

        if (response.status !== 200) {
            throw new Error(`OpenAI API returned status code ${response.status}`);
        }

        const assistantMessage = response.data.choices[0].message.content;
        return { interpretation: assistantMessage };
    } catch (error) {
        console.error('Error contacting OpenAI API:', error.response ? error.response.data : error.message);
        throw new Error('Error contacting OpenAI API');
    }
}

async function sendToThirdParty(data) {
    // Placeholder for actual third-party integration
    // Example: await axios.post('https://thirdpartyapi.com/endpoint', data);
    return;
}

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
