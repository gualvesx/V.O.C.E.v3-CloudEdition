// ================================================================
//                          LÓGICA DO DASHBOARD V.O.C.E
// ================================================================

let state = {
    activeClassId: null,
    activeClassName: '',
    allStudents: [],
    studentsInClass: [],
    editingStudentData: null,
    currentChartType: 'bar',
    mainChartInstance: null,
    // [NOVO] Objeto para armazenar o estado atual dos filtros
    currentFilters: {
        search: '',
        category: '',
        showAlertsOnly: false
    }
};

// --- FUNÇÕES DE MODAL ---
function openEditClassModal(classId, currentName) {
    const modal = document.getElementById('editClassModal');
    if(!modal) return;
    document.getElementById('editClassNameInput').value = currentName;
    modal.dataset.classId = classId;
    modal.classList.remove('hidden');
}

function closeModals() {
    document.getElementById('editClassModal')?.classList.add('hidden');
    document.getElementById('editStudentModal')?.classList.add('hidden');
}

function openEditStudentModal(student) {
    state.editingStudentData = student;
    const modal = document.getElementById('editStudentModal');
    if(!modal) return;
    document.getElementById('editStudentNameInput').value = student.full_name;
    document.getElementById('editStudentCpfInput').value = student.cpf || '';
    document.getElementById('editStudentPcIdInput').value = student.pc_id || '';
    modal.classList.remove('hidden');
}

function closeStudentModal() {
    document.getElementById('editStudentModal')?.classList.add('hidden');
}

function openAlertLogsModal(title, logs) {
    const modal = document.getElementById('alertLogsModal');
    const titleEl = document.getElementById('alertLogsTitle');
    const container = document.getElementById('alertLogsContainer');
    if (!modal || !titleEl || !container) return;

    titleEl.textContent = title;
    container.innerHTML = '';

    if (logs.length === 0) {
        container.innerHTML = '<p class="text-gray-500">Nenhum log encontrado para este alerta.</p>';
    } else {
        const table = document.createElement('table');
        table.className = 'min-w-full divide-y divide-gray-200';
        let tableHTML = `<thead class="bg-gray-50"><tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">URL</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duração</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data/Hora</th>
        </tr></thead><tbody class="bg-white divide-y divide-gray-200">`;
        
        logs.forEach(log => {
            tableHTML += `<tr>
                <td class="px-6 py-4 whitespace-nowrap text-sm"><a href="http://${log.url}" target="_blank" class="text-blue-600 hover:underline">${log.url}</a></td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">${log.duration}s</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">${log.categoria}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">${new Date(log.timestamp).toLocaleString('pt-BR')}</td>
            </tr>`;
        });

        tableHTML += '</tbody>';
        table.innerHTML = tableHTML;
        container.appendChild(table);
    }
    
    modal.classList.remove('hidden');
}

function closeAlertLogsModal() {
    const modal = document.getElementById('alertLogsModal');
    if(modal) modal.classList.add('hidden');
}


// --- FUNÇÕES DE RENDERIZAÇÃO E UI ---
function renderAllStudents() {
    const container = document.getElementById('all-students-list');
    if(!container) return;
    container.innerHTML = '';
    if (state.allStudents.length === 0) {
        container.innerHTML = `<p class="text-gray-500 text-sm p-2">Nenhum aluno cadastrado.</p>`;
        return;
    }
    const studentsInClassIds = state.studentsInClass.map(s => s.id);

    state.allStudents.forEach(student => {
        const studentDiv = document.createElement('div');
        const isAlreadyInClass = state.activeClassId && state.activeClassId !== 'null' && studentsInClassIds.includes(student.id);
        
        studentDiv.className = `flex justify-between items-center p-2 rounded ${isAlreadyInClass ? 'bg-green-100 text-gray-400' : 'bg-gray-50'}`;
        
        studentDiv.innerHTML = `
            <div class="flex items-center">
                <span class="${!isAlreadyInClass ? 'cursor-grab' : ''}" draggable="${!isAlreadyInClass}" data-student-id="${student.id}">${student.full_name}</span>
                <button data-student-json='${JSON.stringify(student)}' class="btn-edit-student ml-2 text-gray-400 hover:text-blue-600 text-xs">✏️</button>
            </div>
            <button 
                data-student-id="${student.id}" 
                class="btn-add-student text-green-500 hover:text-green-700 text-xl font-bold ${state.activeClassId && state.activeClassId !== 'null' && !isAlreadyInClass ? '' : 'hidden'}"
            >+</button>
        `;
        container.appendChild(studentDiv);
    });
}

function renderStudentsInClass() {
    const container = document.getElementById('students-in-class-list');
    if(!container) return;
    container.innerHTML = '';
    if (state.studentsInClass.length === 0) {
        container.innerHTML = `<p class="text-gray-500 text-sm text-center py-4">Arraste ou clique no '+' de um aluno para adicioná-lo aqui.</p>`;
        return;
    }
    state.studentsInClass.forEach(student => {
        const studentDiv = document.createElement('div');
        studentDiv.className = 'flex justify-between items-center bg-white p-2 rounded shadow-sm border';
        studentDiv.innerHTML = `
            <span>${student.full_name}</span>
            <button data-student-id="${student.id}" class="btn-remove-student text-red-500 hover:text-red-700 text-sm font-semibold">Remover</button>
        `;
        container.appendChild(studentDiv);
    });
}

function updateLogsTable(logs) {
    const tableBody = document.getElementById('logsTableBody');
    const logsCount = document.getElementById('logs-count');
    if (!tableBody || !logsCount) return;
    logsCount.textContent = logs.length;
    tableBody.innerHTML = '';
    if (logs.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center py-8 text-gray-500">Nenhum log encontrado para a seleção atual.</td></tr>';
        return;
    }
    const fragment = document.createDocumentFragment();
    logs.forEach(log => {
        const row = document.createElement('tr');
        const isRedAlert = ['Rede Social', 'Jogos', 'Streaming', 'Animes e Manga'].includes(log.categoria);
        const isBlueAlert = log.categoria === 'IA';

        if (isRedAlert) {
            row.className = 'bg-red-50 text-red-800 font-medium';
        } else if (isBlueAlert) {
            row.className = 'bg-blue-50 text-blue-800 font-medium';
        }

        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm">${log.student_name || log.aluno_id}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm"><a href="http://${log.url}" target="_blank" class="text-blue-600 hover:underline">${log.url}</a></td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">${log.duration}s</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">${log.categoria || 'N/A'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">${new Date(log.timestamp).toLocaleString('pt-BR')}</td>
        `;
        fragment.appendChild(row);
    });
    tableBody.appendChild(fragment);
}

function updateUserSummaryTable(users) {
    const tableBody = document.getElementById('usersTableBody');
    if (!tableBody) return;
    tableBody.innerHTML = '';
    if (users.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center py-8 text-gray-500">Nenhum dado de atividade para a seleção atual.</td></tr>';
        return;
    }
    const fragment = document.createDocumentFragment();
    users.forEach(user => {
        const row = document.createElement('tr');
        
        let statusHTML = '<span class="text-green-500 text-xl">✅</span>';
        if (user.has_red_alert || user.has_blue_alert) {
            statusHTML = '';
            if (user.has_red_alert) {
                statusHTML += `<button data-aluno-id="${user.aluno_id}" data-alert-type="red" class="alert-btn text-xl cursor-pointer" title="Mostrar logs de acesso indevido">⚠️</button>`;
            }
            if (user.has_blue_alert) {
                statusHTML += `<button data-aluno-id="${user.aluno_id}" data-alert-type="blue" class="alert-btn text-xl cursor-pointer ml-2" title="Mostrar logs de uso de IA">🔹</button>`;
            }
        }

        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm">${statusHTML}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${user.student_name || `<i>${user.aluno_id}</i>`}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">${user.aluno_id}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">${(user.total_duration / 60).toFixed(1)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">${user.log_count}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">${new Date(user.last_activity).toLocaleString('pt-BR')}</td>
        `;
        fragment.appendChild(row);
    });
    tableBody.appendChild(fragment);
}

function updateChart(logs) {
    const chartCanvas = document.getElementById('mainChart');
    if (!chartCanvas) return;
    if (state.mainChartInstance) state.mainChartInstance.destroy();
    const siteUsage = logs.reduce((acc, log) => {
        acc[log.url] = (acc[log.url] || 0) + log.duration;
        return acc;
    }, {});
    const topSites = Object.entries(siteUsage).sort(([, a], [, b]) => b - a).slice(0, 10);
    const chartLabels = topSites.map(site => site[0]);
    const chartData = topSites.map(site => site[1]);
    const backgroundColors = ['rgba(220, 38, 38, 0.7)', 'rgba(153, 27, 27, 0.7)', 'rgba(239, 68, 68, 0.7)', 'rgba(248, 113, 113, 0.7)', 'rgba(252, 165, 165, 0.7)'];
    state.mainChartInstance = new Chart(chartCanvas.getContext('2d'), {
        type: state.currentChartType,
        data: {
            labels: chartLabels.length > 0 ? chartLabels : ['Nenhum dado para exibir'],
            datasets: [{ label: 'Tempo de Uso (s)', data: chartData.length > 0 ? chartData : [], backgroundColor: backgroundColors }]
        },
        options: { indexAxis: state.currentChartType === 'bar' ? 'y' : 'x', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: state.currentChartType !== 'bar' } } }
    });
}

// --- FUNÇÕES DE FETCH ---
async function apiCall(url, method = 'GET', body = null) {
    const options = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) options.body = JSON.stringify(body);
    const response = await fetch(url, options);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `Erro ${response.status}` }));
        throw new Error(errorData.error || `Erro ${response.status}`);
    }
    return response.json();
}

async function createClass() {
    const nameInput = document.getElementById('newClassName');
    const name = nameInput.value.trim();
    if (!name) return alert('O nome da turma não pode estar vazio.');
    try {
        const result = await apiCall('/api/classes', 'POST', { name });
        alert(result.message);
        window.location.reload();
    } catch (error) {
        alert('Erro: ' + error.message);
    }
}

async function deleteClass(classId) {
    if (!confirm('ATENÇÃO: Isso removerá a turma permanentemente. Deseja continuar?')) return;
    try {
        const result = await apiCall(`/api/classes/${classId}`, 'DELETE');
        alert(result.message);
        window.location.reload();
    } catch (error) {
        alert('Erro: ' + error.message);
    }
}

async function saveClassChanges() {
    const classId = document.getElementById('editClassModal').dataset.classId;
    const newName = document.getElementById('editClassNameInput').value.trim();
    if (!newName) return alert('O nome não pode ser vazio.');
    try {
        const result = await apiCall(`/api/classes/${classId}`, 'PUT', { name: newName });
        alert(result.message);
        closeModals();
        window.location.reload();
    } catch (error) {
        alert('Erro: ' + error.message);
    }
}

async function saveStudentChanges() {
    if (!state.editingStudentData) return;
    const studentId = state.editingStudentData.id;
    const updatedData = {
        fullName: document.getElementById('editStudentNameInput').value.trim(),
        cpf: document.getElementById('editStudentCpfInput').value.trim(),
        pc_id: document.getElementById('editStudentPcIdInput').value.trim()
    };
    if (!updatedData.fullName) return alert('O nome do aluno é obrigatório.');
    try {
        await apiCall(`/api/students/${studentId}`, 'PUT', updatedData);
        alert('Dados do aluno atualizados!');
        closeStudentModal();
        await fetchAllStudents();
        renderAllStudents();
    } catch (error) {
        alert('Erro: ' + error.message);
    }
}

async function fetchAllStudents() {
    try {
        state.allStudents = await apiCall('/api/students/all');
    } catch (error) {
        console.error("Falha ao buscar a lista de todos os alunos:", error);
    }
}

async function fetchStudentsInClass(classId) {
    if (!classId || classId === 'null') {
        state.studentsInClass = [];
        return;
    }
    try {
        state.studentsInClass = await apiCall(`/api/classes/${classId}/students`);
    } catch (error) {
        console.error(`Falha ao buscar alunos da turma ${classId}:`, error);
        state.studentsInClass = [];
    }
}

// [MODIFICADO] A função agora busca os dados com base nos filtros do state
async function fetchDataPanels() {
    const classIdParam = state.activeClassId || 'null';
    const { search, category, showAlertsOnly } = state.currentFilters;

    const queryParams = new URLSearchParams({
        classId: classIdParam,
        search: search,
        category: category,
        showAlertsOnly: showAlertsOnly
    });

    try {
        const [summary, logs] = await Promise.all([
            apiCall(`/api/users/summary?${queryParams.toString()}`),
            apiCall(`/api/logs/filtered?${queryParams.toString()}`)
        ]);
        updateUserSummaryTable(summary);
        updateLogsTable(logs);
        updateChart(logs);
    } catch (error) {
        console.error("Erro ao buscar dados do painel:", error);
        updateUserSummaryTable([]);
        updateLogsTable([]);
        updateChart([]);
    }
}

// --- [NOVO] FUNÇÕES DE FILTRO ---
function applyFilters() {
    state.currentFilters.search = document.getElementById('searchInput').value.trim();
    state.currentFilters.category = document.getElementById('categoryFilter').value;
    state.currentFilters.showAlertsOnly = document.getElementById('alertsOnlyCheckbox').checked;
    fetchDataPanels();
}

function resetFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('categoryFilter').value = '';
    document.getElementById('alertsOnlyCheckbox').checked = false;
    
    state.currentFilters = {
        search: '',
        category: '',
        showAlertsOnly: false
    };
    fetchDataPanels();
}


// --- LÓGICA PRINCIPAL E EVENTOS ---
async function handleClassSelection(selectedId, selectedName) {
    state.activeClassId = selectedId;
    state.activeClassName = selectedName;
    
    // [MODIFICADO] Reseta os filtros ao mudar a turma para evitar confusão
    resetFilters();
    
    const managementPanel = document.getElementById('class-students-panel');
    const editBtn = document.getElementById('editClassBtn');
    const deleteBtn = document.getElementById('deleteClassBtn');

    // [MODIFICADO] A chamada agora não precisa de parâmetro, pois a função lê o state
    await fetchDataPanels();

    if (state.activeClassId && state.activeClassId !== 'null') {
        document.getElementById('class-name-in-list').textContent = state.activeClassName;
        managementPanel.classList.remove('hidden');
        editBtn.disabled = false;
        deleteBtn.disabled = false;
        await fetchStudentsInClass(state.activeClassId);
        renderStudentsInClass();
    } else {
        managementPanel.classList.add('hidden');
        editBtn.disabled = true;
        deleteBtn.disabled = true;
    }
    renderAllStudents();
}

document.addEventListener('DOMContentLoaded', async () => {
    await fetchAllStudents();
    renderAllStudents();
    await handleClassSelection(null, ''); 

    // Event listeners para gestão de turmas e alunos
    document.getElementById('createClassBtn')?.addEventListener('click', createClass);
    document.getElementById('editClassBtn')?.addEventListener('click', () => {
        if(state.activeClassId && state.activeClassId !== 'null') openEditClassModal(state.activeClassId, state.activeClassName);
    });
    document.getElementById('deleteClassBtn')?.addEventListener('click', () => {
        if(state.activeClassId && state.activeClassId !== 'null') deleteClass(state.activeClassId);
    });
    document.getElementById('saveClassChangesBtn')?.addEventListener('click', saveClassChanges);
    document.getElementById('saveStudentChangesBtn')?.addEventListener('click', saveStudentChanges);
    
    const classSelect = document.getElementById('classSelect');
    classSelect.addEventListener('change', (e) => {
        const selectedOption = e.target.options[e.target.selectedIndex];
        handleClassSelection(e.target.value, selectedOption.text);
    });

    const allStudentsList = document.getElementById('all-students-list');
    const classStudentsList = document.getElementById('students-in-class-list');

    allStudentsList.addEventListener('click', async (e) => {
        if (e.target.classList.contains('btn-add-student')) {
            const studentId = e.target.dataset.studentId;
            try {
                await apiCall(`/api/classes/${state.activeClassId}/add-student`, 'POST', { studentId });
                await fetchStudentsInClass(state.activeClassId);
                renderStudentsInClass();
                renderAllStudents();
            } catch (error) {
                alert(error.message);
            }
        }
        if (e.target.classList.contains('btn-edit-student')) {
            const studentData = JSON.parse(e.target.dataset.studentJson);
            openEditStudentModal(studentData);
        }
    });

    allStudentsList.addEventListener('dragstart', e => {
        const target = e.target.closest('[data-student-id]');
        if (target) {
            e.dataTransfer.setData('text/plain', target.dataset.studentId);
        }
    });

    classStudentsList.addEventListener('dragover', e => e.preventDefault());
    classStudentsList.addEventListener('drop', async e => {
        e.preventDefault();
        const studentId = e.dataTransfer.getData('text/plain');
        if (studentId && state.activeClassId && state.activeClassId !== 'null') {
            try {
                await apiCall(`/api/classes/${state.activeClassId}/add-student`, 'POST', { studentId });
                await fetchStudentsInClass(state.activeClassId);
                renderStudentsInClass();
                renderAllStudents();
            } catch (error) {
                alert(error.message);
            }
        }
    });

    classStudentsList.addEventListener('click', async (e) => {
        if (e.target.classList.contains('btn-remove-student')) {
            const studentId = e.target.dataset.studentId;
            if (confirm('Tem certeza que deseja remover este aluno da turma?')) {
                try {
                    await apiCall(`/api/classes/${state.activeClassId}/remove-student/${studentId}`, 'DELETE');
                    await fetchStudentsInClass(state.activeClassId);
                    renderStudentsInClass();
                    renderAllStudents();
                } catch(error) {
                    alert(error.message);
                }
            }
        }
    });

    document.getElementById('addStudentForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const studentData = Object.fromEntries(formData.entries());
        try {
            const result = await apiCall('/api/students', 'POST', studentData);
            state.allStudents.push(result.student);
            renderAllStudents();
            e.target.reset();
            alert('Aluno adicionado com sucesso!');
        } catch(error) {
            alert(error.message);
        }
    });
    
    document.getElementById('toggle-create-class-form').addEventListener('click', () => {
        document.getElementById('create-class-form-container').classList.toggle('hidden');
    });
    document.getElementById('toggle-add-student-form').addEventListener('click', () => {
        document.getElementById('add-student-form-container').classList.toggle('hidden');
    });

    // Event listeners para os botões do gráfico
    document.querySelectorAll('.chart-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            state.currentChartType = btn.dataset.type;
            document.querySelectorAll('.chart-btn').forEach(b => {
                b.classList.remove('active', 'bg-red-700', 'text-white');
                b.classList.add('bg-gray-200', 'text-gray-700');
            });
            btn.classList.add('active', 'bg-red-700', 'text-white');
            btn.classList.remove('bg-gray-200', 'text-gray-700');
            
            await fetchDataPanels(); 
        });
    });

    // Event listener para os botões de alerta na tabela de resumo
    document.getElementById('usersTableBody').addEventListener('click', async (e) => {
        const alertButton = e.target.closest('.alert-btn');
        if(alertButton) {
            const alunoId = alertButton.dataset.alunoId;
            const alertType = alertButton.dataset.alertType;
            try {
                const logs = await apiCall(`/api/alerts/${alunoId}/${alertType}`);
                const title = `Logs de Alerta (${alertType === 'red' ? 'Acesso Indevido' : 'Uso de IA'}) para ${alunoId}`;
                openAlertLogsModal(title, logs);
            } catch (error) {
                alert("Erro ao buscar os logs de alerta: " + error.message);
            }
        }
    });

    // [NOVO] Event listeners para os botões de filtro
    document.getElementById('filterBtn')?.addEventListener('click', applyFilters);
    document.getElementById('resetFilterBtn')?.addEventListener('click', resetFilters);
});
