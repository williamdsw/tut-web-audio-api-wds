
const volume = document.querySelector('#volume');
const bass = document.querySelector('#bass');
const mid = document.querySelector('#mid');
const treble = document.querySelector('#treble');
const visualizer = document.querySelector('#visualizer');
const audioInputs = document.querySelector('#audioInputs');

const outputVolume = document.querySelector('#outputVolume');
const outputBass = document.querySelector('#outputBass');
const outputMid = document.querySelector('#outputMid');
const outputTreble = document.querySelector('#outputTreble');

const context = new AudioContext();
const analyserNode = new AnalyserNode(context, { fftSize: 256 });
const gainNode = new GainNode(context, { gain: volume.value });
const bassEQ = new BiquadFilterNode(context, {
    type: 'lowshelf',
    frequency: 500,
    gain: bass.value
});
const midEQ = new BiquadFilterNode(context, {
    type: 'peaking',
    Q: Math.SQRT1_2,
    frequency: 1500,
    gain: mid.value
});
const trebleEQ = new BiquadFilterNode(context, {
    type: 'highshelf',
    frequency: 3000,
    gain: treble.value
});

setupDefaultValues();
setupEventListeners();
setupContext();
resize();
drawVisualizer();

function setupDefaultValues() {
    outputVolume.textContent = gainNode.gain.value;
    outputBass.textContent = bassEQ.gain.value;
    outputMid.textContent = midEQ.gain.value;
    outputTreble.textContent = trebleEQ.gain.value;

    navigator.mediaDevices.enumerateDevices().then(devices => {
        devices.forEach(device => {
            if (device.kind === 'audioinput') {
                const option = document.createElement('option');
                option.value = device.deviceId;
                option.textContent = device.label;
                audioInputs.appendChild(option);
            }
        });
    });
}

function setupEventListeners() {
    window.addEventListener('resize', resize);

    volume.addEventListener('input', (ev) => {
        const value = parseFloat(ev.target.value);
        gainNode.gain.setTargetAtTime(value, context.currentTime, 0.01);
        outputVolume.textContent = gainNode.gain.value.toFixed(1);
    });

    bass.addEventListener('input', (ev) => {
        const value = parseInt(ev.target.value);
        bassEQ.gain.setTargetAtTime(value, context.currentTime, 0.01);
        outputBass.textContent = bassEQ.gain.value.toFixed(1);
    });

    mid.addEventListener('input', (ev) => {
        const value = parseInt(ev.target.value);
        midEQ.gain.setTargetAtTime(value, context.currentTime, 0.01);
        outputMid.textContent = midEQ.gain.value.toFixed(1);
    });

    treble.addEventListener('input', (ev) => {
        const value = parseInt(ev.target.value);
        trebleEQ.gain.setTargetAtTime(value, context.currentTime, 0.01);
        outputTreble.textContent = trebleEQ.gain.value.toFixed(1);
    });

    audioInputs.addEventListener('change', (ev) => {
        suspendActualDevice(ev.target.value);
    });
}

function suspendActualDevice(deviceId) {
    if (context.state === 'running') {
        // TODO!
    }
}

async function setupContext(deviceId) {
    const device = await getDevice(deviceId);
    if (context.state === 'suspended') {
        await context.resume();
    }

    const source = context.createMediaStreamSource(device);
    source.connect(bassEQ)
          .connect(midEQ)
          .connect(trebleEQ)
          .connect(gainNode)
          .connect(analyserNode)
          .connect(context.destination);
}

function getDevice(deviceId) {
    const constraints = {
        echoCancellation: false,
        autoGainControl: false,
        noiseSuppression: false,
        latency: 0
    };

    if (deviceId && deviceId !== '') {
        constraints.deviceId = deviceId;
    }

    return navigator.mediaDevices.getUserMedia({
        audio: constraints
    });
}

function drawVisualizer() {
    requestAnimationFrame(drawVisualizer);

    const bufferLength = analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserNode.getByteFrequencyData(dataArray);
    const width = visualizer.width;
    const height = visualizer.height;
    const barWidth = width / bufferLength;

    const canvasContext = visualizer.getContext('2d');
    canvasContext.clearRect(0, 0, width, height);
    dataArray.forEach((item, index) => {
        const y = (item / 255) * (height / 2);
        const x = barWidth * index;
        canvasContext.fillStyle = `hsl(${y / height * 400}, 100%, 50%)`;
        canvasContext.fillRect(x, height - y, barWidth, y);
    });
}

function resize() {
    visualizer.width = (visualizer.clientWidth * window.devicePixelRatio);
    visualizer.height = (visualizer.clientHeight * window.devicePixelRatio);
}