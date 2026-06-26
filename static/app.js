document.addEventListener('DOMContentLoaded', () => {
    const chatForm = document.getElementById('chat-form');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const chatMessages = document.getElementById('chat-messages');
    const moodBtns = document.querySelectorAll('.mood-btn');
    const resetBtn = document.getElementById('reset-btn');
    
    const headerTitle = document.getElementById('header-title');
    const headerStatus = document.getElementById('header-status');
    const avatar = document.querySelector('.avatar');
    
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const sidebar = document.querySelector('.sidebar');

    // --- Space Emojis Generator ---
    const emojis = ['⭐', '🪐', '☄️', '🚀', '👽'];
    const fgContainer = document.getElementById('foreground-effects');

    function spawnEmoji(isInitial = false) {
        if (!fgContainer) return;
        const emoji = document.createElement('div');
        emoji.className = 'space-obj';
        emoji.innerText = emojis[Math.floor(Math.random() * emojis.length)];
        
        const startLeft = Math.random() * 100;
        const duration = Math.random() * 20 + 20; // 20s to 40s
        const size = Math.random() * 1.5 + 1.0; // 1.0rem to 2.5rem
        
        // Random horizontal drift between -30vw and 30vw
        const horizontalDrift = (Math.random() - 0.5) * 60; 
        
        emoji.style.left = `${startLeft}vw`;
        emoji.style.fontSize = `${size}rem`;
        
        fgContainer.appendChild(emoji);
        
        // Translate3d is used for butter-smooth hardware acceleration
        const animation = emoji.animate([
            { transform: `translate3d(0, -10vh, 0) rotate(0deg)`, opacity: 0 },
            { transform: `translate3d(${horizontalDrift * 0.2}vw, 20vh, 0) rotate(90deg)`, opacity: 0.9, offset: 0.2 },
            { transform: `translate3d(${horizontalDrift * 0.5}vw, 50vh, 0) rotate(180deg)`, opacity: 0.9, offset: 0.5 },
            { transform: `translate3d(${horizontalDrift * 0.8}vw, 80vh, 0) rotate(270deg)`, opacity: 0.9, offset: 0.8 },
            { transform: `translate3d(${horizontalDrift}vw, 110vh, 0) rotate(360deg)`, opacity: 0 }
        ], {
            duration: duration * 1000,
            easing: 'linear',
            fill: 'forwards'
        });
        
        // If this is the initial page load, instantly fast-forward the animation
        // to a random point in time so they are perfectly scattered across the screen
        if (isInitial) {
            const randomDelay = Math.random() * duration * 1000;
            animation.currentTime = randomDelay;
        }
        
        animation.onfinish = () => {
            emoji.remove();
            spawnEmoji(false); // Spawn a new one normally from the top
        };
    }

    if (fgContainer) {
        // 8 is the perfect number: not sparse, but not a clustered traffic jam
        for (let i = 0; i < 8; i++) {
            spawnEmoji(true);
        }
    }
    // -----------------------------

    let currentMode = 0;

    const personas = {
        0: { title: "Cosmo Buddy", status: "Ready for launch! 🚀", theme: "theme-default", icon: "👨‍🚀" },
        1: { title: "Grumpy Alien", status: "Don't probe me! 😡", theme: "theme-angry", icon: "👾" },
        2: { title: "Goofy Bot", status: "Beep boop! I like cheese! 🧀", theme: "theme-funny", icon: "🤖" },
        3: { title: "Sad Moon", status: "Just floating alone... 🌘", theme: "theme-sad", icon: "🪐" }
    };

    async function loadHistory() {
        try {
            const response = await fetch('/history');
            const data = await response.json();
            
            // Set mode
            currentMode = data.mode;
            const persona = personas[currentMode];
            document.body.className = persona.theme;
            headerTitle.textContent = persona.title;
            headerStatus.textContent = persona.status;
            if (persona.icon.startsWith('/')) {
                avatar.style.backgroundImage = `url('${persona.icon}')`;
                avatar.style.backgroundSize = 'cover';
                avatar.style.backgroundPosition = 'center';
                avatar.innerText = "";
            } else {
                avatar.style.backgroundImage = "none";
                avatar.innerText = persona.icon;
                avatar.style.fontSize = "32px";
                avatar.style.display = "flex";
                avatar.style.alignItems = "center";
                avatar.style.justifyContent = "center";
            }
            
            // Update mode buttons
            moodBtns.forEach(b => b.classList.remove('active'));
            const activeBtn = Array.from(moodBtns).find(b => parseInt(b.dataset.mode) === currentMode);
            if (activeBtn) activeBtn.classList.add('active');

            // Render messages
            if (data.messages && data.messages.length > 0) {
                chatMessages.innerHTML = ''; // Clear default welcome
                data.messages.forEach(msg => {
                    const type = msg.type; // 'human', 'ai', 'system'
                    if (type === 'human') {
                        appendUserMessage(msg.data.content);
                    } else if (type === 'ai') {
                        appendBotMessage(msg.data.content);
                    }
                });
            }
        } catch (error) {
            console.error("Failed to load history:", error);
        }
    }

    loadHistory();

    // Toggle Send Button
    userInput.addEventListener('input', () => {
        sendBtn.disabled = userInput.value.trim() === '';
    });

    // Handle Mood Selection
    moodBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active state
            moodBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Update mode
            currentMode = parseInt(btn.dataset.mode);
            const persona = personas[currentMode];

            // Update UI
            document.body.className = persona.theme;
            headerTitle.textContent = persona.title;
            headerStatus.textContent = persona.status;
            if (persona.icon.startsWith('/')) {
                avatar.style.backgroundImage = `url('${persona.icon}')`;
                avatar.style.backgroundSize = 'cover';
                avatar.style.backgroundPosition = 'center';
                avatar.innerText = "";
            } else {
                avatar.style.backgroundImage = "none";
                avatar.innerText = persona.icon;
                avatar.style.fontSize = "32px";
                avatar.style.display = "flex";
                avatar.style.alignItems = "center";
                avatar.style.justifyContent = "center";
            }

            // Optional: Send a visual notification in chat that persona changed
            appendSystemMessage(`Switched to ${persona.title} persona.`);
        });
    });

    // Handle Reset
    resetBtn.addEventListener('click', async () => {
        try {
            await fetch('/reset', { method: 'POST' });
            chatMessages.innerHTML = '';
            appendBotMessage("Session reset. How can I assist you today?");
        } catch (error) {
            console.error("Failed to reset:", error);
        }
    });

    // Form Submit
    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const message = userInput.value.trim();
        if (!message) return;

        // Add user message to UI
        appendUserMessage(message);
        userInput.value = '';
        sendBtn.disabled = true;

        // Show typing indicator
        const typingId = appendTypingIndicator();

        try {
            const response = await fetch('/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: message,
                    mode: currentMode
                })
            });

            const data = await response.json();
            
            // Remove typing indicator
            removeElement(typingId);

            if (data.error) {
                appendSystemMessage(data.reply);
            } else {
                appendBotMessage(data.reply);
            }
        } catch (error) {
            removeElement(typingId);
            appendSystemMessage("Connection error. Is the backend running?");
        }
    });

    function appendUserMessage(text) {
        const div = document.createElement('div');
        div.className = 'message user-message';
        div.innerHTML = `
            <div class="message-avatar">
                <i class="fa-solid fa-user"></i>
            </div>
            <div class="message-content">
                <p>${escapeHTML(text)}</p>
            </div>
        `;
        chatMessages.appendChild(div);
        scrollToBottom();
    }

    function appendBotMessage(text) {
        const div = document.createElement('div');
        div.className = 'message bot-message';
        div.innerHTML = `
            <div class="message-avatar">
                <i class="fa-solid fa-robot"></i>
            </div>
            <div class="message-content">
                <p>${formatText(escapeHTML(text))}</p>
            </div>
        `;
        chatMessages.appendChild(div);
        scrollToBottom();
    }

    function appendSystemMessage(text) {
        const div = document.createElement('div');
        div.style.textAlign = 'center';
        div.style.color = 'var(--text-secondary)';
        div.style.fontSize = '0.8rem';
        div.style.margin = 'var(--spacing-md) 0';
        div.textContent = text;
        chatMessages.appendChild(div);
        scrollToBottom();
    }

    function appendTypingIndicator() {
        const id = 'typing-' + Date.now();
        const div = document.createElement('div');
        div.className = 'message bot-message';
        div.id = id;
        div.innerHTML = `
            <div class="message-avatar">
                <i class="fa-solid fa-robot"></i>
            </div>
            <div class="message-content">
                <div class="typing-indicator">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
            </div>
        `;
        chatMessages.appendChild(div);
        scrollToBottom();
        return id;
    }

    function removeElement(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    }

    function scrollToBottom() {
        chatMessages.scrollTo({
            top: chatMessages.scrollHeight,
            behavior: 'smooth'
        });
    }

    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g, 
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag] || tag)
        );
    }

    function formatText(text) {
        // Simple formatting to handle newlines
        return text.replace(/\n/g, '<br>');
    }

    // Mobile Sidebar Toggle
    if (mobileMenuBtn && sidebar) {
        mobileMenuBtn.addEventListener('click', () => {
            sidebar.classList.toggle('show');
        });
        
        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768) {
                if (!sidebar.contains(e.target) && !mobileMenuBtn.contains(e.target) && sidebar.classList.contains('show')) {
                    sidebar.classList.remove('show');
                }
            }
        });

        // Close sidebar when a mood is selected on mobile
        moodBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    sidebar.classList.remove('show');
                }
            });
        });
    }
});
