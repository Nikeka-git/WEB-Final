class CodingTutorialsApp {
    constructor() {
        this.token = localStorage.getItem('token');
        this.currentUser = null;
        this.editingTutorialId = null;
        this.currentTabFilter = 'all';
        this.sections = [];
        this.isCreating = false;
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadHeroStats();

        const token = localStorage.getItem('token');
        if (token) {
            this.token = token;
            this.loadUser().then(() => {
                this.updateUI();
                this.showMainSection();
            }).catch(() => {
                localStorage.removeItem('token');
                this.showHeroSection();
            });
        } else {
            this.showHeroSection();
        }
    }


    bindEvents() {
        const safeBind = (selector, handler) => {
            const el = document.getElementById(selector);
            if (el) el.onclick = handler;
        };

        const safeSubmit = (selector, handler) => {
            const el = document.getElementById(selector);
            if (el) el.onsubmit = handler;
        };


        // Hero buttons
        safeBind('getStartedBtn', () => this.showLoginForm());

        // Auth
        safeBind('loginBtn', () => this.showLoginForm());
        safeSubmit('registerFormEl', (e) => this.register(e));
        safeSubmit('loginFormEl', (e) => this.login(e));

        safeBind('showRegister', (e) => { e.preventDefault(); this.showRegisterForm(); });
        safeBind('showLogin', (e) => { e.preventDefault(); this.showLoginForm(); });

        // Navigation & Actions
        safeBind('logoutBtn', () => this.logout());
        safeBind('profileBtn', () => this.scrollToProfile());
        safeBind('createTutorialBtn', () => this.showTutorialModal());
        safeBind('createFirstTutorialBtn', () => this.showTutorialModal());
        safeBind('editProfileBtn', () => this.showProfileModal());

        // Modals
        safeBind('closeTutorialModalBtn', () => this.hideTutorialModal());
        safeBind('cancelTutorialBtn', () => this.hideTutorialModal());
        safeSubmit('tutorialForm', (e) => this.saveTutorial(e));

        safeBind('closeProfileModalBtn', () => this.hideProfileModal());
        safeBind('cancelProfileBtn', () => this.hideProfileModal());
        safeSubmit('profileForm', (e) => this.updateProfile(e));

        // Tabs
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('tab')) {
                const group = e.target.dataset.group;
                const tabType = e.target.dataset.tab;

                document.querySelectorAll(`.tab[data-group="${group}"]`).forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                if (group === 'my') {
                    this.currentTabFilter = tabType;
                    this.loadTutorials();
                } else if (group === 'public') {
                    this.loadPublicTutorials();
                }
            }
        });

        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('tab') && e.target.dataset.tab?.includes('public')) {
                document.querySelectorAll('.tab[data-tab*="public"]').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                this.loadPublicTutorials();
            }
        });

        const addSectionBtn = document.getElementById('addSectionBtn');
        if (addSectionBtn) {
            addSectionBtn.onclick = () => {
                const currentCount = document.querySelectorAll('.section-editor').length;
                this.renderSectionsEditor(currentCount + 1);
            };
        }

        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-section')) {
                e.target.closest('.section-editor').remove();
            }
        });

        // Close modals on outside click
        document.addEventListener('click', (e) => {
            if (e.target.id === 'tutorialModal') this.hideTutorialModal();
            if (e.target.id === 'profileModal') this.hideProfileModal();
        });

        document.addEventListener('click', (e) => {
            const tutorialEl = e.target.closest('.tutorial-viewer, .public-tutorial');
            if (tutorialEl && !e.target.closest('.tutorial-actions')) {
                const tutorialId = tutorialEl.dataset.id;
                this.viewAnyTutorial(tutorialId);
                return;
            }

            if (e.target.closest('.tutorial-actions')) {
                e.stopPropagation();
            }
        });
    }



    async apiCall(endpoint, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...(this.token && { 'Authorization': `Bearer ${this.token}` })
        };

        const response = await fetch(endpoint, {
            ...options,
            headers
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(error || `HTTP ${response.status}`);
        }

        return response.json();
    }

    async register(e) {
        e.preventDefault();
        try {
            const data = {
                username: document.getElementById('regUsername').value,
                email: document.getElementById('regEmail').value,
                password: document.getElementById('regPassword').value
            };

            const user = await this.apiCall('/api/auth/register', {
                method: 'POST',
                body: JSON.stringify(data)
            });

            localStorage.setItem('token', user.token);
            this.token = user.token;
            this.currentUser = user.user;
            this.updateUI();
            this.showMainSection();
            this.showNotification('Account created successfully!');
        } catch (error) {
            this.showError(error.message);
        }
    }

    async login(e) {
        e.preventDefault();
        try {
            const data = {
                email: document.getElementById('loginEmail').value,
                password: document.getElementById('loginPassword').value
            };

            const user = await this.apiCall('/api/auth/login', {
                method: 'POST',
                body: JSON.stringify(data)
            });

            localStorage.setItem('token', user.token);
            this.token = user.token;
            this.currentUser = user.user;

            this.updateUI();
            this.showMainSection();

            this.showNotification('Welcome back!');
        } catch (error) {
            this.showError(error.message);
        }
    }

    async loadUser() {
        try {
            this.currentUser = await this.apiCall('/api/users/profile');
            this.updateUI();
        } catch (error) {
            console.error('Token expired, logging out:', error);
            this.logout();
        }
    }

    updateUI() {
        const loginBtn = document.getElementById('loginBtn');
        const profileBtn = document.getElementById('profileBtn');
        const logoutBtn = document.getElementById('logoutBtn');
        const profileNameEl = document.getElementById('profileName');
        const profileEmailEl = document.getElementById('profileEmail');

        if (this.currentUser && loginBtn && profileBtn && logoutBtn) {
            loginBtn.style.display = 'none';
            profileBtn.style.display = 'inline-flex';
            logoutBtn.style.display = 'inline-flex';

            if (profileNameEl) profileNameEl.textContent = `Welcome, ${this.currentUser.username}!`;
            if (profileEmailEl) profileEmailEl.textContent = this.currentUser.email;
        } else if (loginBtn) {
            loginBtn.style.display = 'inline-flex';
            if (profileBtn) profileBtn.style.display = 'none';
            if (logoutBtn) logoutBtn.style.display = 'none';
        }
    }


    showMainSection() {
        const heroSection = document.getElementById('heroSection');
        const authSection = document.getElementById('authSection');
        const mainSection = document.getElementById('mainSection');

        if (heroSection) heroSection.style.display = 'none';
        if (authSection) authSection.style.display = 'none';
        if (mainSection) mainSection.style.display = 'block';

        this.loadTutorials();
        this.loadPublicTutorials();
    }

    async loadTutorials() {
        try {
            let query = '';
            if (this.currentTabFilter === 'published') query = '?published=true';
            else if (this.currentTabFilter === 'drafts') query = '?published=false';

            const tutorials = await this.apiCall(`/api/tutorials${query}`);

            const container = document.getElementById('tutorialsList');
            if (!container) return;

            document.getElementById('totalTutorials').textContent = tutorials.length;
            document.getElementById('draftTutorials').textContent =
                tutorials.filter(t => !t.published).length;

            if (tutorials.length === 0) {
                container.innerHTML = `
        <div class="empty-state">
            <div class="empty-icon">📚</div>
            <h3>No ${this.currentTabFilter === 'published' ? 'published' : this.currentTabFilter === 'drafts' ? 'draft' : ''} tutorials yet</h3>
            <p>Create your first tutorial!</p>
            <button id="createFirstTutorialBtn" class="btn btn-primary">Create First Tutorial</button>
        </div>
    `;
                setTimeout(() => {
                    const btn = document.getElementById('createFirstTutorialBtn');
                    if (btn) btn.onclick = () => this.showTutorialModal();
                }, 0);
                return;
            }

            container.innerHTML = tutorials.map(t => `
            <div class="tutorial-card clickable tutorial-viewer" data-id="${t._id}">
                <div class="tutorial-header">
                    <h3>${this.escapeHtml(t.title)}</h3>
                    <span class="tutorial-date">${new Date(t.createdAt).toLocaleDateString()}</span>
                </div>
                <p>${this.escapeHtml(t.sections?.[0]?.title || 'No content')}...</p>
                ${t.tags && t.tags.length ? `<div class="tutorial-tags">${t.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</div>` : ''}
                <div class="tutorial-actions">
                    <button class="btn-edit" onclick="app.editTutorial('${t._id}')">✏Edit</button>
                    <button class="btn-delete" onclick="app.deleteTutorial('${t._id}')">🗑Delete</button>
                </div>
            </div>
        `).join('');
        } catch (error) {
            console.error('Failed to load tutorials:', error);
            document.getElementById('tutorialsList').innerHTML = '<p class="empty-state">Failed to load tutorials</p>';
        }
    }

    async loadTutorialForEdit(id) {
        try {
            const tutorial = await this.apiCall(`/api/tutorials/${id}`);
            document.getElementById('tutorialTitle').value = tutorial.title;
            document.getElementById('tutorialContent').value = tutorial.content;
            document.getElementById('tutorialTags').value = tutorial.tags?.join(', ') || '';
        } catch (error) {
            this.showError('Failed to load tutorial');
        }
    }

    hideTutorialModal() {
        document.getElementById('tutorialModal').classList.remove('active');
        this.editingTutorialId = null;
        document.getElementById('tutorialForm').reset();
    }

    async deleteTutorial(id) {
        if (!confirm('Are you sure you want to delete this tutorial?')) return;

        try {
            await this.apiCall(`/api/tutorials/${id}`, { method: 'DELETE' });
            this.showNotification('Tutorial deleted successfully!');
            this.loadTutorials();
        } catch (error) {
            this.showError('Failed to delete tutorial');
        }
    }

    async editTutorial(id) {
        this.showTutorialModal(id);
    }

    showProfileModal() {
        const modal = document.getElementById('profileModal');
        if (modal) modal.classList.add('active');

        if (this.currentUser) {
            const usernameInput = document.getElementById('editUsername');
            const emailInput = document.getElementById('editEmail');
            if (usernameInput) usernameInput.value = this.currentUser.username || '';
            if (emailInput) emailInput.value = this.currentUser.email || '';
        }
    }

    hideProfileModal() {
        document.getElementById('profileModal').classList.remove('active');
    }

    async updateProfile(e) {
        e.preventDefault();
        try {
            const data = {
                username: document.getElementById('editUsername').value,
                email: document.getElementById('editEmail').value
            };

            this.currentUser = await this.apiCall('/api/users/profile', {
                method: 'PUT',
                body: JSON.stringify(data)
            });
            this.updateUI();
            this.hideProfileModal();
            this.showNotification('Profile updated successfully!');
        } catch (error) {
            this.showError(error.message);
        }
    }

    scrollToProfile() {
        const profileCard = document.querySelector('.profile-card');
        if (profileCard) {
            profileCard.scrollIntoView({ behavior: 'smooth' });
            profileCard.style.borderColor = '#00d4ff';
            setTimeout(() => {
                profileCard.style.borderColor = '#333';
            }, 2000);
        }
    }


    logout() {
        localStorage.removeItem('token');
        localStorage.clear();
        sessionStorage.clear();

        this.token = null;
        this.currentUser = null;
        this.editingTutorialId = null;

        this.updateUI();

        this.showHeroSection();

        this.showNotification('Logged out successfully');
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification show';
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    showError(message) {
        this.showNotification(`Error: ${message}`);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showLoginForm() {
        document.getElementById('heroSection').style.display = 'none';
        document.getElementById('authSection').style.display = 'flex';
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('registerForm').style.display = 'none';
        document.getElementById('loginForm').scrollIntoView({ behavior: 'smooth' });
    }

    showRegisterForm() {
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('registerForm').style.display = 'block';
    }

    async loadHeroStats() {
        try {
            const response = await fetch('/api/stats');
            const stats = await response.json();

            document.getElementById('totalTutorialsStat').textContent = stats.tutorials;
            document.getElementById('totalAuthorsStat').textContent = stats.authors;
            document.getElementById('totalViewsStat').textContent = stats.views;
        } catch (error) {
            console.log('Stats loading failed, using defaults');
            // Fallback
            document.getElementById('totalTutorialsStat').textContent = '0';
            document.getElementById('totalAuthorsStat').textContent = '0';
            document.getElementById('totalViewsStat').textContent = '0';
        }
    }



    showHeroSection() {
        const heroSection = document.getElementById('heroSection');
        const authSection = document.getElementById('authSection');
        const mainSection = document.getElementById('mainSection');

        if (heroSection) heroSection.style.display = 'block';
        if (authSection) authSection.style.display = 'none';
        if (mainSection) mainSection.style.display = 'none';
        this.updateHeroStats();
    }

    showTutorialModal(editId = null) {
        this.editingTutorialId = editId;
        const modal = document.getElementById('tutorialModal');
        const title = document.getElementById('modalTitle');

        title.textContent = editId ? 'Edit Tutorial' : 'Create New Tutorial';
        modal.classList.add('active');

        if (editId) {
            this.loadTutorialForEdit(editId);
        } else {
            document.getElementById('tutorialForm').reset();
            this.renderSectionsEditor(1);
        }
    }

    async saveTutorial(e) {
        e.preventDefault();
        if (this.isCreating) {
            this.showNotification('Creating... Please wait.');
            return;
        }

        this.isCreating = true;
        try {
            const sections = this.collectSectionsData();

            const data = {
                title: document.getElementById('tutorialTitle').value,
                sections: sections,
                tags: document.getElementById('tutorialTags').value
                    .split(',')
                    .map(t => t.trim())
                    .filter(Boolean)
            };

            if (this.editingTutorialId) {
                await this.apiCall(`/api/tutorials/${this.editingTutorialId}`, {
                    method: 'PUT',
                    body: JSON.stringify(data)
                });
                this.showNotification('Tutorial updated!');
            } else {
                await this.apiCall('/api/tutorials', {
                    method: 'POST',
                    body: JSON.stringify(data)
                });
                this.showNotification('Tutorial created!');
            }

            this.hideTutorialModal();
            this.loadTutorials();
        } catch (error) {
            this.showError(error.message);
        } finally {
            this.isCreating = false;
        }
    }

    renderSectionsEditor(count = 1) {
        const container = document.getElementById('sectionsContainer');
        if (!container) return;

        container.innerHTML = '';

        for (let i = 0; i < count; i++) {
            const sectionHtml = `
            <div class="section-editor" data-section-index="${i}">
                <div style="display: flex; gap: 0.5rem; align-items: center; margin-bottom: 0.5rem;">
                    <strong>Section ${i + 1}:</strong>
                    <input type="text" class="section-title" placeholder="Section title" style="flex: 1;">
                    ${i > 0 ? '<button type="button" class="btn btn-danger remove-section" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;">Remove</button>' : ''}
                </div>
                <textarea class="section-content" rows="4" placeholder="Section content..." style="width: 100%; margin-bottom: 1rem;"></textarea>
                
                <div class="quiz-builder" style="background: rgba(0,212,255,0.1); padding: 1rem; border-radius: 6px; border-left: 3px solid #00d4ff;">
                    <h5 style="margin-bottom: 0.5rem;">Quiz (optional):</h5>
                    <input class="quiz-question" placeholder="Question?" style="width: 100%; margin-bottom: 0.5rem;">
                    <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                        <div style="display: flex; gap: 0.5rem; align-items: center;">
                            <input type="radio" name="q${i}_correct" value="0">
                            <input type="text" class="quiz-option-text" placeholder="Option 1" style="flex: 1;">
                        </div>
                        <div style="display: flex; gap: 0.5rem; align-items: center;">
                            <input type="radio" name="q${i}_correct" value="1">
                            <input type="text" class="quiz-option-text" placeholder="Option 2" style="flex: 1;">
                        </div>
                        <div style="display: flex; gap: 0.5rem; align-items: center;">
                            <input type="radio" name="q${i}_correct" value="2">
                            <input type="text" class="quiz-option-text" placeholder="Option 3" style="flex: 1;">
                        </div>
                    </div>
                </div>
            </div>
        `;
            container.insertAdjacentHTML('beforeend', sectionHtml);
        }
    }

    collectSectionsData() {
        const sections = [];
        document.querySelectorAll('.section-editor').forEach((sectionEl, sectionIndex) => {
            const title = sectionEl.querySelector('.section-title')?.value;
            const content = sectionEl.querySelector('.section-content')?.value;

            if (title && content) {
                const questionEl = sectionEl.querySelector('.quiz-question');
                const question = questionEl?.value;
                const options = Array.from(sectionEl.querySelectorAll('.quiz-option-text')).map(el => el.value).filter(Boolean);
                const correctRadio = sectionEl.querySelector(`input[name="q${sectionIndex}_correct"]:checked`);
                const correct = correctRadio ? parseInt(correctRadio.value) : -1;

                const quiz = (question && options.length >= 2 && correct >= 0) ? [{
                    question,
                    options,
                    correct
                }] : [];

                sections.push({ title, content, quiz });
            }
        });
        console.log('SAVING SECTIONS:', sections);
        return sections;
    }

    async loadPublicTutorials() {
        try {
            const response = await fetch('/api/tutorials/public');
            const tutorials = await response.json();

            const container = document.getElementById('publicTutorialsList');
            if (!container) return;

            if (tutorials.length === 0) {
                container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📚</div>
                    <h3>No public tutorials</h3>
                    <p>Publish your tutorials to share!</p>
                </div>
            `;
                return;
            }

            container.innerHTML = tutorials.map(t => `
            <div class="tutorial-card clickable public-tutorial" data-id="${t._id}">
                <div class="tutorial-header">
                    <h3>${this.escapeHtml(t.title)}</h3>
                    <span class="tutorial-author">
                        by ${t.authorUsername || t.author?.username || 'Anonymous'}
                    </span>
                </div>
                <p>${this.escapeHtml(t.sections?.[0]?.title || 'No content')}...</p>
            </div>
        `).join('');
        } catch (error) {
            console.error('Public tutorials error:', error);
        }
    }

    showTutorialViewer(tutorial) {
        const modalHtml = `
        <div id="tutorialViewerModal" class="modal active" style="z-index: 10000;">
            <div class="modal-content" style="max-width: 900px; max-height: 90vh; overflow-y: auto;">
                <div class="modal-header">
                    <div>
                        <h2 style="margin: 0 0 0.5rem 0; color: #00d4ff;">${this.escapeHtml(tutorial.title)}</h2>
                        <div style="color: #b0b0b0; font-size: 0.95rem;">
                            by <strong>${tutorial.author?.username || 'Anonymous'}</strong> • 
                            ${tutorial.views || 0} views • 
                            ${new Date(tutorial.createdAt).toLocaleDateString()}
                        </div>
                    </div>
                    <button class="close-btn" onclick="app.hideTutorialViewer()" style="font-size: 1.5rem;">×</button>
                </div>
                
                <div style="padding: 1.5rem;">
                    ${tutorial.sections?.map((section, secIndex) => `
                        <div style="margin-bottom: 2.5rem; padding-bottom: 1.5rem; border-bottom: 1px solid #333;">
                            <h3 style="color: #64ffda; margin-bottom: 1rem; font-size: 1.4rem;">${this.escapeHtml(section.title)}</h3>
                            <div style="background: #1f1f1f; padding: 1.5rem; border-radius: 8px; border-left: 4px solid #00d4ff; line-height: 1.7; margin-bottom: 1.5rem; white-space: pre-wrap;">
                                ${section.content.replace(/\n/g, '<br>')}
                            </div>
                            
                            ${section.quiz?.[0] ? `
                                <div style="background: rgba(74,222,128,0.15); border: 2px solid #4ade80; border-radius: 10px; padding: 1.5rem; margin-top: 1rem;">
                                    <h4 style="color: #4ade80; margin-bottom: 1rem;">Check your knowledge</h4>
                                    <div style="font-weight: 600; margin-bottom: 1rem; padding: 1rem; background: rgba(74,222,128,0.25); border-radius: 6px;">
                                        ${this.escapeHtml(section.quiz[0].question)}
                                    </div>
                                    <div style="display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1rem;">
                                        ${section.quiz[0].options.map((option, optIndex) => `
                                            <label style="display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; background: rgba(255,255,255,0.05); border-radius: 6px; cursor: pointer; transition: background 0.2s;">
                                                <input type="radio" name="quiz_${secIndex}" value="${optIndex}" style="width: 18px; height: 18px; accent-color: #4ade80;">
                                                <span style="flex: 1;">${this.escapeHtml(option)}</span>
                                            </label>
                                        `).join('')}
                                    </div>
                                    <button class="btn btn-primary" onclick="app.checkQuiz(${secIndex}, ${section.quiz[0].correct})" style="width: 100%; padding: 0.75rem;">
                                        Check Answer
                                    </button>
                                </div>
                            ` : ''}
                        </div>
                    `).join('') || `
                        <div style="padding: 2rem; text-align: center; color: #666;">
                            <p>No content available</p>
                        </div>
                    `}
                </div>
            </div>
        </div>
    `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        document.getElementById('tutorialViewerModal').onclick = (e) => {
            if (e.target.id === 'tutorialViewerModal') app.hideTutorialViewer();
        };
    }


    hideTutorialViewer() {
        const modal = document.getElementById('tutorialViewerModal');
        if (modal) modal.remove();
    }

    checkQuiz(sectionIndex, correctAnswer) {
        const selected = document.querySelector(`input[name="quiz_${sectionIndex}"]:checked`);
        const submitBtn = event.target;

        if (!selected) {
            app.showNotification('⚠Please select an answer!');
            return;
        }

        const userAnswer = parseInt(selected.value);
        const isCorrect = userAnswer === correctAnswer;

        submitBtn.innerHTML = isCorrect ? 'Correct!' : 'Wrong! Try again';
        submitBtn.style.background = isCorrect ? '#4ade80' : '#f87171';
        submitBtn.disabled = true;

        setTimeout(() => {
            submitBtn.innerHTML = 'Check Answer';
            submitBtn.style.background = '#00d4ff';
            submitBtn.disabled = false;
        }, 3000);

        app.showNotification(
            isCorrect
                ? 'Correct! Great job!'
                : `Wrong! Correct answer is option ${correctAnswer + 1}`
        );
    }

    async viewAnyTutorial(id) {
        try {
            const response = await fetch(`/api/tutorials/public/${id}`);

            if (response.ok) {
                const tutorial = await response.json();
                this.showTutorialViewer(tutorial);
                return;
            }

            const tutorial = await this.apiCall(`/api/tutorials/${id}`);
            this.showTutorialViewer(tutorial);
        } catch (error) {
            this.showError('Failed to load tutorial');
        }
    }




}

// Global app reference for onclick handlers
const app = new CodingTutorialsApp();
