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
            this.renderResponses();
            this.updateResponseList();
            input.value = "";
            if (window.saveCurrentDentistConfig) window.saveCurrentDentistConfig();
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
                    this.renderResponses();
                    this.updateResponseList();
                    if (window.saveCurrentDentistConfig) window.saveCurrentDentistConfig();
                };
                div.appendChild(delBtn);
            }
            list.appendChild(div);
        });
    }
}

// Main logic including dentist login and branding
window.addEventListener('DOMContentLoaded', () => {
    window.DentalApp = new DentalCommunicationApp();

    const loginPanel = document.getElementById('dentistLoginPanel');
    const loginBtn = document.getElementById('dentistLoginBtn');
    const usernameInput = document.getElementById('dentistUsernameInput');
    const logoutBtn = document.getElementById('dentistLogoutBtn');
    let loggedInDentist = null;

    function showLogin() {
        loginPanel.style.display = 'block';
        document.querySelector('.app-container').style.display = 'none';
    }
    function showApp() {
        loginPanel.style.display = 'none';
        document.querySelector('.app-container').style.display = '';
    }
    function saveDentistConfig(username, config) {
        localStorage.setItem('dentalConfig_' + username, JSON.stringify(config));
    }
    function loadDentistConfig(username) {
        let raw = localStorage.getItem('dentalConfig_' + username);
        try {
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    }
    function applyDentistConfig(config) {
        if (config.brandColor) {
            document.documentElement.style.setProperty('--color-primary', config.brandColor);
            let brandColorInput = document.getElementById('brandColorInput');
            if (brandColorInput) brandColorInput.value = config.brandColor;
        }
        if (config.brandLogo) {
            let logoDiv = document.getElementById('currentBrandLogo');
            if (logoDiv) {
                logoDiv.innerHTML = `<img src="${config.brandLogo}" alt="Practice Logo" style="max-height:60px; max-width:180px;"/>`;
            }
            document.querySelector('.app-header h1').innerHTML =
                `<img src="${config.brandLogo}" alt="Logo" style="height:28px;vertical-align:middle;margin-right:14px;"/> Patient Communication`;
        }
        if (config.responses) {
            window.DentalApp.responses = config.responses;
            window.DentalApp.renderResponses();
            window.DentalApp.updateResponseList();
        }
    }

    loginBtn.onclick = () => {
        const username = usernameInput.value.trim();
        if (!username) return alert("Please enter your code or practice name.");
        loggedInDentist = username;
        showApp();
        logoutBtn.style.display = '';
        localStorage.setItem('dentalCurrentDentist', username);
        let config = loadDentistConfig(username);
        if (config) applyDentistConfig(config);
        window.saveCurrentDentistConfig = function() {
            if (!loggedInDentist) return;
            let config = loadDentistConfig(loggedInDentist) || {};
            config.responses = JSON.parse(JSON.stringify(window.DentalApp.responses));
            let colorInput = document.getElementById('brandColorInput');
            if (colorInput) config.brandColor = colorInput.value;
            let logoDiv = document.getElementById('currentBrandLogo');
            if (logoDiv && logoDiv.firstChild && logoDiv.firstChild.src) {
                config.brandLogo = logoDiv.firstChild.src;
            }
            saveDentistConfig(loggedInDentist, config);
        };
    };

    logoutBtn.onclick = () => {
        loggedInDentist = null;
        localStorage.removeItem('dentalCurrentDentist');
        location.reload();
    };

    let previousLogin = localStorage.getItem('dentalCurrentDentist');
    if (previousLogin) {
        loggedInDentist = previousLogin;
        showApp();
        logoutBtn.style.display = '';
        let config = loadDentistConfig(loggedInDentist);
        if (config) applyDentistConfig(config);
        window.saveCurrentDentistConfig = function() {
            if (!loggedInDentist) return;
            let config = loadDentistConfig(loggedInDentist) || {};
            config.responses = JSON.parse(JSON.stringify(window.DentalApp.responses));
            let colorInput = document.getElementById('brandColorInput');
            if (colorInput) config.brandColor = colorInput.value;
            let logoDiv = document.getElementById('currentBrandLogo');
            if (logoDiv && logoDiv.firstChild && logoDiv.firstChild.src) {
                config.brandLogo = logoDiv.firstChild.src;
            }
            saveDentistConfig(loggedInDentist, config);
        };
    } else {
        showLogin();
        window.saveCurrentDentistConfig = function() {}; // No-op while not logged in
    }

    // Handle logo upload
    let brandLogoInput = document.getElementById('brandLogoInput');
    brandLogoInput && (brandLogoInput.onchange = function(e) {
        let f = e.target.files[0];
        if (!f) return;
        let reader = new FileReader();
        reader.onload = function(evt) {
            let logoData = evt.target.result;
            let userConfig = loadDentistConfig(loggedInDentist) || {};
            userConfig.brandLogo = logoData;
            saveDentistConfig(loggedInDentist, userConfig);
            applyDentistConfig(userConfig);
        };
        reader.readAsDataURL(f);
    });

    // Handle theme color picker
    let brandColorInput = document.getElementById('brandColorInput');
    brandColorInput && (brandColorInput.onchange = function(e) {
        let color = e.target.value;
        document.documentElement.style.setProperty('--color-primary', color);
        let userConfig = loadDentistConfig(loggedInDentist) || {};
        userConfig.brandColor = color;
        saveDentistConfig(loggedInDentist, userConfig);
    });
});
