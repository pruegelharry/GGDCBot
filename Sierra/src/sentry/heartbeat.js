const heartbeatUrl = process.env.HEARTBEAT_URL;

setInterval(() => {
  fetch(heartbeatUrl, {
    method: "POST",
  }).catch((e) => console.error("Heartbeat failed!", e));
}, 30000);
