// ai.js - AI integration for PlanForMe functionality with Azure OpenAI

const AI = {
    // Get current settings
    getSettings() {
        return Storage.loadSettings();
    },

    // Check if AI is configured
    isConfigured() {
        return Storage.hasValidSettings();
    },

    // Parse Azure OpenAI URL to extract base URL, deployment, and API version
    parseAzureOpenAIUrl(fullUrl) {
        try {
            const url = new URL(fullUrl.trim());
            
            // Extract base URL (protocol + host)
            const baseUrl = `${url.protocol}//${url.host}`;
            
            // Extract deployment from path: /openai/deployments/{deployment}/...
            const pathMatch = url.pathname.match(/\/openai\/deployments\/([^\/]+)/);
            const deployment = pathMatch ? pathMatch[1] : null;
            
            // Extract API version from query parameters
            const apiVersion = url.searchParams.get('api-version');
            
            return {
                baseUrl,
                deployment,
                apiVersion,
                isFullUrl: !!(deployment || apiVersion) // true if URL contains OpenAI-specific parts
            };
        } catch (error) {
            console.error('Error parsing URL:', error);
            // If URL parsing fails, treat as base URL
            const cleanUrl = fullUrl.trim().replace(/\/$/, '');
            return {
                baseUrl: cleanUrl,
                deployment: null,
                apiVersion: null,
                isFullUrl: false
            };
        }
    },

    // Test the Azure OpenAI connection
    async testConnection(settings = null) {
        const config = settings || this.getSettings();
        
        if (!config.apiBaseUrl || !config.apiKey) {
            throw new Error('Missing required settings: API URL and API Key are required');
        }

        // Parse the full URL to extract components
        const urlInfo = this.parseAzureOpenAIUrl(config.apiBaseUrl);
        
        // Use extracted values or fall back to manual settings
        const baseUrl = urlInfo.baseUrl;
        const deployment = urlInfo.deployment || config.deployment;
        const apiVersion = urlInfo.apiVersion || config.apiVersion || '2024-02-15-preview';
        
        if (!deployment) {
            throw new Error('Deployment name not found in URL and not provided in settings');
        }

        const url = `${baseUrl}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;
        
        console.log('Testing connection with parsed settings:', {
            originalUrl: config.apiBaseUrl,
            parsedBaseUrl: baseUrl,
            parsedDeployment: deployment,
            parsedApiVersion: apiVersion,
            finalUrl: url,
            hasApiKey: !!config.apiKey,
            apiKeyLength: config.apiKey ? config.apiKey.length : 0
        });
        
        const requestBody = {
            messages: [
                {
                    role: 'user',
                    content: 'Hello! This is a test message.'
                }
            ],
            max_tokens: 10,
            temperature: 0.1
        };
        
        console.log('Request body:', JSON.stringify(requestBody, null, 2));
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'api-key': config.apiKey
                },
                body: JSON.stringify(requestBody)
            });

            console.log('Response status:', response.status);
            console.log('Response headers:', Object.fromEntries(response.headers.entries()));

            if (!response.ok) {
                let errorMessage;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error?.message || errorData.message || `HTTP ${response.status} ${response.statusText}`;
                } catch {
                    errorMessage = `HTTP ${response.status} ${response.statusText}`;
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();
            console.log('Connection test successful:', data);
            return data;
        } catch (error) {
            console.error('Connection test failed:', error);
            
            // Provide more helpful error messages
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Network error: Unable to connect to the API endpoint. Please check your internet connection and API base URL.');
            } else if (error.message.includes('401')) {
                throw new Error('Authentication failed: Invalid API key. Please check your API key.');
            } else if (error.message.includes('403')) {
                throw new Error('Access denied: Check your API key permissions and subscription status.');
            } else if (error.message.includes('404')) {
                throw new Error(`Resource not found: Check your API base URL and deployment name. 
                URL attempted: ${url}
                Common issues:
                - Deployment name "${config.deployment}" may not exist
                - API base URL should be like: https://your-resource.openai.azure.com
                - Make sure the deployment is created in Azure OpenAI Studio`);
            } else if (error.message.includes('429')) {
                throw new Error('Rate limit exceeded: Too many requests. Please try again later.');
            } else {
                throw error;
            }
        }
    },

    // Generate subtasks for a given task using Azure OpenAI
    async generateSubtasks(taskTitle, signal = null) {
        if (!this.isConfigured()) {
            throw new Error('AI is not configured. Please set up your Azure OpenAI settings.');
        }

        const config = this.getSettings();
        
        // Parse the URL to extract components
        const parsed = this.parseAzureOpenAIUrl(config.apiBaseUrl);
        console.log('Parsed URL components for generateSubtasks:', parsed);
        
        // Build the URL using parsed components or config fallback
        const baseUrl = parsed.baseUrl;
        const deployment = parsed.deployment || config.deployment;
        const apiVersion = parsed.apiVersion || config.apiVersion;
        
        if (!deployment || !apiVersion) {
            throw new Error('Missing deployment name or API version. Please check your configuration.');
        }
        
        const url = `${baseUrl}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;
        console.log('generateSubtasks URL:', url);

        const requestBody = {
            messages: [
                {
                    role: 'system',
                    content: 'You must respond with valid JSON only. No explanations, no markdown, no extra text. Format: {"subtasks":[{"title":"task description","url":"https://example.com"}],"resources":[{"title":"resource name","url":"https://example.com"}]}. Each subtask title must be under 60 characters and actionable.'
                },
                {
                    role: 'user',
                    content: `Break down "${taskTitle}" into 3-6 specific, actionable subtasks. For each subtask, include a helpful web URL (tutorial, guide, tool, or resource) when relevant. Also suggest 1-3 general web resources for this overall task. Return only valid JSON in the specified format.`
                }
            ],
            max_tokens: 500,
            temperature: 0.2
        };

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'api-key': config.apiKey
                },
                body: JSON.stringify(requestBody),
                signal: signal
            });

            if (!response.ok) {
                let errorMessage;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error?.message || errorData.message || `HTTP ${response.status} ${response.statusText}`;
                } catch {
                    errorMessage = `HTTP ${response.status} ${response.statusText}`;
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();
            const content = data.choices[0]?.message?.content?.trim();
            
            console.log('Raw AI response content:', content);
            
            if (!content) {
                throw new Error('No response from AI');
            }

            // Parse the JSON response - extract first { to last }
            let jsonStr = content;
            const firstBrace = content.indexOf('{');
            const lastBrace = content.lastIndexOf('}');
            
            if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                jsonStr = content.substring(firstBrace, lastBrace + 1);
            }
            
            console.log('Extracted JSON string:', jsonStr);

            let parsedResponse;
            try {
                parsedResponse = JSON.parse(jsonStr);
                console.log('Parsed response:', parsedResponse);
            } catch (parseError) {
                console.error('Failed to parse JSON:', parseError);
                console.error('JSON string that failed:', jsonStr);
                // Fallback: try to extract lines as subtasks
                const lines = content.split('\n').filter(line => line.trim());
                const subtaskTitles = lines.map(line => 
                    line.replace(/^[-*\d.]\s*/, '').replace(/^["']|["']$/g, '').trim()
                ).filter(title => title.length > 0);
                
                console.log('Fallback subtask titles:', subtaskTitles);
                
                return {
                    subtasks: subtaskTitles.slice(0, 6).map(title => Storage.createSubTask(title)),
                    resources: []
                };
            }

            // Validate shape
            if (!parsedResponse || !Array.isArray(parsedResponse.subtasks)) {
                console.error('Invalid response structure:', parsedResponse);
                // Try to extract subtasks in a different way
                if (parsedResponse && parsedResponse.subtasks) {
                    console.log('Attempting to fix subtasks array...');
                    if (typeof parsedResponse.subtasks === 'string') {
                        // Sometimes AI returns a string instead of array
                        return {
                            subtasks: [Storage.createSubTask(parsedResponse.subtasks)],
                            resources: []
                        };
                    }
                }
                throw new Error("Couldn't parse AI response - invalid format");
            }

            // Convert to subtask objects and limit to 6
            const subtasks = parsedResponse.subtasks.slice(0, 6).map(item => {
                console.log('Processing subtask item:', item);
                // Handle both string and object formats
                if (typeof item === 'string') {
                    return Storage.createSubTask(item);
                } else if (item && typeof item === 'object') {
                    // Handle object format with title and url
                    const title = item.title || item.name || String(item);
                    const url = item.url || null;
                    console.log('Creating subtask with title:', title, 'and url:', url);
                    return Storage.createSubTask(title, url);
                } else {
                    // Fallback for unexpected formats
                    console.warn('Unexpected item format:', item);
                    return Storage.createSubTask(String(item));
                }
            });

            console.log('Final subtasks created:', subtasks);

            const resources = parsedResponse.resources || [];

            return { subtasks, resources };

        } catch (error) {
            console.error('Error generating subtasks:', error);
            
            // Handle specific error types
            if (error.name === 'AbortError') {
                throw new Error('Request was cancelled');
            } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Network error: Unable to connect to the API endpoint.');
            } else if (error.message.includes('401')) {
                throw new Error('Authentication failed: Invalid API key.');
            } else if (error.message.includes('403')) {
                throw new Error('Access denied: Check your API key permissions.');
            } else if (error.message.includes('404')) {
                throw new Error('Resource not found: Check your deployment name.');
            } else if (error.message.includes('429')) {
                throw new Error('Rate limit exceeded: Too many requests.');
            } else {
                throw error;
            }
        }
    },

    // New function matching Prompt3.md specification
    async planSubtasks(settings, taskTitle, signal) {
        return await this.generateSubtasks(taskTitle, signal);
    }
};
