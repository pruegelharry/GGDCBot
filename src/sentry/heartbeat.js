const heartbeatUrl = process.env.HEARTBEAT_URL

setInterval(()=>{
    fetch(heartbeatUrl, {
        method: "POST"
    })
}, 30000)
