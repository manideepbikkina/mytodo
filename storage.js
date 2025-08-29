// storage.js - Handles localStorage persistence

const STORAGE_KEY = 'todo.v1';
const SETTINGS_KEY = 'todo.v1.settings';

// SubTask: { id: string, title: string, done: boolean }
// Task:    { id: string, title: string, done: boolean, subtasks: SubTask[] }

const Storage = {
    // Load all tasks from localStorage
    loadTasks() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error loading tasks from storage:', error);
            return [];
        }
    },

    // Save all tasks to localStorage
    saveTasks(tasks) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
        } catch (error) {
            console.error('Error saving tasks to storage:', error);
        }
    },

    // Generate a unique ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // Create a new task object
    createTask(title = '') {
        return {
            id: this.generateId(),
            title: title,
            done: false,
            subtasks: []
        };
    },

    // Create a new subtask object
    createSubTask(title = '', url = null) {
        const subtask = {
            id: this.generateId(),
            title: title,
            done: false
        };
        
        if (url) {
            subtask.url = url;
        }
        
        return subtask;
    },

    // Load settings from localStorage
    loadSettings() {
        try {
            const data = localStorage.getItem(SETTINGS_KEY);
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('Error loading settings from storage:', error);
            return {};
        }
    },

    // Save settings to localStorage
    saveSettings(settings) {
        try {
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        } catch (error) {
            console.error('Error saving settings to storage:', error);
        }
    },

    // Check if settings are valid for AI functionality
    hasValidSettings() {
        const settings = this.loadSettings();
        return !!(settings.apiBaseUrl && 
                 settings.apiKey && 
                 settings.deployment && 
                 settings.apiVersion);
    }
};
