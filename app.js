// app.js - Main application logic

let tasks = [];
let editingElement = null;

// Initialize the application
function init() {
    tasks = Storage.loadTasks();
    setupEventListeners();
    renderTasks();
    updatePlanForMeButtons();
}

// Set up event listeners
function setupEventListeners() {
    const addTaskBtn = document.getElementById('add-task-btn');
    const settingsBtn = document.getElementById('settings-btn');
    const modal = document.getElementById('settings-modal');
    const closeModalBtn = document.getElementById('close-modal');
    const settingsForm = document.getElementById('settings-form');
    const testConnectionBtn = document.getElementById('test-connection');
    const togglePasswordBtn = document.getElementById('toggle-password');
    const closeResourcesBtn = document.getElementById('close-resources');
    
    addTaskBtn.addEventListener('click', addNewTask);
    settingsBtn.addEventListener('click', openSettingsModal);
    closeModalBtn.addEventListener('click', closeSettingsModal);
    settingsForm.addEventListener('submit', saveSettings);
    testConnectionBtn.addEventListener('click', testConnection);
    togglePasswordBtn.addEventListener('click', togglePasswordVisibility);
    closeResourcesBtn.addEventListener('click', hideResourcesPane);
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeSettingsModal();
        }
    });
    
    // Global keyboard shortcuts
    document.addEventListener('keydown', handleGlobalKeydown);
    document.addEventListener('click', handleGlobalClick);
}

// Handle global keydown events
function handleGlobalKeydown(e) {
    // Escape key cancels editing, closes modal, or closes resources pane
    if (e.key === 'Escape') {
        if (editingElement) {
            cancelEdit();
        } else {
            const resourcesPane = document.getElementById('resources-pane');
            if (resourcesPane.classList.contains('open')) {
                hideResourcesPane();
            } else {
                closeSettingsModal();
            }
        }
    }
}

// Handle global click events
function handleGlobalClick(e) {
    // If clicking outside of editing element, save the edit
    if (editingElement && !editingElement.contains(e.target)) {
        saveEdit();
    }
}

// Add a new task
function addNewTask() {
    const newTask = Storage.createTask('New Task');
    tasks.push(newTask);
    saveTasks();
    renderTasks();
    
    // Focus on the new task title for editing
    setTimeout(() => {
        const taskElement = document.querySelector(`[data-task-id="${newTask.id}"] .task-title`);
        if (taskElement) {
            startEdit(taskElement);
        }
    }, 10);
}

// Add a new subtask to a task
function addNewSubtask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const newSubtask = Storage.createSubTask('New Sub Task');
    task.subtasks.push(newSubtask);
    saveTasks();
    renderTasks();
    
    // Focus on the new subtask title for editing
    setTimeout(() => {
        const subtaskElement = document.querySelector(`[data-subtask-id="${newSubtask.id}"] .subtask-title`);
        if (subtaskElement) {
            startEdit(subtaskElement);
        }
    }, 10);
}

// Toggle task completion
function toggleTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.done = !task.done;
        saveTasks();
        renderTasks();
    }
}

// Toggle subtask completion
function toggleSubtask(taskId, subtaskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        const subtask = task.subtasks.find(s => s.id === subtaskId);
        if (subtask) {
            subtask.done = !subtask.done;
            saveTasks();
            renderTasks();
        }
    }
}

// Delete a task
function deleteTask(taskId) {
    if (confirm('Are you sure you want to delete this task?')) {
        tasks = tasks.filter(t => t.id !== taskId);
        saveTasks();
        renderTasks();
    }
}

// Delete a subtask
function deleteSubtask(taskId, subtaskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.subtasks = task.subtasks.filter(s => s.id !== subtaskId);
        saveTasks();
        renderTasks();
    }
}

// Start editing an element
function startEdit(element) {
    if (editingElement) {
        saveEdit();
    }
    
    editingElement = element;
    element.classList.add('editing');
    element.focus();
    
    // Select all text
    if (element.setSelectionRange) {
        element.setSelectionRange(0, element.value.length);
    }
    
    // Handle Enter key to save
    element.addEventListener('keydown', handleEditKeydown);
}

// Handle keydown events during editing
function handleEditKeydown(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        saveEdit();
    }
}

// Save the current edit
function saveEdit() {
    if (!editingElement) return;
    
    const newValue = editingElement.value.trim();
    const taskId = editingElement.closest('[data-task-id]')?.dataset.taskId;
    const subtaskId = editingElement.closest('[data-subtask-id]')?.dataset.subtaskId;
    
    if (subtaskId && taskId) {
        // Editing a subtask
        const task = tasks.find(t => t.id === taskId);
        const subtask = task?.subtasks.find(s => s.id === subtaskId);
        if (subtask) {
            if (newValue) {
                subtask.title = newValue;
            } else {
                // Delete empty subtask
                task.subtasks = task.subtasks.filter(s => s.id !== subtaskId);
            }
        }
    } else if (taskId) {
        // Editing a task
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            if (newValue) {
                task.title = newValue;
            } else {
                // Delete empty task
                tasks = tasks.filter(t => t.id !== taskId);
            }
        }
    }
    
    cancelEdit();
    saveTasks();
    renderTasks();
}

// Cancel the current edit
function cancelEdit() {
    if (editingElement) {
        editingElement.classList.remove('editing');
        editingElement.removeEventListener('keydown', handleEditKeydown);
        editingElement = null;
    }
}

// Plan for me functionality with enhanced UI and abort support
let planningControllers = new Map(); // Track abort controllers for each task

async function planForMe(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    if (!AI.isConfigured()) {
        showToast('Please configure your AI settings first.', 'error');
        openSettingsModal();
        return;
    }

    // If already planning this task, cancel it
    if (planningControllers.has(taskId)) {
        planningControllers.get(taskId).abort();
        planningControllers.delete(taskId);
    }

    const planBtn = document.querySelector(`[data-task-id="${taskId}"] .plan-for-me-btn`);
    const taskRow = document.querySelector(`[data-task-id="${taskId}"]`);
    
    try {
        // Create abort controller for this request
        const controller = new AbortController();
        planningControllers.set(taskId, controller);

        // Update UI to show planning state
        if (planBtn) {
            planBtn.disabled = true;
            planBtn.innerHTML = '<span class="spinner">⏳</span> Planning...';
            planBtn.onclick = () => {
                controller.abort();
                planningControllers.delete(taskId);
                planBtn.disabled = false;
                planBtn.innerHTML = 'PlanForMe';
                planBtn.onclick = () => planForMe(taskId);
                showToast('Planning cancelled', 'info');
            };
        }
        
        // Add spinner to task row
        if (taskRow) {
            taskRow.classList.add('planning');
        }

        // Call the AI service
        const result = await AI.planSubtasks(Storage.loadSettings(), task.title, controller.signal);
        
        // Add emoticon to main task if provided
        if (result.taskEmoticon && !task.title.match(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}]/u)) {
            task.title = `${result.taskEmoticon} ${task.title}`;
        }
        
        // Merge new subtasks with existing ones (case-insensitive dedupe)
        const existingTitles = new Set(task.subtasks.map(st => st.title.toLowerCase()));
        const newSubtasks = result.subtasks.filter(st => 
            !existingTitles.has(st.title.toLowerCase())
        );
        
        task.subtasks.push(...newSubtasks);
        
        // Show resources if available
        if (result.resources && result.resources.length > 0) {
            showResourcesPane(task.title, result.resources);
        }
        
        // Save and re-render
        saveTasks();
        renderTasks();
        
        const count = newSubtasks.length;
        showToast(`Added ${count} new subtask${count !== 1 ? 's' : ''} to "${task.title}"`, 'success');
        
    } catch (error) {
        console.error('Error generating subtasks:', error);
        
        // Handle different error types with friendly messages
        let message = 'Error generating subtasks';
        if (error.message.includes('cancelled') || error.name === 'AbortError') {
            message = 'Planning was cancelled';
        } else if (error.message.includes('401') || error.message.includes('403')) {
            message = 'Authentication failed. Please check your API key.';
        } else if (error.message.includes('404')) {
            message = 'Resource not found. Please check your deployment settings.';
        } else if (error.message.includes('429')) {
            message = 'Rate limit exceeded. Please try again in a moment.';
        } else if (error.message.includes('Network')) {
            message = 'Network error. Please check your connection.';
        } else if (error.message.includes("Couldn't parse")) {
            message = "Couldn't parse AI response. Please try again.";
        } else {
            message = error.message;
        }
        
        showToast(message, 'error');
        
    } finally {
        // Clean up UI state
        planningControllers.delete(taskId);
        
        if (planBtn) {
            planBtn.disabled = false;
            planBtn.innerHTML = 'PlanForMe';
            planBtn.onclick = () => planForMe(taskId);
        }
        
        if (taskRow) {
            taskRow.classList.remove('planning');
        }
    }
}

// Settings Modal Functions
function openSettingsModal() {
    const modal = document.getElementById('settings-modal');
    const form = document.getElementById('settings-form');
    
    // Load current settings
    const settings = Storage.loadSettings();
    form.elements.apiBaseUrl.value = settings.apiBaseUrl || '';
    form.elements.apiKey.value = settings.apiKey || '';
    form.elements.deployment.value = settings.deployment || '';
    form.elements.apiVersion.value = settings.apiVersion || '';
    
    modal.classList.add('show');
    form.elements.apiBaseUrl.focus();
}

function closeSettingsModal() {
    const modal = document.getElementById('settings-modal');
    const statusDiv = document.getElementById('connection-status');
    modal.classList.remove('show');
    statusDiv.className = 'connection-status';
    statusDiv.textContent = '';
}

function togglePasswordVisibility() {
    const passwordInput = document.getElementById('api-key');
    const toggleBtn = document.getElementById('toggle-password');
    const eyeIcon = toggleBtn.querySelector('.eye-icon');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        eyeIcon.textContent = '🙈';
    } else {
        passwordInput.type = 'password';
        eyeIcon.textContent = '👁';
    }
}

async function saveSettings(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    let settings = {
        apiBaseUrl: formData.get('apiBaseUrl').trim(),
        apiKey: formData.get('apiKey').trim(),
        deployment: formData.get('deployment').trim(),
        apiVersion: formData.get('apiVersion').trim()
    };
    
    // Validate required fields
    if (!settings.apiBaseUrl || !settings.apiKey) {
        showConnectionStatus('API Base URL and API Key are required.', 'error');
        return;
    }
    
    // Try to extract deployment and API version from URL if not provided
    if (!settings.deployment || !settings.apiVersion) {
        try {
            const parsed = AI.parseAzureOpenAIUrl(settings.apiBaseUrl);
            if (!settings.deployment && parsed.deployment) {
                settings.deployment = parsed.deployment;
            }
            if (!settings.apiVersion && parsed.apiVersion) {
                settings.apiVersion = parsed.apiVersion;
            }
            if (parsed.isFullUrl && parsed.baseUrl) {
                settings.apiBaseUrl = parsed.baseUrl;
            }
        } catch (error) {
            console.error('Error parsing URL:', error);
        }
    }
    
    // Final validation - now check if we have all required fields
    if (!settings.deployment || !settings.apiVersion) {
        showConnectionStatus('Could not extract deployment name or API version from URL. Please provide them manually.', 'error');
        return;
    }
    
    // Validate URL format
    try {
        new URL(settings.apiBaseUrl);
    } catch {
        showConnectionStatus('Please enter a valid API Base URL.', 'error');
        return;
    }
    
    Storage.saveSettings(settings);
    updatePlanForMeButtons();
    showConnectionStatus('Settings saved successfully!', 'success');
    
    setTimeout(() => {
        closeSettingsModal();
    }, 1500);
}

async function testConnection() {
    const form = document.getElementById('settings-form');
    const formData = new FormData(form);
    let settings = {
        apiBaseUrl: formData.get('apiBaseUrl').trim(),
        apiKey: formData.get('apiKey').trim(),
        deployment: formData.get('deployment').trim(),
        apiVersion: formData.get('apiVersion').trim()
    };
    
    // Validate required fields
    if (!settings.apiBaseUrl || !settings.apiKey) {
        showConnectionStatus('API Base URL and API Key are required.', 'error');
        return;
    }
    
    // Try to extract deployment and API version from URL if not provided
    if (!settings.deployment || !settings.apiVersion) {
        try {
            const parsed = AI.parseAzureOpenAIUrl(settings.apiBaseUrl);
            if (!settings.deployment && parsed.deployment) {
                settings.deployment = parsed.deployment;
            }
            if (!settings.apiVersion && parsed.apiVersion) {
                settings.apiVersion = parsed.apiVersion;
            }
            if (parsed.isFullUrl && parsed.baseUrl) {
                settings.apiBaseUrl = parsed.baseUrl;
            }
        } catch (error) {
            console.error('Error parsing URL:', error);
        }
    }
    
    // Final validation
    if (!settings.deployment || !settings.apiVersion) {
        showConnectionStatus('Could not extract deployment name or API version from URL. Please provide them manually.', 'error');
        return;
    }
    
    const testBtn = document.getElementById('test-connection');
    testBtn.disabled = true;
    testBtn.textContent = 'Testing...';
    
    try {
        await AI.testConnection(settings);
        showConnectionStatus('Connection successful! ✓', 'success');
    } catch (error) {
        showConnectionStatus(`Connection failed: ${error.message}`, 'error');
    } finally {
        testBtn.disabled = false;
        testBtn.textContent = 'Test Connection';
    }
}

function showConnectionStatus(message, type) {
    const statusDiv = document.getElementById('connection-status');
    statusDiv.className = `connection-status ${type}`;
    statusDiv.textContent = message;
}

function updatePlanForMeButtons() {
    const planButtons = document.querySelectorAll('.plan-for-me-btn');
    const isConfigured = Storage.hasValidSettings();
    
    planButtons.forEach(btn => {
        // Don't disable the button - let the click through to show settings modal
        if (!isConfigured) {
            btn.title = 'Click to set up AI in Settings';
            btn.classList.add('tooltip');
            btn.style.opacity = '0.7'; // Visual indication that it needs setup
        } else {
            btn.title = '';
            btn.classList.remove('tooltip');
            btn.style.opacity = '1';
        }
    });
}

// Save tasks to storage
function saveTasks() {
    Storage.saveTasks(tasks);
}

// Render all tasks
function renderTasks() {
    const container = document.getElementById('tasks-container');
    container.innerHTML = '';
    
    tasks.forEach(task => {
        const taskElement = createTaskElement(task);
        container.appendChild(taskElement);
    });
    
    updatePlanForMeButtons();
}

// Create a task element
function createTaskElement(task) {
    const taskDiv = document.createElement('div');
    taskDiv.className = 'task-item';
    taskDiv.dataset.taskId = task.id;
    
    taskDiv.innerHTML = `
        <div class="task-header">
            <input type="checkbox" class="task-checkbox" ${task.done ? 'checked' : ''}>
            <input type="text" class="task-title ${task.done ? 'completed' : ''}" value="${task.title}">
            <div class="task-controls">
                <button class="delete-btn" title="Delete task">×</button>
            </div>
        </div>
        <div class="subtasks-container">
            ${task.subtasks.map(subtask => createSubtaskHTML(subtask)).join('')}
            <div class="add-subtask-section">
                <button class="add-subtask-btn">Add a New Sub Task</button>
                <button class="plan-for-me-btn">PlanForMe</button>
            </div>
        </div>
    `;
    
    // Add event listeners
    const checkbox = taskDiv.querySelector('.task-checkbox');
    const title = taskDiv.querySelector('.task-title');
    const deleteBtn = taskDiv.querySelector('.delete-btn');
    const addSubtaskBtn = taskDiv.querySelector('.add-subtask-btn');
    const planBtn = taskDiv.querySelector('.plan-for-me-btn');
    
    checkbox.addEventListener('change', () => toggleTask(task.id));
    title.addEventListener('click', () => startEdit(title));
    deleteBtn.addEventListener('click', () => deleteTask(task.id));
    addSubtaskBtn.addEventListener('click', () => addNewSubtask(task.id));
    planBtn.addEventListener('click', () => planForMe(task.id));
    
    // Add subtask event listeners
    task.subtasks.forEach(subtask => {
        const subtaskElement = taskDiv.querySelector(`[data-subtask-id="${subtask.id}"]`);
        if (subtaskElement) {
            const subtaskCheckbox = subtaskElement.querySelector('.subtask-checkbox');
            const subtaskTitle = subtaskElement.querySelector('.subtask-title');
            const subtaskDeleteBtn = subtaskElement.querySelector('.delete-btn');
            
            subtaskCheckbox.addEventListener('change', () => toggleSubtask(task.id, subtask.id));
            subtaskTitle.addEventListener('click', () => startEdit(subtaskTitle));
            if (subtaskDeleteBtn) {
                subtaskDeleteBtn.addEventListener('click', () => deleteSubtask(task.id, subtask.id));
            }
        }
    });
    
    return taskDiv;
}

// Create subtask HTML
function createSubtaskHTML(subtask) {
    console.log('Creating HTML for subtask:', subtask);
    
    let urlLink = '';
    if (subtask.url) {
        try {
            // Extract domain name for tooltip
            const domain = new URL(subtask.url).hostname.replace('www.', '');
            const tooltip = `${domain} - ${subtask.url}`;
            urlLink = ` <a href="${subtask.url}" target="_blank" class="subtask-url" data-tooltip="${tooltip}">🔗</a>`;
        } catch (error) {
            // Fallback for invalid URLs
            urlLink = ` <a href="${subtask.url}" target="_blank" class="subtask-url" data-tooltip="${subtask.url}">🔗</a>`;
        }
    }
    
    // Escape HTML in the title to prevent issues
    const safeTitle = subtask.title ? subtask.title.replace(/"/g, '&quot;') : '';
    
    return `
        <div class="subtask-item" data-subtask-id="${subtask.id}">
            <input type="checkbox" class="subtask-checkbox" ${subtask.done ? 'checked' : ''}>
            <input type="text" class="subtask-title ${subtask.done ? 'completed' : ''}" value="${safeTitle}">
            ${urlLink}
            <button class="delete-btn" title="Delete subtask">×</button>
        </div>
    `;
}

// Toast notification system
function showToast(message, type = 'info') {
    // Remove existing toast if any
    const existing = document.querySelector('.toast');
    if (existing) {
        existing.remove();
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Resources side pane for showing helpful URLs
function showResourcesPane(taskTitle, resources) {
    const resourcesPane = document.getElementById('resources-pane');
    const resourcesContent = document.getElementById('resources-content');
    const mainContent = document.querySelector('.main-content');
    
    // Update content
    resourcesContent.innerHTML = `
        <div class="resource-section">
            <h4>For: "${taskTitle}"</h4>
            <div class="resource-list">
                ${resources.map(resource => `
                    <div class="resource-item">
                        <a href="${resource.url}" target="_blank" class="resource-link">
                            <span class="resource-title">${resource.title}</span>
                            <span class="resource-url">${resource.url}</span>
                        </a>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    // Show the pane
    resourcesPane.classList.add('open');
    mainContent.classList.add('with-resources');
}

// Hide resources pane
function hideResourcesPane() {
    const resourcesPane = document.getElementById('resources-pane');
    const mainContent = document.querySelector('.main-content');
    
    resourcesPane.classList.remove('open');
    mainContent.classList.remove('with-resources');
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
