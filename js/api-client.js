// --- GESTIÓN DE SESIÓN LOCAL ---
function saveSession(user) { localStorage.setItem('congreso_user', JSON.stringify(user)); }
function getSession() {
    try { return JSON.parse(localStorage.getItem('congreso_user')); }
    catch (e) { return null; }
}
function logoutUser() { localStorage.removeItem('congreso_user'); return Promise.resolve(true); }

// Redirige al dashboard según el tipo de usuario
function redirectToDashboard(user) {
    if (user.user_type === 'admin') window.location.replace('admin-dashboard.html');
    else if (user.user_type === 'evaluator') window.location.replace('evaluator-dashboard.html');
    else window.location.replace('student-dashboard.html');
}

// En páginas públicas (index/login), si ya hay sesión se entra directo al dashboard
function autoRoute() {
    const path = window.location.pathname;
    if (path.includes('student-dashboard') || path.includes('evaluator-dashboard') ||
        path.includes('admin-dashboard') || path.includes('submit-work')) return;
    const s = getSession();
    if (s && s.id && s.user_type) redirectToDashboard(s);
}

// --- API CLIENTE ---
const apiClient = {
    // Autenticación
    async loginUser(email, password) {
        const result = await postData({
            action: 'login',
            email,
            password
        });
        if (result.success) saveSession(result.data.profile);
        return result;
    },

    // En api-client.js
    async registerUser(email, password, name, userType, adminCode = "", facultad = "") {
        return await postData({
            action: 'register',
            email,
            password,
            name,
            user_type: userType,
            admin_code: adminCode,
            facultad
        });
    },

    async getUserProfile(id) {
        const s = getSession();
        return (s && s.id === id) ? s : null;
    },

    async checkAuth() {
        const s = getSession();
        return s ? { user: { id: s.id } } : null;
    },

    logoutUser,

    // Trabajos
    async submitWork(workData, file, onProgress) {
        try {
            const base64 = await toBase64(file);
            const body = JSON.stringify({
                action: 'submitWork',
                student_id: workData.student_id,
                title: workData.title,
                abstract: workData.abstract,
                semester: workData.semester,
                facultad: workData.facultad,
                professor_cargo: workData.professor_cargo,
                team_members: workData.team_members,
                modality: "Pendiente",
                fileName: file.name,
                fileBase64: base64.split(',')[1]
            });
            return await postDataProgress(body, onProgress);
        } catch (e) { return { success: false, error: e.message }; }
    },

    async getStudentWorks(studentId) {
        const json = await fetchJson(`${GOOGLE_SCRIPT_URL}?action=getStudentWorks&studentId=${studentId}`);
        return json.success ? json.data : [];
    },

    async getAllWorks() {
        const json = await fetchJson(`${GOOGLE_SCRIPT_URL}?action=getWorks`);
        return json.success ? json.data : [];
    },

    // Admin / Evaluadores
    async getEvaluators() {
        const json = await fetchJson(`${GOOGLE_SCRIPT_URL}?action=getEvaluators`);
        return json.success ? json.data : [];
    },

    async getAssignments() {
        const json = await fetchJson(`${GOOGLE_SCRIPT_URL}?action=getAssignments`);
        return json.success ? json.data : [];
    },

    async assignWork(workId, evaluatorId) {
        return await postData({
            action: 'assignWork',
            work_id: workId,
            evaluator_id: evaluatorId
        });
    },

    // ✅ NUEVO: Asignar TODOS los trabajos pendientes en una sola llamada al backend
    async assignAllPending() {
        return await postData({ action: 'assignAllPending' });
    },

    // Evaluación
    async submitEvaluation(evaluationData) {
        evaluationData.action = 'submitEvaluation';
        return await postData(evaluationData);
    },

    async updateWorkStatus(workId, status, finalScore) {
        return await postData({
            action: 'updateWorkStatus',
            work_id: workId,
            status: status,
            final_score: finalScore
        });
    },

    async finalizeAndNotify(workId) {
        return await postData({ action: 'finalizeAndNotify', work_id: workId });
    },

    async batchFinalize() {
        return await postData({ action: 'batchFinalize' });
    },

    async assignLiveWorks() {
        return await postData({ action: 'assignLiveWorks' });
    },

    async getLiveAssignments() {
        const json = await fetchJson(`${GOOGLE_SCRIPT_URL}?action=getLiveAssignments`);
        return json.success ? json.data : [];
    },

    async submitLiveEvaluation(data) {
        data.action = 'submitLiveEvaluation';
        return await postData(data);
    },

    async getWinners() {
        const json = await fetchJson(`${GOOGLE_SCRIPT_URL}?action=getWinners`);
        return json.success ? json.data : { oral: [], poster: [] };
    },

    async generateCertificates(workId) {
        return await postData({ action: 'generateCertificates', work_id: workId });
    },

    async getProfessorsBySemester(semester) {
        return await fetchJson(`${GOOGLE_SCRIPT_URL}?action=getProfessorsBySemester&semester=${encodeURIComponent(semester)}`);
    },

    // ✅ NUEVO: Dashboard admin en vivo (requiere permiso de admin en backend)
    _sessionId() {
        const s = getSession();
        return s && s.id ? s.id : null;
    },

    async getLiveAdminDashboard() {
        const userId = this._sessionId();
        const json = await fetchJson(`${GOOGLE_SCRIPT_URL}?action=getLiveAdminDashboard&admin_user_id=${encodeURIComponent(userId || '')}`);
        return json.success ? json.data : null;
    },

    // Actividad del evaluador (semibackend: registra actividad)
    async registerActivity(status = 'available') {
        return await postData({
            action: 'registerActivity',
            user_id: this._sessionId(),
            status
        });
    },

    async setEvaluatorStatus(evaluatorId, status) {
        return await postData({
            action: 'setEvaluatorStatus',
            admin_user_id: this._sessionId(),
            evaluator_id: evaluatorId,
            status
        });
    },

    async markEvaluatorAbsent(evaluatorId) {
        return await postData({
            action: 'markEvaluatorAbsent',
            admin_user_id: this._sessionId(),
            evaluator_id: evaluatorId
        });
    },

    async reactivateEvaluator(evaluatorId) {
        return await postData({
            action: 'reactivateEvaluator',
            admin_user_id: this._sessionId(),
            evaluator_id: evaluatorId
        });
    },

    async requestHelp(message) {
        return await postData({
            action: 'requestHelp',
            user_id: this._sessionId(),
            message
        });
    },

    async resolveHelpRequest(requestId, status = 'resolved') {
        return await postData({
            action: 'resolveHelpRequest',
            admin_user_id: this._sessionId(),
            request_id: requestId,
            status
        });
    },

    async reassignLiveEvaluator(workId, oldEvaluatorId, newEvaluatorId, reason = '') {
        return await postData({
            action: 'reassignLiveEvaluator',
            admin_user_id: this._sessionId(),
            work_id: workId,
            old_evaluator_id: oldEvaluatorId,
            new_evaluator_id: newEvaluatorId,
            reason
        });
    },

    // Notificaciones push (Web Push)
    async registerPushSubscription(subscription) {
        return await postData({
            action: 'registerPushSubscription',
            admin_user_id: this._sessionId(),
            subscription
        });
    },

    async getPendingHelpSummary() {
        const json = await fetchJson(`${GOOGLE_SCRIPT_URL}?action=getPendingHelpSummary`);
        return json.success ? json.data : { count: 0, lastMessage: '', evaluators: '' };
    },

    async testPushToAdmins() {
        return await postData({
            action: 'testPushToAdmins',
            admin_user_id: this._sessionId()
        });
    },

    // Recuperación de contraseña
    async forgotPassword(email) {
        return await postData({
            action: 'forgotPassword',
            email
        });
    },

    async resetPassword(token, password) {
        return await postData({
            action: 'resetPassword',
            token,
            password
        });
    },

    // ✅ Método genérico POST expuesto para llamadas directas desde el HTML
    async post(data) {
        return await postData(data);
    }
};

// --- HELPERS ---
async function postData(data, timeoutMs = 60000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const res = await fetch(GOOGLE_SCRIPT_URL, {
            redirect: "follow",
            method: 'POST',
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify(data),
            signal: controller.signal
        });
        return await res.json();
    } catch (e) {
        const mensaje = (e && e.name === 'AbortError')
            ? 'La solicitud tardó demasiado. Revisa tu conexión e inténtalo de nuevo.'
            : e.message;
        return { success: false, error: mensaje };
    } finally {
        clearTimeout(timer);
    }
}

async function fetchJson(url, timeoutMs = 45000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const res = await fetch(url, { signal: controller.signal });
        return await res.json();
    } catch (e) {
        return { success: false, error: (e && e.name === 'AbortError') ? 'Tiempo de espera agotado.' : e.message };
    } finally {
        clearTimeout(timer);
    }
}

const toBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
});

function postDataProgress(body, onProgress) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', GOOGLE_SCRIPT_URL, true);
        xhr.setRequestHeader('Content-Type', 'text/plain;charset=utf-8');
        xhr.onreadystatechange = () => {
            if (xhr.readyState === 4) {
                try { resolve(JSON.parse(xhr.responseText)); } catch (e) { resolve({ success: false, error: e.message }); }
            }
        };
        xhr.upload.onprogress = onProgress || (() => {});
        xhr.send(body);
    });
}

// Exponer globalmente
window.apiClient = apiClient;
window.supabaseClient = apiClient; // compatibilidad