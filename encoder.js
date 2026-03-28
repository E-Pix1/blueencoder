let currentStream = null;
let ws = null;
let recorder = null;

const statusEl = document.getElementById("status");

async function selectDisplay() {
    currentStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
    });
    statusEl.innerText = "Capture source selected";
}

document.getElementById("screenBtn").onclick = selectDisplay;

document.getElementById("startBtn").onclick = () => {
    const url = document.getElementById("streamUrl").value.trim();
    if (!url) return alert("Enter RTMP or SRT URL");
    if (!currentStream) return alert("Select a capture source first");

    ws = new WebSocket(CONFIG.relayUrl);

    ws.onopen = () => {
        ws.send(JSON.stringify({ action: "start", url }));

        recorder = new MediaRecorder(currentStream, {
            mimeType: "video/webm;codecs=vp8,opus"
        });

        recorder.ondataavailable = e => {
            if (e.data.size > 0 && ws.readyState === WebSocket.OPEN) {
                e.data.arrayBuffer().then(buf => ws.send(new Uint8Array(buf)));
            }
        };

        recorder.start(500); // send chunks every 500ms
        statusEl.innerText = "Streaming…";
    };

    ws.onclose = () => {
        statusEl.innerText = "Disconnected";
    };

    ws.onerror = () => {
        statusEl.innerText = "Error";
    };
};

document.getElementById("stopBtn").onclick = () => {
    if (recorder && recorder.state !== "inactive") recorder.stop();
    if (currentStream) currentStream.getTracks().forEach(t => t.stop());
    if (ws && ws.readyState === WebSocket.OPEN) ws.close();
    statusEl.innerText = "Stopped";
};
