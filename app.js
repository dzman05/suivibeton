// --- Auth & Initial State ---
const currentUser = JSON.parse(localStorage.getItem('currentUser'));
if (!currentUser && !window.location.pathname.endsWith('index.html') && !window.location.pathname.endsWith('/')) {
    window.location.href = 'index.html';
}

// Data state
let formulations = [];
let productionLogs = [];
let users = [];


document.addEventListener('DOMContentLoaded', async () => {
    const path = window.location.pathname;
    if (path.endsWith('index.html') || path.endsWith('/')) return;

    // Add role class for CSS control
    if (currentUser) {
        document.body.classList.add(`role-${currentUser.role}`);
    }

    // Common UI elements
    initCommonUI();
    setupCommonEventListeners();

    // Page-specific initialization
    if (path.includes('cab-stats.html')) {
        initFilters();
        await loadInitialData();
        filterStats();
    } else if (path.includes('cab-production.html')) {
        await loadInitialData();
        loadProductionData();
        populateFormulationSelect();
        const prodDate = document.getElementById('prod-date');
        if (prodDate) prodDate.value = new Date().toISOString().split('T')[0];
    } else if (path.includes('cab-formulations.html')) {
        await loadFormulationsTable();
    } else if (path.includes('cab-users.html')) {
        await loadUsersList();
    } else if (path.includes('cab-profile.html')) {
        document.getElementById('up-user').value = currentUser.username;
    }
});

async function loadInitialData() {
    try {
        const [prodRes, formRes] = await Promise.all([
            fetch('/api/production'),
            fetch('/api/formulations')
        ]);
        productionLogs = await prodRes.json();
        formulations = await formRes.json();
    } catch (e) {
        console.error("Error loading data:", e);
    }
}

// --- Common UI & Events ---
function initCommonUI() {
    const userDisp = document.getElementById('user-display');
    if (userDisp) {
        userDisp.innerHTML = `<i class="fas fa-user-circle"></i> ${currentUser.fullName} (${currentUser.role})`;
    }
}

function setupCommonEventListeners() {
    // Mobile Toggle with Overlay
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');

    document.getElementById('mobile-toggle')?.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        overlay?.classList.toggle('active');
    });

    // Close sidebar when clicking overlay
    overlay?.addEventListener('click', () => {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
    });

    // Logout
    document.getElementById('logout-btn')?.addEventListener('click', () => {
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    });

    // Profile Update (if on profile page)
    document.getElementById('update-profile-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const pass = document.getElementById('up-pass').value;
        const confirm = document.getElementById('up-pass-confirm').value;
        if (pass && pass !== confirm) { alert("Mots de passe ne correspondent pas !"); return; }
        const updatedUser = { ...currentUser, username: document.getElementById('up-user').value };
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        alert("Profil mis à jour ! Re-connexion conseillée.");
    });

    // Production Entry (if on production page)
    document.getElementById('production-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const editId = document.getElementById('edit-log-id').value;
        const fId = parseInt(document.getElementById('formulation-select').value);
        const qty = parseFloat(document.getElementById('quantity').value);
        const centrale = document.getElementById('centrale-select').value;
        const destination = document.getElementById('destination').value;
        const date = document.getElementById('prod-date').value;

        if (editId) {
            // Edit not fully implemented in backend yet, using alert
            alert("Modification non supportée pour le moment en mode connecté");
        } else {
            const data = { date, centrale, destination, formulationId: fId, quantity: qty };
            try {
                const res = await fetch('/api/production', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                if (res.ok) {
                    await loadInitialData();
                    loadProductionData();
                    closeProductionModal();
                } else {
                    alert("Erreur lors de l'enregistrement");
                }
            } catch (err) { console.error(err); }
        }
    });

    // User Management (if on users page)
    document.getElementById('add-user-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fullName = document.getElementById('nu-name').value;
        const username = document.getElementById('nu-user').value;
        const pass = document.getElementById('nu-pass').value;
        const role = document.getElementById('nu-role').value;

        try {
            const res = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fullName, username, password: pass, role })
            });

            if (res.ok) {
                await loadUsersList();
                document.getElementById('add-user-form').reset();
            } else {
                alert("Erreur ajout utilisateur");
            }
        } catch (err) { console.error(err); }
    });

    // New Formulation (if on formulations page)
    document.getElementById('new-formulation-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const editId = e.target.dataset.editId;
        const fData = {
            code: document.getElementById('f-nom').value,
            ciment: parseFloat(document.getElementById('f-ciment').value),
            eau: parseFloat(document.getElementById('f-eau').value),
            poly: parseFloat(document.getElementById('f-poly').value),
            g1525: parseFloat(document.getElementById('f-g1525').value),
            g815: parseFloat(document.getElementById('f-g815').value),
            s01: parseFloat(document.getElementById('f-s01').value),
            s03: parseFloat(document.getElementById('f-s03').value)
        };

        if (editId) {
            const index = formulations.findIndex(f => f.id == editId);
            if (index !== -1) {
                formulations[index] = { ...formulations[index], ...fData };
            }
            delete e.target.dataset.editId;
            e.target.querySelector('button[type="submit"]').textContent = 'ENREGISTRER';
        } else {
            formulations.push({ id: Date.now(), ...fData });
        }

        saveAndReload('formulations', formulations, () => {
            loadFormulationsTable();
            document.getElementById('f-modal').style.display = 'none';
        });
        e.target.reset();
    });
}

function deleteFormulation(id) {
    if (confirm("Supprimer ce dosage ?")) {
        formulations = formulations.filter(f => f.id != id);
        saveAndReload('formulations', formulations, () => {
            if (window.location.pathname.includes('cab-formulations.html')) {
                loadFormulationsTable();
            }
        });
    }
}

function editFormulation(id) {
    const f = formulations.find(form => form.id == id);
    if (!f) return;
    document.getElementById('f-nom').value = f.code;
    document.getElementById('f-ciment').value = f.ciment;
    document.getElementById('f-eau').value = f.eau;
    document.getElementById('f-poly').value = f.poly;
    document.getElementById('f-g1525').value = f.g1525;
    document.getElementById('f-g815').value = f.g815;
    document.getElementById('f-s01').value = f.s01;
    document.getElementById('f-s03').value = f.s03;

    // Changing modal submit label
    const submitBtn = document.querySelector('#new-formulation-form button[type="submit"]');
    if (submitBtn) submitBtn.textContent = 'MODIFIER LE DOSAGE';

    // Store ID for update
    document.getElementById('new-formulation-form').dataset.editId = id;

    document.getElementById('f-modal').style.display = 'flex';
}

// --- Stats & Filtering ---
function initFilters() {
    const startDate = document.getElementById('stats-start-date');
    const endDate = document.getElementById('stats-end-date');
    if (!startDate || !endDate) return;

    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

    startDate.value = firstDay.toISOString().split('T')[0];
    endDate.value = today.toISOString().split('T')[0];
}

function toggleDateInputs() {
    const period = document.getElementById('stats-period-type').value;
    const startInput = document.getElementById('stats-start-date');
    const endInput = document.getElementById('stats-end-date');
    if (period === 'RANGE') {
        startInput.disabled = false;
        endInput.disabled = false;
    } else {
        startInput.disabled = true;
        endInput.disabled = true;

        const now = new Date();
        if (period === 'DAY') {
            const today = now.toISOString().split('T')[0];
            startInput.value = today;
            endInput.value = today;
        } else if (period === 'MONTH') {
            startInput.value = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
            endInput.value = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
        } else if (period === 'YEAR') {
            startInput.value = `${now.getFullYear()}-01-01`;
            endInput.value = `${now.getFullYear()}-12-31`;
        }
    }
}

function filterStats() {
    const period = document.getElementById('stats-period-type').value;
    let start = document.getElementById('stats-start-date').value;
    let end = document.getElementById('stats-end-date').value;

    // Fallback if empty and not handled by toggle
    if (!start) start = '2000-01-01';
    if (!end) end = '2100-12-31';

    const centrale = document.getElementById('stats-centrale').value;
    const material = document.getElementById('stats-material').value;

    const filtered = productionLogs.filter(log => {
        const dateMatch = log.date >= start && log.date <= end;
        const centraleMatch = (centrale === 'ALL' || log.centrale === centrale);
        return dateMatch && centraleMatch;
    });

    displayStats(filtered);

    // Material Focus
    document.querySelectorAll('.card').forEach(c => c.style.border = 'none');
    if (material !== 'ALL') {
        const targetId = `stats-total-${material}`;
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
            const card = targetElement.closest('.card');
            card.style.border = '3px solid var(--accent-orange)';
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
}

// --- Export Functions ---

function exportToExcel() {
    const logs = getFilteredLogs();
    if (logs.length === 0) { alert("Aucune donnée à exporter."); return; }

    const data = logs.map(log => {
        const f = formulations.find(form => form.id === log.formulationId);
        return {
            "Date": log.date,
            "Centrale": log.centrale,
            "Formulation": f ? f.code : '-',
            "Quantité (m3)": log.quantity,
            "Ciment (kg)": f ? (f.ciment * log.quantity) : 0,
            "Eau (L)": f ? (f.eau * log.quantity) : 0,
            "Poly Flow (kg)": f ? (f.poly * log.quantity) : 0,
            "Grav. 15/25 (kg)": f ? (f.g1525 * log.quantity) : 0,
            "Grav. 8/15 (kg)": f ? (f.g815 * log.quantity) : 0,
            "Sable 0/1 (kg)": f ? (f.s01 * log.quantity) : 0,
            "Sable 0/3 (kg)": f ? (f.s03 * log.quantity) : 0
        };
    });

    try {
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Statistiques");
        XLSX.writeFile(wb, `Stats_Production_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (e) {
        console.error('Export Excel error:', e);
        alert('Erreur lors de l\'export Excel. Vérifiez la console.');
    }
}

function exportToPDF() {
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('l', 'mm', 'a4');

        doc.setFontSize(18);
        doc.text("Rapport de Production - COSIDER CANALISATION", 14, 20);
        doc.setFontSize(12);
        doc.text(`Généré le: ${new Date().toLocaleString()}`, 14, 30);

        const logs = getFilteredLogs();
        if (logs.length === 0) { alert("Aucune donnée à exporter."); return; }

        const tableData = logs.map(log => {
            const f = formulations.find(form => form.id === log.formulationId);
            return [
                log.date,
                log.centrale,
                f ? f.code : '-',
                `${log.quantity} m3`,
                f ? (f.ciment * log.quantity).toLocaleString() : '0'
            ];
        });

        doc.autoTable({
            head: [['Date', 'Centrale', 'Formulation', 'Quantité', 'Ciment (kg)']],
            body: tableData,
            startY: 40,
            theme: 'striped'
        });

        doc.save(`Rapport_Production_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (e) {
        console.error('Export PDF error:', e);
        alert('Erreur lors de l\'export PDF. Vérifiez la console.');
    }
}

function exportToWord() {
    const logs = getFilteredLogs();
    if (logs.length === 0) { alert("Aucune donnée à exporter."); return; }

    let tableHtml = `<table border="1" style="border-collapse: collapse; width: 100%;">
        <thead>
            <tr style="background-color: #f2f2f2;">
                <th>Date</th><th>Centrale</th><th>Formulation</th><th>Quantité</th><th>Ciment (kg)</th>
            </tr>
        </thead>
        <tbody>`;

    logs.forEach(log => {
        const f = formulations.find(form => form.id === log.formulationId);
        tableHtml += `<tr>
            <td>${log.date}</td><td>${log.centrale}</td><td>${f ? f.code : '-'}</td>
            <td>${log.quantity} m3</td><td>${f ? (f.ciment * log.quantity).toLocaleString() : '0'}</td>
        </tr>`;
    });
    tableHtml += `</tbody></table>`;

    const docContent = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head><meta charset='utf-8'><title>Export Word</title></head>
        <body>
            <h1>Rapport de Production Statistiques</h1>
            <p>Date d'export: ${new Date().toLocaleString()}</p>
            ${tableHtml}
        </body>
        </html>`;

    try {
        const blob = new Blob(['\ufeff', docContent], { type: 'application/msword' });
        const fileName = `Export_Stats_${new Date().toISOString().split('T')[0]}.doc`;

        // Use msSaveBlob for IE/Edge, else create link
        if (window.navigator && window.navigator.msSaveOrOpenBlob) {
            window.navigator.msSaveOrOpenBlob(blob, fileName);
        } else {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 100);
        }
    } catch (e) {
        console.error('Export Word error:', e);
        alert('Erreur lors de l\'export Word. Vérifiez la console.');
    }
}

function getFilteredLogs() {
    let start = document.getElementById('stats-start-date')?.value || '';
    let end = document.getElementById('stats-end-date')?.value || '';
    const centrale = document.getElementById('stats-centrale')?.value || 'ALL';

    // If no dates, return all logs
    if (!start) start = '2000-01-01';
    if (!end) end = '2100-12-31';

    return productionLogs.filter(log => {
        const dateMatch = log.date >= start && log.date <= end;
        const centraleMatch = (centrale === 'ALL' || log.centrale === centrale);
        return dateMatch && centraleMatch;
    });
}

let statsChart = null;

function displayStats(logs) {
    const tbody = document.getElementById('stats-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    const role = currentUser ? currentUser.role : 'viewer';
    const isWeightInTons = (role === 'gestion' || role === 'magasin');

    let totalBeton = 0, totalCiment = 0, totalPoly = 0, totalEau = 0;
    let totalG1525 = 0, totalG815 = 0, totalS01 = 0, totalS03 = 0;

    const chartData = {};

    logs.forEach(log => {
        const f = formulations.find(form => form.id === log.formulationId);
        if (!f) return;

        const cimentLog = f.ciment * log.quantity;
        const polyLog = f.poly * log.quantity;
        const eauLog = f.eau * log.quantity;
        const g1525Log = f.g1525 * log.quantity;
        const g815Log = f.g815 * log.quantity;
        const s01Log = f.s01 * log.quantity;
        const s03Log = f.s03 * log.quantity;

        totalBeton += log.quantity;
        totalCiment += cimentLog;
        totalPoly += polyLog;
        totalEau += eauLog;
        totalG1525 += g1525Log;
        totalG815 += g815Log;
        totalS01 += s01Log;
        totalS03 += s03Log;

        // Chart Data collection (by date)
        chartData[log.date] = (chartData[log.date] || 0) + log.quantity;

        const tr = document.createElement('tr');
        const unitLabel = isWeightInTons ? 't' : 'kg';
        const displayCiment = isWeightInTons ? (cimentLog / 1000).toFixed(2) : cimentLog.toLocaleString();

        tr.innerHTML = `<td>${log.date}</td><td>${log.centrale}</td><td>${f.code}</td><td>${log.quantity} m³</td><td>${displayCiment} ${unitLabel}</td>`;
        tbody.appendChild(tr);
    });

    // Update Cards
    document.getElementById('stats-total-beton').textContent = totalBeton.toFixed(1);

    const updateCard = (id, val, unitK, isAggregate = false) => {
        const el = document.getElementById(id);
        if (!el) return;
        const title = el.previousElementSibling;
        if (isWeightInTons && isAggregate) {
            title.textContent = title.textContent.replace('(kg)', '').trim() + ' (t)';
            el.textContent = (val / 1000).toFixed(2);
        } else {
            el.textContent = val.toLocaleString() + (unitK ? '' : '');
        }
    };

    updateCard('stats-total-ciment', totalCiment, true);
    updateCard('stats-total-eau', totalEau, true);
    updateCard('stats-total-poly', totalPoly, false);
    updateCard('stats-total-g1525', totalG1525, true, true);
    updateCard('stats-total-g815', totalG815, true, true);
    updateCard('stats-total-s01', totalS01, true, true);
    updateCard('stats-total-s03', totalS03, true, true);

    // Update Chart if role is gestion
    if (role === 'gestion' || role === 'admin') {
        renderProductionChart(chartData);
    }
}

function renderProductionChart(data) {
    const ctx = document.getElementById('stats-chart');
    if (!ctx) return;

    const labels = Object.keys(data).sort();
    const values = labels.map(l => data[l]);

    if (statsChart) statsChart.destroy();

    statsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Volume Béton (m³)',
                data: values,
                backgroundColor: 'rgba(0, 74, 153, 0.7)',
                borderColor: '#004a99',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true } }
        }
    });
}

// --- Page Specific Loaders ---
function loadProductionData() {
    const tbody = document.getElementById('production-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    const role = currentUser ? currentUser.role : 'viewer';
    const isWeightInTons = (role === 'gestion' || role === 'magasin');
    const unit = isWeightInTons ? 't' : 'kg';

    let totalBeton = 0, totalCiment = 0;

    productionLogs.forEach(log => {
        const f = formulations.find(form => form.id === log.formulationId);
        if (!f) return;

        const cimentVal = f.ciment * log.quantity;
        const polyVal = f.poly * log.quantity;

        totalBeton += log.quantity;
        totalCiment += cimentVal;

        const displayCiment = isWeightInTons ? (cimentVal / 1000).toFixed(2) : cimentVal.toLocaleString();
        const displayPoly = isWeightInTons ? (polyVal / 1000).toFixed(3) : polyVal.toFixed(1);

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${log.date}</td>
            <td><span class="badge" style="background:#eee; padding:2px 8px; border-radius:4px; font-weight:bold;">${log.centrale}</span></td>
            <td>${log.destination || '-'}</td>
            <td><strong>${f.code}</strong></td>
            <td>${log.quantity} m³</td>
            <td>${displayCiment} ${unit}</td>
            <td>${displayPoly} ${unit}</td>
            <td class="admin-only">
                <button class="btn-icon" onclick="editProduction(${log.id})" style="color:var(--cosider-blue); background:none; border:none; cursor:pointer;"><i class="fas fa-edit"></i></button>
                <button class="btn-icon" onclick="deleteProduction(${log.id})" style="color:#e74c3c; background:none; border:none; cursor:pointer;"><i class="fas fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Update headers if needed
    if (isWeightInTons) {
        document.querySelectorAll('th').forEach(th => {
            if (th.textContent.includes('(kg)')) th.textContent = th.textContent.replace('(kg)', '(t)');
        });
        document.querySelectorAll('h3').forEach(h3 => {
            if (h3.textContent.includes('(kg)')) h3.textContent = h3.textContent.replace('(kg)', '(t)');
        });
    }

    document.getElementById('today-total-beton').textContent = totalBeton.toFixed(1);
    document.getElementById('today-total-ciment').textContent = isWeightInTons ? (totalCiment / 1000).toFixed(2) : totalCiment.toLocaleString();
}

function editProduction(id) {
    // Not implemented for now in API version to keep it simple
    alert("Modification non supportée pour le moment en mode connecté");
}

function openProductionModal() {
    const modal = document.getElementById('p-modal');
    if (modal) modal.style.display = 'flex';
}

function closeProductionModal() {
    const modal = document.getElementById('p-modal');
    if (!modal) return;
    modal.style.display = 'none';
    document.getElementById('production-form').reset();
    document.getElementById('edit-log-id').value = '';
    document.getElementById('modal-title').textContent = 'Saisie de Production';
    document.querySelector('#production-form button[type="submit"]').textContent = 'ENREGISTRER';
    document.getElementById('prod-date').value = new Date().toISOString().split('T')[0];
}

function deleteProduction(id) {
    // Not implemented
    alert("Suppression non supportée pour le moment en mode connecté");
}

async function loadFormulationsTable() {
    const tbody = document.getElementById('formulations-body');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="9">Chargement...</td></tr>';

    try {
        const res = await fetch('/api/formulations');
        if (res.ok) formulations = await res.json();
    } catch (e) { console.error(e); }

    tbody.innerHTML = formulations.map(f => `
        <tr>
            <td><strong>${f.code}</strong></td>
            <td>${f.ciment}</td>
            <td>${f.eau}</td>
            <td>${f.poly}</td>
            <td>${f.g1525}</td>
            <td>${f.g815}</td>
            <td>${f.s01}</td>
            <td>${f.s03}</td>
            <td class="admin-only">
                <button class="btn-icon" onclick="editFormulation(${f.id})"><i class="fas fa-edit"></i></button>
            </td>
        </tr>`).join('');
}

function editFormulation(id) {
    alert("Modification non supportée pour le moment");
}

function populateFormulationSelect() {
    const select = document.getElementById('formulation-select');
    if (!select) return;
    select.innerHTML = formulations.map(f => `<option value="${f.id}">${f.code}</option>`).join('');
}

async function loadUsersList() {
    const container = document.getElementById('users-list-container');
    if (!container) return;
    container.innerHTML = '<p>Chargement...</p>';

    try {
        const res = await fetch('/api/users');
        if (res.ok) users = await res.json();
    } catch (e) { console.error(e); }

    container.innerHTML = '';

    if (users.length === 0) {
        container.innerHTML = '<p style="color:#888;">Aucun utilisateur trouvé.</p>';
        return;
    }

    users.forEach(u => {
        const div = document.createElement('div');
        div.style.padding = '0.7rem';
        div.style.borderBottom = '1px solid #eee';
        div.style.display = 'flex';
        div.style.justifyContent = 'space-between';
        div.innerHTML = `<div><strong>${u.fullName || u.name}</strong> (@${u.username || u.user})<br><small>${u.role}</small></div>
            <button class="btn-icon" onclick="deleteUser(${u.id})"><i class="fas fa-trash"></i></button>`;
        container.appendChild(div);
    });
}

function deleteUser(id) {
    alert("Suppression non supportée pour le moment");
}
