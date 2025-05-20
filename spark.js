// 封装讯飞星火大模型 WebSocket 接口
async function getSparkAnswer(prompt) {
  const APPID = "66afe778";
  const APISecret = "MDcxZTFmNjM5MGYzNGZlNTc0YTk0ZGU0";
  const APIKey = "902a2986e9adac84c1662e639508ac2e";

  const host = "spark-api.xf-yun.com";
  const path = "/v3.1/chat";
  const url = `wss://${host}${path}`;

  const crypto = await import('https://cdn.jsdelivr.net/npm/crypto-js@4.1.1/crypto-js.min.js');

  const now = new Date().toGMTString();
  const signatureOrigin = `host: ${host}\ndate: ${now}\nGET ${path} HTTP/1.1`;
  const signatureSha = crypto.HmacSHA256(signatureOrigin, APISecret);
  const signature = crypto.enc.Base64.stringify(signatureSha);
  const authorizationOrigin = `api_key="${APIKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`;
  const authorization = btoa(authorizationOrigin);
  const finalUrl = `${url}?authorization=${authorization}&date=${encodeURIComponent(now)}&host=${host}`;

  return new Promise((resolve, reject) => {
    const socket = new WebSocket(finalUrl);

    let finalResult = "";

    socket.onopen = () => {
      const data = {
        header: {
          app_id: APPID,
          uid: "123456"
        },
        parameter: {
          chat: {
            domain: "generalv3.1",
            temperature: 0.5,
            max_tokens: 1024
          }
        },
        payload: {
          message: {
            text: [
              {
                role: "user",
                content: prompt
              }
            ]
          }
        }
      };
      socket.send(JSON.stringify(data));
    };

    socket.onmessage = (msg) => {
      const data = JSON.parse(msg.data);
      const content = data.payload?.choices?.text[0]?.content;
      if (content) {
        finalResult += content;
      }

      if (data.header.code !== 0) {
        reject("讯飞星火 API 错误: " + data.header.message);
        socket.close();
      }

      if (data.header.status === 2) {
        resolve(finalResult);
        socket.close();
      }
    };

    socket.onerror = (err) => {
      reject("WebSocket 出错：" + err.message);
    };
  });
}
