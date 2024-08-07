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
        //await sendToThirdParty({ firstName, lastName, gender, age, dream });

        res.json(openaiResponse);
    } catch (error) {
        console.error('Rüya işlenirken hata oluştu:', error.message);
        res.status(500).json({ error: 'Rüya işlenirken hata oluştu' });
    }
});
async function getDreamInterpretation({ firstName, lastName, gender, age, dream, language }) {
    const apiKey = process.env.OPENAI_API_KEY;
    const url = 'https://api.openai.com/v1/chat/completions';

    const prompt = language === 'en' 
        ? `Dream: ${dream}. Provide a detailed interpretation including personal growth, emotional state, and daily life advice. Avoid starting with phrases like "Sure," and use a friendly and informal tone.`
        : `Rüya: ${dream}. Bu rüyayı detaylı bir şekilde yorumla. Kişisel gelişim, duygusal durum ve günlük hayata dair tavsiyeler ver. "Tabii ki," gibi ifadeler kullanmadan samimi ve doğrudan bir dil kullan.`;

    const systemMessage = {
        role: 'system',
        content: `Sen, Dr. Serhat Çelik'sin.`
    };

    const payload = {
        model: 'gpt-3.5-turbo',
        messages: [
            systemMessage,
            { role: 'user', content: prompt }
        ],
        max_tokens: 500, // Yanıtların tamamlanması için artırıldı
        temperature: 0.3, // Dengeli yanıtlar için ayarlandı
        top_p: 1,
    };

    try {
        const startTime = Date.now(); // Başlangıç zamanını kaydediyoruz

        const response = await axios.post(url, payload, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            }
        });

        const endTime = Date.now(); // Bitiş zamanını kaydediyoruz
        console.log(`API yanıt süresi: ${(endTime - startTime) / 1000} saniye`);

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

module.exports = getDreamInterpretation;


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
