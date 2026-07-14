// Sistema de Toasts (accessible)
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const colors = { success: '#198754', error: '#dc3545', warning: '#ffc107', info: '#0d6efd' };
    const bg = colors[type] || colors.info;
    const toast = document.createElement('div');
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'assertive');
    toast.style.cssText = `background:${bg};color:white;padding:12px 20px;border-radius:8px;margin-bottom:8px;box-shadow:0 4px 12px rgba(0,0,0,0.15);animation:slideIn 0.3s ease;font-weight:500;word-break:break-word;`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity 0.3s'; setTimeout(() => toast.remove(), 300); }, 4000);
}

// Dark mode toggle
function initDarkMode() {
    const saved = localStorage.getItem('encuentroIQ_theme');
    if (saved === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
    updateThemeIcon();

    const btn = document.getElementById('themeToggle');
    if (!btn) return;
    btn.addEventListener('click', () => {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        if (isDark) {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('encuentroIQ_theme', 'light');
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('encuentroIQ_theme', 'dark');
        }
        updateThemeIcon();
    });
}

function updateThemeIcon() {
    const btn = document.getElementById('themeToggle');
    if (!btn) return;
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    btn.innerHTML = isDark
        ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>'
        : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
    btn.setAttribute('aria-label', isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
}

// Aplicación principal
document.addEventListener('DOMContentLoaded', function() {
    initDarkMode();
    initializeApp();
});

async function initializeApp() {
    // Listeners de Forms
    const loginForm = document.getElementById('loginForm');
    if (loginForm) loginForm.addEventListener('submit', handleLogin);

    const registerForm = document.getElementById('registerForm');
    if (registerForm) registerForm.addEventListener('submit', handleRegister);

    await checkPageAuth();
    await loadPageSpecificContent();
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const btn = e.submitter; // Botón que envió
    
    // UI Loading
    const originalText = btn.innerHTML;
    btn.disabled = true; btn.textContent = "Cargando...";

    const result = await window.apiClient.loginUser(email, password);
    
    if (result.success) {
        const user = result.data.profile;
        if (user.user_type === 'admin') window.location.href = 'admin-dashboard.html';
        else if (user.user_type === 'evaluator') window.location.href = 'evaluator-dashboard.html';
        else window.location.href = 'student-dashboard.html';
    } else {
        showToast('Error: ' + result.error, 'error');
        btn.disabled = false; btn.innerHTML = originalText;
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const type = document.getElementById('userType').value;
    const pass = document.getElementById('password').value;
    
    if (pass.length < 6) return showToast('Contraseña muy corta', 'error');
    
    const btn = document.querySelector('button[type="submit"]');
    btn.disabled = true; btn.textContent = "Registrando...";

    const result = await window.apiClient.registerUser(email, pass, name, type);
    
    if (result.success) {
        showToast('Cuenta creada. Inicia sesión.', 'success');
        window.location.href = 'login.html';
    } else {
        showToast('Error: ' + result.error, 'error');
        btn.disabled = false; btn.textContent = "Crear Cuenta";
    }
}

async function checkPageAuth() {
    const protectedPages = ['student-dashboard', 'evaluator-dashboard', 'admin-dashboard', 'submit-work'];
    const current = window.location.pathname;
    
    if (protectedPages.some(p => current.includes(p))) {
        const session = await window.apiClient.checkAuth();
        if (!session) {
            window.location.href = 'login.html';
            return;
        }
        
        // Verificar roles
        const profile = await window.apiClient.getUserProfile(session.user.id);
        if (current.includes('admin') && profile.user_type !== 'admin') window.location.href = 'index.html';
        if (current.includes('evaluator') && profile.user_type !== 'evaluator' && profile.user_type !== 'admin') window.location.href = 'index.html';
    }
}

async function loadPageSpecificContent() {
    const path = window.location.pathname;
    if (path.includes('student-dashboard')) {
        const user = (await window.apiClient.checkAuth()).user;
        const works = await window.apiClient.getStudentWorks(user.id);
        // Aquí llamas a tu función de renderizado de UI que tenías en el HTML
        if(window.displayWorks) window.displayWorks(works);
    }
}