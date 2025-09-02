const CONFIG = {
    MAX_DEFLECTION: 0.15,
    TIME_STEP: 0.002,
    COLORS: {
        ELECTRON_GUN: '#ffcc00',
        ELECTRON_BEAM: '#00ffbb',
        ELECTRON_DOT: '#00ffbb',
        SCREEN: '#ffcc00',
        CENTER_LINE: 'rgba(255, 255, 255, 0.3)',
        VERTICAL_PLATES: 'rgba(100, 200, 255, 0.3)',
        HORIZONTAL_PLATES: 'rgba(255, 100, 100, 0.3)',
        TRACE: 'rgba(0, 255, 150, 1)',
    },
    CANVAS: {
        LINE_WIDTH: 2,
        ELECTRON_RADIUS: 5,
        TRACE_RADIUS: 3,
        GLOW_RADIUS: 2,
        DASH_PATTERN: [5, 5]
    },
    UI: {
        SINUSOIDAL_AMPLITUDE: 80
    }
};

const simulation = {
    mode: 'manual', 
    accelerationVoltage: 2000,
    verticalVoltage: 0,
    horizontalVoltage: 0,
    persistence: 3,
    frequencyy: 1,
    frequencyx: 1,
    phase: 0,
    time: 0,
    traces: [],
    electronPosition: { x: 0, y: 0 }
};

function calculateElectronPosition() {
    // manual
    let verticalVoltage = simulation.verticalVoltage;
    let horizontalVoltage = simulation.horizontalVoltage;
    
    // sinusoidal Asin(wt + o)
    if (simulation.mode === 'sinusoidal') {
        const t = simulation.time;
        const wy = 2 * Math.PI * simulation.frequencyy;
        const wx = 2 * Math.PI * simulation.frequencyx;
        const o = simulation.phase;
        
        verticalVoltage = CONFIG.UI.SINUSOIDAL_AMPLITUDE * Math.sin(wy * t);
        horizontalVoltage = CONFIG.UI.SINUSOIDAL_AMPLITUDE * Math.sin(wx * t + o);
    }
    
    // calculo de posicion
    const x = (horizontalVoltage / 100) * CONFIG.MAX_DEFLECTION;
    const y = (verticalVoltage / 100) * CONFIG.MAX_DEFLECTION;
    
    return { x, y };
}

// canvas
const frontCanvas = document.getElementById('vista-frontal')
const sideCanvas = document.getElementById('vista-lateral')
const topCanvas = document.getElementById('vista-superior')

const frontCtx = frontCanvas.getContext('2d')
const sideCtx = sideCanvas.getContext('2d')
const topCtx = topCanvas.getContext('2d')

// controls
const accelerationSlider = document.getElementById('voltaje-aceleracion')
const verticalSlider = document.getElementById('voltaje-vertical')
const horizontalSlider = document.getElementById('voltaje-horizontal')
const persistenceSlider = document.getElementById('persistencia')
const frequencySlider = document.getElementById('frequencyy')
const frequencyXSlider = document.getElementById('frequencyx')
const phaseSlider = document.getElementById('desfase')

// valores de sliders
const accelerationValue = document.getElementById('valor-aceleracion')
const verticalValue = document.getElementById('valor-vertical')
const horizontalValue = document.getElementById('valor-horizontal')
const persistenceValue = document.getElementById('valor-persistencia')
const frequencyValue = document.getElementById('valor-frequencyy')
const frequencyXValue = document.getElementById('valor-frequencyx')
const phaseValue = document.getElementById('valor-desfase')

// modos
const manualModeBtn = document.getElementById('manual-btn')
const sinusoidalModeBtn = document.getElementById('sin-btn')
const sinusoidalControls = document.getElementById('controles-sinusoidales')

function updateMode(mode) {
    if (mode === 'manual') {
            sinusoidalControls.style.opacity = '0.5';
            manualModeBtn.style.background = '#0874fc';
            sinusoidalModeBtn.style.background = '#08438bff';
        } else {
            sinusoidalControls.style.opacity = '1';
            manualModeBtn.style.background = '#08438bff';
            sinusoidalModeBtn.style.background = '#0874fc';
        }
}

// configuración de controles
function controlsConfig() {
    accelerationSlider.addEventListener('input', function() {
        simulation.accelerationVoltage = parseInt(this.value);
        accelerationValue.textContent = this.value;
    });
    
    verticalSlider.addEventListener('input', function() {
        simulation.verticalVoltage = parseInt(this.value);
        verticalValue.textContent = this.value;
    });
    
    horizontalSlider.addEventListener('input', function() {
        simulation.horizontalVoltage = parseInt(this.value);
        horizontalValue.textContent = this.value;
    });
    
    persistenceSlider.addEventListener('input', function() {
        simulation.persistence = parseInt(this.value);
        persistenceValue.textContent = this.value;
    });
    
    frequencySlider.addEventListener('input', function() {
        simulation.frequencyy = parseFloat(this.value);
        frequencyValue.textContent = this.value;
    });

    frequencyXSlider.addEventListener('input', function() {
        simulation.frequencyx = parseFloat(this.value);
        frequencyXValue.textContent = this.value;
    });
    
    phaseSlider.addEventListener('input', function() {
        simulation.phase = parseFloat(this.value);
        phaseValue.textContent = this.value;
    });

    manualModeBtn.addEventListener('click', function() {
        simulation.mode = 'manual';
        updateMode('manual');
    });

    sinusoidalModeBtn.addEventListener('click', function() {
        simulation.mode = 'sinusoidal';
        updateMode('sinusoidal');
    });
}

function drawFrontView() {
    const width = frontCanvas.width;
    const height = frontCanvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const scale = Math.min(width, height) / 2;
    
    // refresh
    frontCtx.clearRect(0, 0, width, height);
    
    // marco
    frontCtx.strokeStyle = CONFIG.COLORS.SCREEN;
    frontCtx.lineWidth = CONFIG.CANVAS.LINE_WIDTH;
    frontCtx.beginPath();
    frontCtx.rect(
        centerX - scale * 0.95, 
        centerY - scale * 0.75, 
        scale * 1.9, 
        scale * 1.5
    );
    frontCtx.stroke();
    
    return { frontCtx, centerX, centerY, scale };
}

function drawFrontViewTraces(simulation, frontCtx, centerX, centerY, scale) {
    // posiciones anteriores
    for (let i = 0; i < simulation.traces.length; i++) {
        const trace = simulation.traces[i];
        const age = (Date.now() - trace.time) / 1000;
        const alpha = Math.max(0, Math.abs(simulation.accelerationVoltage/5000) - (age / simulation.persistence));
        
        if (alpha > 0) {
            const x = centerX + trace.x * scale / CONFIG.MAX_DEFLECTION;
            const y = centerY - trace.y * scale / CONFIG.MAX_DEFLECTION;
            
            frontCtx.fillStyle = `rgba(0, 255, 150, ${alpha})`;
            frontCtx.beginPath();
            frontCtx.arc(
                x, 
                y, 
                CONFIG.CANVAS.TRACE_RADIUS, 
                0, 
                Math.PI * 2
            );
            frontCtx.fill();
        }
    }
}

function drawFrontViewElectron(electronPosition, frontCtx, centerX, centerY, scale) {
    // posicion actual del electron
    const screenX = centerX + electronPosition.x * scale / CONFIG.MAX_DEFLECTION;
    const screenY = centerY - electronPosition.y * scale / CONFIG.MAX_DEFLECTION;
    
    frontCtx.fillStyle = `rgba(0, 255, 255, ${simulation.accelerationVoltage/5000})`;
    frontCtx.beginPath();
    frontCtx.arc(
        screenX, 
        screenY, 
        CONFIG.CANVAS.ELECTRON_RADIUS,
        0, 
        Math.PI * 2
    );
    frontCtx.fill();
}

function drawLateralView(canvas, context, plateColor, position) {
    const width = canvas.width;
    const height = canvas.height;
    const scale = height / 2;
    const deflection = position * scale / CONFIG.MAX_DEFLECTION;
    
    // refresh
    context.clearRect(0, 0, width, height);
    
    context.strokeStyle = CONFIG.COLORS.ELECTRON_GUN;
    context.lineWidth = CONFIG.CANVAS.LINE_WIDTH;
    context.beginPath();
    context.rect(20, height/2 - 10, 40, 20);
    context.stroke();
    
    // placas conductoras
    const platesX = 150;
    context.fillStyle = plateColor;
    context.fillRect(platesX, height/2 - 40, 30, 30);
    context.fillRect(platesX, height/2 + 10, 30, 30);
    
    // linea central
    context.strokeStyle = CONFIG.COLORS.CENTER_LINE;
    context.setLineDash(CONFIG.CANVAS.DASH_PATTERN);
    context.beginPath();
    context.moveTo(0, height/2);
    context.lineTo(width, height/2);
    context.stroke();
    context.setLineDash([]);
    
    // pantalla
    context.strokeStyle = CONFIG.COLORS.SCREEN;
    context.beginPath();
    context.moveTo(width - 50, 20);
    context.lineTo(width - 50, height - 20);
    context.stroke();
    
    // curva hacia las placas
    context.strokeStyle = CONFIG.COLORS.ELECTRON_BEAM;
    context.lineWidth = CONFIG.CANVAS.LINE_WIDTH;
    const curveStartX = 100;

    context.beginPath();
    context.moveTo(60, height/2);
    context.quadraticCurveTo(
        curveStartX, height/2,
        platesX + 15, height/2
    );
    
    // curva despues de las placas
    context.quadraticCurveTo(
        platesX + 50, height/2,
        width - 50, height/2 - deflection
    );
    
    context.stroke();
    
    // particula
    context.fillStyle = CONFIG.COLORS.ELECTRON_DOT;
    context.beginPath();
    context.arc(
        width - 50, 
        height/2 - deflection, 
        CONFIG.CANVAS.ELECTRON_RADIUS, 
        0, 
        Math.PI * 2
    );
    context.fill();
}

function cleanOldTraces() {
    // actual - creacion > persistencia = BORRAR 
    const now = Date.now();
    simulation.traces = simulation.traces.filter(trace => {
        const age = (now - trace.time) / 1000;
        return age < simulation.persistence;
    });
}

function animate() {
    // update time
    simulation.time += CONFIG.TIME_STEP;
    simulation.electronPosition = calculateElectronPosition();
    
    // puntos anteriores
    simulation.traces.push({
        x: simulation.electronPosition.x,
        y: simulation.electronPosition.y,
        time: Date.now()
    });
    cleanOldTraces();
    
    // posición actual
    const pos = simulation.electronPosition;
    
    // vista frontal
    const frontViewData = drawFrontView();
    drawFrontViewTraces(
        simulation, 
        frontViewData.frontCtx, 
        frontViewData.centerX, 
        frontViewData.centerY, 
        frontViewData.scale
    );
    drawFrontViewElectron(
        pos, 
        frontViewData.frontCtx, 
        frontViewData.centerX, 
        frontViewData.centerY, 
        frontViewData.scale
    );
    
    // vista vertical
    drawLateralView(
        sideCanvas, 
        sideCtx, 
        CONFIG.COLORS.VERTICAL_PLATES, 
        pos.y
    );
    
    // vista horizontal 
    drawLateralView(
        topCanvas, 
        topCtx, 
        CONFIG.COLORS.HORIZONTAL_PLATES, 
        pos.x
    );
    
    // siguiente frame
    requestAnimationFrame(animate);
}

function show() {
    animate();
}
// inicializar modo con 'manual'
function modeConfig() {
    updateMode('manual');
}

function init() {
    try {
        // configurar eventos
        controlsConfig();
        modeConfig();
        
        // animación
        show();
    } catch (error) {}
}

init();
