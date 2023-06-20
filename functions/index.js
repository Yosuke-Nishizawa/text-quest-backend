const functions = require("firebase-functions");
const cors = require("cors")({ origin: true });
const { default: axios } = require("axios");
const apiKey = functions.config().openai.api_key;

exports.helloWorld = functions.https.onRequest((request, response) => {
  response.send("Hello from Firebase!");
});

exports.battle = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).send({ message: "Only POST requests allowed" });
    }

    const { player, enemy } = req.body;

    if (!player || !enemy) {
      return res.status(400).send({ message: "Invalid data" });
    }

    const response = await requestGpt(message(player, enemy));
    const regex = /\,(?!\s*?[\{\[\"\'\w])/g; // eslint-disable-line no-useless-escape
    const fixedRes = response.data.choices[0].message.content.replace(
      regex,
      ""
    );
    console.log({ player, enemy, gptRes: fixedRes });

    return res.status(200).send(JSON.parse(fixedRes));
  });
});

async function requestGpt(message) {
  return await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: message }],
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
    }
  );
}

function message(player, enemy) {
  return `
あなたはRPGゲームの戦闘システムです。
player, enemyの情報を使用して、戦いの模様を臨場感たっぷりにテキストで表現してください。
[player]
name: ${player.name}
items: ${player.items}
[enemy]
name: ${enemy.name}
items: ${enemy.items}
[フォーマット]
{
  "battleText": [
    ..., // 戦闘テキスト。臨場感たっぷりに。特殊な記号を入れないでください。
  ],
  "winner": ..., // player or enemy
  "gold": , // 数値。100以上
}
[注意事項]
- winner項目は必ずplayerかenemyにしてください。
- 回答はJSONのみでお願いします。
- テキストは最低10行以上でお願いします。
`;
}
