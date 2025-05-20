// spark.js —— 讯飞星火对话 API 封装（使用 generalv3.5 版本）
async function getSparkAnswer(prompt) {
  const APPID = "66afe778";
  const APISecret = "MDcxZTFmNjM5MGYzNGZlNTc0YTk0ZGU0";
  const APIKey = "902a2986e9adac84c1662e639508ac2e";

  const host = "spark-api.xf-yun.com";
  const path = "/v3.5/chat"; // 使用 generalv3.5 模型
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
          uid: "user_123"
        },
        parameter: {
          chat: {
            domain: "generalv3.5", // 对应路径中的 v3.5
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
      if (data.header.code !== 0) {
        reject("❌ 讯飞星火返回错误：" + data.header.message);
        socket.close();
        return;
      }

      const content = data.payload?.choices?.text?.[0]?.content;
      if (content) finalResult += content;

      if (data.header.status === 2) {
        resolve(finalResult);
        socket.close();
      }
    };

    socket.onerror = (err) => {
      reject("❌ WebSocket 错误：" + err.message);
    };

    socket.onclose = () => {
      // 可选：console.log("连接关闭");
    };
  });
}
fix: update spark api
