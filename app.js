class DentalCommunicationApp {
    constructor() {
        // Application data
        this.responses = [
            {id: 1, text: "Yes", isDefault: true},
            {id: 2, text: "No", isDefault: true}
        ];
        this.settings = {
            speechRate: 1.0,
            speechVolume: 1.0
        };
        this.currentSelection = 0;
        this.isAdminMode = false;
        this.gridColumns = 2;
        this.nextId = 3;

        // Load any stored custom responses
        this.loadCustomResponses();
        this.init();
    }

    init() {
        this.bindEvents();
        this.renderResponses();
        this.updateResponseList();
        this.selectResponse(0);
        if (!('speechSynthesis' in window)) {
            this.showStatus('Text-to-speech not supported in this browser', 'error');
        } else {
            this.showStatus('Text-to-speech ready. Use arrow keys to navigate, Enter to select.');
        }
    }

    bindEvents() {
        // Keyboard navigation
        document.addEventListener('keydown', (e) => this.handleKeydown(e));

        // Admin toggle
        const adminToggle = document.getElementById('adminToggle');
        if (adminToggle) {
            adminToggle.addEventListener('click', () => this.toggleAdminMode());
        }

        // Admin close
        const adminClose = document.getElementById('adminClose');
        if (adminClose) {
            adminClose.addEventListener('click', () => this.toggleAdminMode());
        }

        // Instructions toggle
        const instructionsToggle = document.getElementById('instructionsToggle');
        if (instructionsToggle) {
            instructionsToggle.addEventListener('click', () => {
                document.getElementById('instructionsPanel').classList.toggle('hidden');
            });
        }

        // Volume test
        const volumeTest = document.getElementById('volumeTest');
        if (volumeTest) {
            volumeTest.addEventListener('click', () => this.speak("Yes, No"));
        }

        // Add response
        const addResponseBtn = document.getElementById('addResponse');
        if (addResponseBtn) {
            addResponseBtn.addEventListener('click', () => this.addCustomResponse());
        }
    }

    handleKeydown(e) {
        if (this.isAdminMode) return;
        const total = this.responses.length;
        if (["ArrowRight", "ArrowDown"].includes(e.key)) {
            this.selectResponse((this.currentSelection + 1) % total);
        } else if (["ArrowLeft", "ArrowUp"].includes(e.key)) {
            this.selectResponse((this.currentSelection - 1 + total) % total);
        } else if (["Enter", " "].includes(e.key)) {
            this.speak(this.responses[this.currentSelection].text);
            this.showStatus(`Selected: ${this.responses[this.currentSelection].text}`);
        }
    }

    renderResponses() {
        const grid = document.getElementById('responseGrid');
        grid.innerHTML = "";
        this.responses.forEach((resp, idx) => {
            const btn = document.createElement('button');
            btn.className = "response-btn";
            btn.innerText = resp.text;
            btn.tabIndex = 0;
            btn.onclick = () => {
                this.selectResponse(idx);
                this.speak(resp.text);
                this.showStatus(`Selected: ${resp.text}`);
            };
            grid.appendChild(btn);
        });
    }

    selectResponse(idx) {
        this.currentSelection = idx;
        const buttons = document.querySelectorAll('.response-btn');
        buttons.forEach((btn, i) => {
            btn.classList.toggle('selected', i === idx);
            if (i === idx) btn.focus();
        });
    }

    speak(text) {
        if (!('speechSynthesis' in window)) return;
        const utter = new SpeechSynthesisUtterance(text);
        utter.rate = this.settings.speechRate;
        utter.volume = this.settings.speechVolume;
        window.speechSynthesis.speak(utter);
    }

    showStatus(msg) {
        const disp = document.getElementById('statusMessage');
        if (disp) disp.innerText = msg;
    }

    toggleAdminMode() {
        this.isAdminMode = !this.isAdminMode;
        document.getElementById('adminPanel').classList.toggle('hidden', !this.isAdminMode);
        this.updateResponseList();
    }

    addCustomResponse() {
        const input = document.getElementById('newResponseText');
        const val = input.value.trim();
        if (val && this.responses.length < 8) {
            this.responses.push({id: this.nextId++, text: val, isDefault: false});
            this.saveCustomResponses();
            this.renderResponses();
            this.updateResponseList();
            input.value = "";
        }
    }

    updateResponseList() {
        const list = document.getElementById('responseList');
        if (!list) return;
        list.innerHTML = "";
        this.responses.forEach((resp, idx) => {
            const div = document.createElement('div');
            div.innerText = resp.text;
            div.style.display = 'flex';
            div.style.justifyContent = 'space-between';
            if (!resp.isDefault && this.isAdminMode) {
                const delBtn = document.createElement('button');
                delBtn.innerText = "❌";
                delBtn.style.marginLeft = "1rem";
                delBtn.onclick = () => {
                    this.responses.splice(idx, 1);
                    this.saveCustomResponses();
                    this.renderResponses();
                    this.updateResponseList();
                };
                div.appendChild(delBtn);
            }
            list.appendChild(div);
        });
    }

    saveCustomResponses() {
        const custom = this.responses.filter(r => !r.isDefault);
        localStorage.setItem('dentalCustomResponses', JSON.stringify(custom));
    }

    loadCustomResponses() {
        let custom = [];
        try {
            custom = JSON.parse(localStorage.getItem('dentalCustomResponses') || "[]");
        } catch {}
        if (Array.isArray(custom)) {
            custom.forEach((c, i) => {
                this.responses.push({
                    id: this.nextId++,
                    text: c.text,
                    isDefault: false
                });
            });
        }
    }
}

// Launch the app!
window.addEventListener('DOMContentLoaded', () => {
    window.DentalApp = new DentalCommunicationApp();
});
