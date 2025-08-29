# MyToDo AI-Powered Task Manager Workshop

## Workshop Overview

Build a beautiful, modern todo application with AI-powered subtask generation using Azure OpenAI. This workshop guides you through creating a production-ready web app using vanilla HTML, CSS, and JavaScript - no frameworks required!

**Final Goal:** A live, shareable webapp at `https://yourusername.github.io/mytodo` that your friends can use immediately.

---

## 🎯 Stage 1: Core Todo Foundation

**Outcome:** A fully functional todo app with task and subtask management, data persistence, and modern design.

### Instructions for Claude:

> Create a single-page todo application using only vanilla HTML, CSS, and JavaScript. No frameworks, no build process - just files that work when opened directly in a browser.
> 
> **Key Requirements:**
> - **Simplicity First:** Only implement what's essential for core functionality
> - **File Structure:** Create exactly 5 files: `index.html`, `styles.css`, `app.js`, `storage.js`, `ai.js` (leave ai.js empty for now)
> - **Data Model:** Tasks contain subtasks. Each task/subtask has: id, title, done status
> - **Core Features:** Add, edit, delete, and check off tasks and subtasks
> - **Persistence:** Save everything to localStorage under key 'todo.v1'
> - **Modern Design:** Clean, translucent interface with gradient backgrounds and smooth animations
> - **User Experience:** Click to edit text inline, Enter to save, Esc to cancel
> - **Visual Hierarchy:** Tasks have colored headers, subtasks are indented with left border
> - **Accessibility:** Proper focus styles, keyboard navigation, clear visual feedback
> 
> **UI Layout:**
> - Header with app title
> - "Add a New Task" button with plus icon
> - Task cards with: checkbox, editable title, delete button
> - Each task contains: subtasks list + "Add a New Sub Task" button + "PlanForMe" button (disabled for now)
> - Settings gear icon in bottom right
> 
> **Design Style:**
> - Gradient background (purple/blue theme)
> - White translucent cards with backdrop blur
> - Rounded corners, subtle shadows
> - Hover animations and transitions
> - Modern typography with good spacing
> 
> **Technical Notes:**
> - Use CSS custom properties for consistent styling
> - Implement proper event delegation
> - Handle edge cases (empty titles, etc.)
> - Make it responsive for mobile devices

### Acceptance Criteria:
- Open `index.html` in browser and create/manage tasks seamlessly
- Data persists after page refresh
- Clean, modern interface with smooth interactions
- All basic todo functionality works perfectly

---

## ⚙️ Stage 2: Azure AI Configuration

**Outcome:** Settings modal for Azure OpenAI configuration with smart URL parsing and connection testing.

### Instructions for Claude:

> Add Azure OpenAI integration setup to your todo app. Focus on making the configuration process simple and user-friendly.
> 
> **Key Requirements:**
> - **User-Centric Design:** Make AI setup as simple as possible for non-technical users
> - **Smart URL Parsing:** Accept full Azure OpenAI URLs and automatically extract components
> - **Validation:** Provide clear, helpful error messages for configuration issues
> - **Security:** Treat API keys as sensitive data with show/hide functionality
> 
> **Settings Modal Features:**
> - Triggered by gear icon, modal overlay with form
> - **Primary Input:** "Azure OpenAI Full URL" - accepts complete endpoint URLs like:
>   `https://yourname.openai.azure.com/openai/deployments/gpt-4o-mini/chat/completions?api-version=2024-02-15-preview`
> - **API Key Input:** Password field with show/hide eye icon
> - **Optional Fields:** Deployment name, API version (auto-extracted from URL)
> - **Smart Extraction:** Parse full URLs to extract base URL, deployment, and API version
> - **Test Connection:** Button to validate settings with actual API call
> - **Helpful Messaging:** Clear success/error feedback with specific guidance
> 
> **Data Management:**
> - Save to localStorage under 'todo.v1.settings'
> - Add helper functions: `loadSettings()`, `saveSettings()`, `hasValidSettings()`
> - Validate required fields and URL format
> 
> **UX Improvements:**
> - Enable/disable "PlanForMe" buttons based on configuration status
> - Visual indicators (button opacity, tooltips) when AI is not configured
> - Preserve settings across sessions
> - Handle edge cases gracefully
> 
> **Form Behavior:**
> - Close on Esc key or outside click
> - Form validation with user-friendly messages
> - Auto-focus on first field when opened
> - Save confirmation and auto-close on success

### Acceptance Criteria:
- Settings modal opens/closes smoothly
- URL parsing works with various Azure OpenAI URL formats
- Connection test provides clear feedback
- Settings persist and load correctly
- "PlanForMe" buttons show appropriate state

---

## 🤖 Stage 3: AI-Powered Planning

**Outcome:** Fully functional AI subtask generation with helpful resources and modern UI enhancements.

### Instructions for Claude:

> Implement the AI-powered "Plan for Me" functionality that generates intelligent subtasks and helpful resources. Focus on robust error handling and excellent user experience.
> 
> **Key Requirements:**
> - **Robust AI Integration:** Handle various response formats and edge cases gracefully
> - **Enhanced User Experience:** Smooth loading states, cancellable requests, helpful feedback
> - **Resource Integration:** Display helpful web resources alongside subtasks
> - **Error Resilience:** Comprehensive error handling with user-friendly messages
> 
> **AI Integration (`ai.js`):**
> - Implement `planSubtasks(settings, taskTitle, signal)` function
> - POST to Azure OpenAI chat completions endpoint
> - **Prompt Engineering:** Request JSON response with subtasks (title + optional URL) and general resources
> - **Response Format:** `{subtasks: [{title, url?}], resources: [{title, url}]}`
> - **Robust Parsing:** Handle malformed JSON, extract valid parts, provide fallbacks
> - **Error Handling:** Specific messages for 401, 403, 404, 429, network errors
> 
> **Enhanced UI Features:**
> - **Loading States:** Spinner on button and task row during AI processing
> - **Cancellation:** AbortController support with cancel button
> - **Smart Deduplication:** Prevent duplicate subtasks (case-insensitive)
> - **Resource Display:** Side pane (25% width) sliding from right with helpful URLs
> - **URL Integration:** Clickable link icons (🔗) next to subtasks with URLs
> - **Toast Notifications:** Success/error feedback with auto-dismiss
> 
> **Resources Side Pane:**
> - Slides in from right with smooth animation
> - Shows task-specific helpful web resources
> - Closeable with X button or Esc key
> - Responsive: becomes bottom pane on mobile
> - Clean link formatting with titles and URLs
> 
> **Visual Enhancements:**
> - Modern icons: 🪄 for "Plan for Me", ➕ for add buttons
> - Subtle delete buttons (light grey ×) that appear on hover
> - Larger fonts for better readability (18px tasks, 16px subtasks)
> - Enhanced animations and hover effects
> - Proper visual hierarchy with indentation
> 
> **Technical Implementation:**
> - Use fetch with AbortController for cancellable requests
> - Implement request queuing (one AI request per task at a time)
> - Handle JSON parsing edge cases robustly
> - Provide specific error messages for different failure modes
> - Ensure UI state is always consistent

### Acceptance Criteria:
- "Plan for Me" generates 3-6 relevant subtasks for any task
- Helpful web resources appear in side pane
- Smooth loading states and error handling
- URL links work and show helpful tooltips
- All edge cases handled gracefully

---

## 🚀 Stage 4: Deployment & Sharing

**Outcome:** Live website published on GitHub Pages that anyone can access and use.

### Instructions for Claude:

> Help the user deploy their todo app to GitHub Pages so they can share it with friends. Focus on making the deployment process smooth and the final result professional.
> 
> **Key Requirements:**
> - **Professional Deployment:** Create a live website that showcases the app properly
> - **User-Friendly Sharing:** Ensure the deployed app is intuitive for end users
> - **Documentation:** Provide clear setup instructions and feature descriptions
> 
> **GitHub Repository Setup:**
> - Initialize Git repository in project folder
> - Create comprehensive README.md with:
>   - App description and features
>   - Screenshots or feature highlights
>   - Setup instructions for AI features
>   - Usage guide for end users
>   - Technology stack information
> - Commit all project files with descriptive messages
> - Create public GitHub repository
> - Push code to main branch
> 
> **GitHub Pages Configuration:**
> - Enable GitHub Pages from repository settings
> - Deploy from main branch root folder
> - Verify deployment and functionality
> - Test all features work correctly on live site
> 
> **Final Polish:**
> - Ensure all placeholder text uses "Eg:" prefixes for clarity
> - Verify settings validation works properly
> - Test AI integration on live deployment
> - Confirm responsive design works on various devices
> - Validate all interactions and animations
> 
> **User Experience Optimization:**
> - Clear onboarding for new users
> - Helpful error messages and guidance
> - Intuitive interface that doesn't require explanation
> - Professional appearance suitable for sharing
> 
> **Documentation for End Users:**
> - How to use basic todo features
> - How to set up AI features (optional)
> - What to expect from AI-powered planning
> - Troubleshooting common issues

### Acceptance Criteria:
- Live website accessible at `https://username.github.io/mytodo`
- All features work correctly on deployed version
- Professional appearance suitable for sharing with colleagues
- Clear documentation for both users and developers
- Repository properly organized with good commit history

---

## 🎉 Workshop Success Metrics

**By the end of this workshop, you will have:**

✅ **A Production-Ready Web App** - Fully functional todo manager with AI integration  
✅ **Live Deployment** - Shareable URL that friends and colleagues can use immediately  
✅ **Modern Tech Stack** - Vanilla JavaScript app with professional polish  
✅ **AI Integration** - Azure OpenAI powered subtask generation  
✅ **User-Friendly Interface** - Intuitive design that requires no explanation  
✅ **Professional Portfolio Piece** - GitHub repository showcasing your development skills  

**Share your creation:** `https://yourusername.github.io/mytodo`

---

## 💡 Workshop Tips

- **Trust the Process:** Each stage builds on the previous one - complete them in order
- **Focus on Outcomes:** Describe what you want, not how to implement it
- **Embrace Simplicity:** Let Claude handle the technical complexity
- **Test Frequently:** Verify each stage works before moving to the next
- **Polish Matters:** Small UX details make a big difference in the final product

**Ready to build something amazing? Start with Stage 1!** 🚀
