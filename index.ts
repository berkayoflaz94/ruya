import express, { Request, Response } from 'express';
import axios from 'axios';
import dotenv from 'dotenv';

// .env dosyasını yükle
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// CORS hatasını önlemek için gerekli başlıkları ekleyelim
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

// /dream endpoint'ini OpenAI API'sine yönlendirme
app.post('/dream', async (req: Request, res: Response) => {
    const { firstName, lastName, gender, age, dream, language } = req.body;

    if (!firstName || !lastName || !gender || !age || !dream || !language) {
        return res.status(400).json({ error: 'Tüm alanlar gereklidir' });
    }

    try {
        const openaiResponse = await getDreamInterpretation({ firstName, lastName, gender, age, dream, language });
        res.json(openaiResponse);
    } catch (error: any) {
        console.error('Rüya işlenirken hata oluştu:', error.message);
        res.status(500).json({ error: 'Rüya işlenirken hata oluştu' });
    }
});

async function getDreamInterpretation({ firstName, lastName, gender, age, dream, language }: {
    firstName: string,
    lastName: string,
    gender: string,
    age: number,
    dream: string,
    language: string
}) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        throw new Error('API key is missing');
    }

    const url = 'https://api.openai.com/v1/chat/completions';

    let prompt;
    if (language === 'tr') {
        prompt = `Bir ${age} yaşındaki ${gender} olan ${firstName} ${lastName} şu rüyayı gördü: ${dream}. Bu rüyayı detaylı bir şekilde yorumlayabilir misiniz? Lütfen rüyanın kişisel gelişim, duygusal durum ve günlük hayata dair ipuçlarını da içerecek şekilde açıklayın.`;
    } else {
        prompt = `A ${age}-year-old ${gender} named ${firstName} ${lastName} had the following dream: ${dream}. Can you provide a detailed interpretation of this dream? Please also include insights on how this dream might relate to their personal growth, emotional state, and any advice for their daily life.`;
    }

    const payload = {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
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

        const assistantMessage = response.data.choices[0].message.content.trim();
        return { interpretation: assistantMessage };
    } catch (error: any) {
        console.error('Error contacting OpenAI API:', error.response ? error.response.data : error.message);
        throw new Error('Error contacting OpenAI API');
    }
}

app.listen(PORT, () => {
    console.log(`Proxy server is running on port ${PORT}`);
});
