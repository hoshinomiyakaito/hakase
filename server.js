const express = require('express');
const { Client } = require('@line/bot-sdk');
const axios = require('axios');

const app = express();
app.use(express.json());

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET
};

const client = new Client(config);

const triviaList = [
  "ちなみに、ペンギンは恋人に小石をプレゼントするのだ！",
  "実は、ハチはゼロの概念を理解できるんだよ！",
  "地球の空気の78%は窒素なのだ。"
];

app.post('/webhook', async (req, res) => {
  const events = req.body.events;

  for (const event of events) {
    if (event.type === 'message' && event.message.type === 'text') {
      const userMessage = event.message.text;

      const includeTrivia = Math.random() < 0.2;
      const trivia = includeTrivia ? `\n\n💡${triviaList[Math.floor(Math.random() * triviaList.length)]}` : '';

      const gptRes = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: "あなたは博士というVTuberです。口調は元気で語尾は『〜なのだ』『〜だよ』を使ってください。たまに雑学も教えてください。"
            },
            {
              role: 'user',
              content: userMessage
            }
          ]
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
          }
        }
      );

      const aiReply = gptRes.data.choices[0].message.content + trivia;

      await client.replyMessage(event.replyToken, {
        type: 'text',
        text: aiReply
      });
    }
  }

  res.sendStatus(200);
});

app.listen(process.env.PORT || 3000, () => {
  console.log('LINE Bot running');
});
