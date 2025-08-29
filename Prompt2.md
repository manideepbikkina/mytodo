# Prompt for Settings modal for Azure AI Foundry endpoint + key

- Add a Settings modal (gear icon) at the bottom right corner.

Inputs

- apiBaseUrl (e.g., https://<resource>.openai.azure.com)

- apiKey (password input with show/hide)

- deployment (e.g., gpt-4o-mini)

- apiVersion (text, default to a sensible version)

Storage

- Save to localStorage under todo.v1.settings as a JSON object.

- Export helpers in storage.js: loadSettings(), saveSettings(), hasValidSettings().

UX

- If settings are incomplete, disable PlanForMe buttons and show tooltip “Set up AI in Settings”.

- “Test connection” button: make a minimal POST to the chat completions endpoint; show success/error; do not store test output.

Acceptance

- Refresh keeps settings. Bad values show readable errors.