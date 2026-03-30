/**
 * DiabeatEase — Intelligent Diabetes Assistant Logic
 * Handles assessment form, analysis display, and chat interactions.
 */

// ─── DOM Elements ───
const sideLinks = document.querySelectorAll('.nav-item');
const views = document.querySelectorAll('.view');
const assessmentForm = document.getElementById('assessmentForm');
const resultsContainer = document.getElementById('resultsContainer');
const emergencyModal = document.getElementById('emergencyModal');
const emergencyTitle = document.getElementById('emergencyTitle');
const emergencyMsg = document.getElementById('emergencyMsg');
const closeModalBtn = document.getElementById('closeModal');

// ─── Initialize ───
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initForm();
    initTheme();
    initChat();
});

// ─── Navigation & Views ───
function initNavigation() {
    sideLinks.forEach(link => {
        link.addEventListener('click', () => {
            const viewId = link.id.replace('TabBtn', 'View');
            if (document.getElementById(viewId)) {
                switchView(viewId);
                sideLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            }
        });
    });
}

function switchView(viewId) {
    views.forEach(v => v.classList.add('hidden'));
    document.getElementById(viewId).classList.remove('hidden');
}

// ─── Theme Management ───
function initTheme() {
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = document.getElementById('themeIcon');
    
    themeToggle.addEventListener('click', () => {
        const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
        document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
        themeIcon.textContent = isDark ? 'light_mode' : 'dark_mode';
    });
}

// ─── Health Assessment Form ───
function initForm() {
    assessmentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const analyzeBtn = document.getElementById('analyzeBtn');
        analyzeBtn.disabled = true;
        analyzeBtn.innerHTML = `<span class="material-symbols-rounded">autorenew</span> Analyzing...`;

        const formData = {
            age: document.getElementById('ageInput').value,
            weight: document.getElementById('weightInput').value,
            height: document.getElementById('heightInput').value,
            sugar_value: document.getElementById('sugarInput').value,
            test_type: document.getElementById('testTypeSelect').value,
            habits: document.getElementById('lifestyleSelect').value,
            medications: document.getElementById('medsInput').value,
            symptoms: document.getElementById('symptomsInput').value
        };

        try {
            const response = await fetch('/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            if (data.status === 'success') {
                displayResults(data);
                if (data.analysis.emergency) {
                    showEmergency(data.analysis.emergency);
                }
            } else {
                alert('Analysis failed: ' + data.message);
            }
        } catch (err) {
            console.error(err);
            alert('Service connection error. Please try again.');
        } finally {
            analyzeBtn.disabled = false;
            analyzeBtn.innerHTML = `<span class="material-symbols-rounded">analytics</span> Analyze My Health`;
        }
    });

    closeModalBtn.addEventListener('click', () => {
        emergencyModal.classList.add('hidden');
    });
}

// ─── Result Rendering ───
function displayResults(data) {
    resultsContainer.classList.remove('hidden');
    const analysis = data.analysis;
    const plans = data.plans;

    let html = `
        <div class="glass-card result-card ${analysis.category}">
            <div class="analysis-header">
                <div>
                    <span class="status-pill ${analysis.category}">${analysis.category}</span>
                    <h3 style="margin-top:10px;">${analysis.meaning}</h3>
                    <p style="font-size:0.8rem; color:var(--text-tertiary); margin-top:5px;">Analysis completed at ${data.timestamp}</p>
                </div>
                ${analysis.bmi ? `
                <div style="text-align:right">
                    <span style="font-size:0.6rem; font-weight:800; color:var(--text-tertiary); text-transform:uppercase;">BMI SCORE</span>
                    <h3 style="color:var(--accent-primary)">${analysis.bmi}</h3>
                    <p style="font-size:0.75rem;">${analysis.bmi_category}</p>
                </div>
                ` : ''}
            </div>

            <div class="plan-section">
                <h4><span class="material-symbols-rounded" style="color:#f59e0b">restaurant</span> Personalized Meal Plan</h4>
                <div class="grid" style="grid-template-columns: 1fr 1fr; gap:10px; margin-bottom:15px;">
                    <div class="glass-card" style="padding:10px; font-size:0.8rem;">
                        <strong style="color:var(--accent-primary)">🌅 Breakfast</strong><br>${plans.meal.breakfast}
                    </div>
                    <div class="glass-card" style="padding:10px; font-size:0.8rem;">
                        <strong style="color:var(--accent-primary)">🌞 Lunch</strong><br>${plans.meal.lunch}
                    </div>
                    <div class="glass-card" style="padding:10px; font-size:0.8rem;">
                        <strong style="color:var(--accent-primary)">🍎 Snack</strong><br>${plans.meal.snack}
                    </div>
                    <div class="glass-card" style="padding:10px; font-size:0.8rem;">
                        <strong style="color:var(--accent-primary)">🌙 Dinner</strong><br>${plans.meal.dinner}
                    </div>
                </div>

                <div class="grid" style="grid-template-columns: 1fr 1fr; gap:20px;">
                    <div>
                        <strong style="font-size:0.7rem; color:var(--accent-primary); text-transform:uppercase;">Foods to Eat ✅</strong>
                        <ul style="font-size:0.75rem; margin-top:5px; padding-left:15px;">
                            ${plans.meal.foods_to_eat.map(f => `<li>${f}</li>`).join('')}
                        </ul>
                    </div>
                    <div>
                        <strong style="font-size:0.7rem; color:var(--accent-error); text-transform:uppercase;">Foods to Avoid ❌</strong>
                        <ul style="font-size:0.75rem; margin-top:5px; padding-left:15px;">
                            ${plans.meal.foods_to_avoid.map(f => `<li>${f}</li>`).join('')}
                        </ul>
                    </div>
                </div>
            </div>

            <div class="plan-section">
                <h4><span class="material-symbols-rounded" style="color:var(--accent-info)">fitness_center</span> Activity & Exercise Plan</h4>
                <p style="font-size:0.8rem; color:var(--text-secondary); margin-bottom:10px;">Based on your activity level: <strong>${document.getElementById('lifestyleSelect').value.toUpperCase()}</strong></p>
                <div style="display:flex; flex-direction:column; gap:8px;">
                    ${plans.exercise.map(e => `
                        <div class="glass-card" style="padding:8px 12px; font-size:0.8rem; display:flex; align-items:center; gap:8px;">
                             <span class="material-symbols-rounded" style="font-size:16px; color:var(--accent-primary)">check_circle</span>
                             ${e}
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="plan-section">
                <h4><span class="material-symbols-rounded" style="color:var(--accent-primary)">schedule</span> Daily Health Routine Schedule</h4>
                <div class="routine-list">
                    ${plans.routine.map(item => `
                        <div class="routine-item">
                            <span class="routine-time">${item.time}</span>
                            <span class="routine-desc">${item.activity}</span>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div style="margin-top:20px; padding:15px; border-radius:12px; background:rgba(16, 185, 129, 0.05); border:1px dashed var(--accent-primary);">
                <p style="font-size:0.8rem; text-align:center;">
                    <strong>💪 Motivational Guidance:</strong> Consistency is the key to managing diabetes. Small changes today lead to huge health victories tomorrow. You got this!
                </p>
            </div>
        </div>
    `;

    resultsContainer.innerHTML = html;
    resultsContainer.scrollIntoView({ behavior: 'smooth' });
}

function showEmergency(msg) {
    emergencyMsg.textContent = msg;
    emergencyModal.classList.remove('hidden');
}

// ─── Chat Logic ───
function initChat() {
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendChatBtn');

    sendBtn.addEventListener('click', handleChat);
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleChat();
        }
    });

    // Initial greeting
    addMessage("Hello! I'm your DiabeatEase Assistant. How can I help you manage your health today?", 'bot');
}

async function handleChat() {
    const chatInput = document.getElementById('chatInput');
    const msg = chatInput.value.trim();
    if (!msg) return;

    addMessage(msg, 'user');
    chatInput.value = '';

    try {
        const response = await fetch('/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: msg })
        });
        const data = await response.json();
        addMessage(data.response, 'bot');
    } catch (err) {
        addMessage("Sorry, I'm having trouble connecting to the medical server.", 'bot');
    }
}

function addMessage(text, sender) {
    const container = document.getElementById('messagesContainer');
    const msgDiv = document.createElement('div');
    msgDiv.style.marginBottom = "15px";
    msgDiv.style.display = "flex";
    msgDiv.style.justifyContent = sender === 'user' ? "flex-end" : "flex-start";
    
    msgDiv.innerHTML = `
        <div class="glass-card" style="max-width:80%; padding:10px 15px; border-radius:15px; ${sender === 'user' ? 'background:var(--accent-gradient); color:white;' : ''}">
            <p style="font-size:0.9rem;">${text}</p>
        </div>
    `;
    container.appendChild(msgDiv);
    const area = document.getElementById('chatArea');
    area.scrollTop = area.scrollHeight;
}
