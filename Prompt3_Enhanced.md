# "PlanForMe" → call Azure model → add subtasks

- Implement enhanced LLM integration in ai.js using fetch with crisp subtasks and helpful web URLs.

Function

```javascript
// ai.js
export async function planSubtasks(settings, taskTitle, signal) {
  // returns { subtasks: [{ title: string, url?: string }, ...], resources: [{ title: string, url: string }] }
}
```

HTTP (Azure OpenAI compatible)

POST ${apiBaseUrl}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}

Headers: api-key, Content-Type: application/json

Body:

```json
{
  "messages": [
    {"role": "system", "content": "Return JSON only: {\"subtasks\":[{\"title\":\"...\",\"url\":\"...\"}],\"resources\":[{\"title\":\"...\",\"url\":\"...\"}]}. Each subtask should be crisp, actionable, under 60 chars. Include helpful web URLs when relevant."},
    {"role": "user", "content": "Task: \"<taskTitle>\". Break this into 3-6 crisp, actionable subtasks that comprehensively help complete the main task. For each subtask, include a helpful web URL if relevant (tutorials, guides, tools, or resources). Also suggest 1-3 general web resources that would be helpful for this overall task."}
  ],
  "temperature": 0.2,
  "max_tokens": 500
}
```

Parsing

If response includes extra text, extract the first { to the last } and JSON.parse.

Validate shape; if invalid, show toast "Couldn't parse AI response".

UI wiring

Clicking PlanForMe on a task:

- shows a spinner on that task row,
- calls planSubtasks(...) with an AbortController to allow cancel,
- merges new subtasks (case-insensitive dedupe vs existing),
- displays helpful resource URLs as clickable links next to subtasks,
- shows a right side pane (1/4 of screen width) with general helpful URLs for the task,
- saves to localStorage and re-renders,
- provides toast notifications for success/error states.

Handle errors for 401/403/404/429/network separately with friendly toast messages.

Enhanced Features Added:

1. **Crisp Subtasks**: 3-6 actionable subtasks under 60 characters each
2. **Helpful URLs**: Each subtask can include relevant web resources (tutorials, guides, tools)
3. **Resources Side Pane**: 1/4 screen width pane showing general helpful web resources (replaces popup modal)
4. **Better UX**: Toast notifications, spinner indicators, cancellable requests
5. **URL Display**: Clickable links (🔗) next to subtasks with helpful resources and hover tooltips
6. **Error Handling**: Comprehensive error handling with user-friendly messages
7. **Responsive Design**: Side pane becomes bottom pane on mobile devices
8. **Modern Styling**: Translucent cards, gradient backgrounds, modern fonts, and smooth animations
9. **Enhanced Icons**: Magic wand (🪄) for "Plan for Me", sparkle (✨) for add buttons, plus (➕) for subtasks
10. **Visual Hierarchy**: Proper indentation for subtasks with left border and improved spacing
11. **Hover Effects**: Tooltips for URL links showing domain name and full URL
12. **Larger Fonts**: Increased font sizes for better readability (18px tasks, 16px subtasks)

Design Requirements:

- Modern gradient background with translucent elements
- Backdrop blur effects on cards and modals
- Smooth transitions and hover animations
- Consistent color scheme with purple/blue gradients
- Proper visual hierarchy with indented subtasks
- Professional spacing and typography

Layout Requirements:

- Main content area takes 3/4 of screen width when resources pane is open
- Resources pane slides in from right side with smooth animation
- Closeable with X button or Escape key
- Mobile responsive: converts to bottom pane on smaller screens

Acceptance

With valid settings, "Buy a Phone" produces 3–6 sensible subtasks with helpful URLs, shows general resources, and persists. UI provides smooth feedback during planning process.
