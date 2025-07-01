
        // Theme Toggle Functionality
        const themeToggle = document.getElementById('themeToggle');
        const body = document.body;

        function updateThemeIcon() {
            const isDark = body.getAttribute('data-theme') === 'dark';
            themeToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        }

        themeToggle.addEventListener('click', () => {
            const currentTheme = body.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            body.setAttribute('data-theme', newTheme);
            updateThemeIcon();
        });

        // Tone Selection
        const toneOptions = document.querySelectorAll('.tone-option');
        let selectedTone = 'friendly';

        toneOptions.forEach(option => {
            option.addEventListener('click', () => {
                toneOptions.forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');
                selectedTone = option.getAttribute('data-tone');
            });
        });

        // ===== PRODUCTION CONFIGURATION =====
        // 🔑 ADD YOUR OPENROUTER API KEY HERE
        const OPENROUTER_API_KEY = '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'; // Replace with your actual API key
        
        // API Configuration
        const API_CONFIG = {
            baseUrl: 'https://openrouter.ai/api/v1/chat/completions',
            model: 'openai/gpt-3.5-turbo', // You can change this to other models like 'openai/gpt-4' or 'meta-llama/llama-2-7b-chat'
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': window.location.origin, // Required by OpenRouter
                'X-Title': 'ReplyGen Lite' // Optional: helps with usage analytics
            }
        };

        // Tone-specific prompts for better AI responses
        const tonePrompts = {
            friendly: "Write a warm, friendly, and approachable email reply. Use a conversational tone that feels personal and engaging. Be helpful and positive.",
            formal: "Write a professional, formal email reply. Use proper business language, maintain professional courtesy, and structure the response clearly with appropriate salutations.",
            apologetic: "Write an apologetic email reply that takes responsibility and shows genuine remorse. Be sincere, offer solutions, and demonstrate commitment to improvement.",
            enthusiastic: "Write an enthusiastic and energetic email reply. Show excitement, use positive language, and convey genuine interest and passion for the topic.",
            brief: "Write a concise, direct email reply. Keep it short and to the point while remaining professional and covering all necessary information."
        };

        // AI Reply Generation Function
        async function generateAIReply(originalEmail, tone) {
            if (!OPENROUTER_API_KEY || OPENROUTER_API_KEY === 'YOUR_OPENROUTER_API_KEY_HERE') {
                throw new Error('Please add your OpenRouter API key in the OPENROUTER_API_KEY variable');
            }

            const prompt = `You are an AI assistant that helps generate professional email replies. 

Original Email to Reply To:
"""
${originalEmail}
"""

Instructions:
- ${tonePrompts[tone]}
- Keep the reply appropriate and contextually relevant to the original email
- Use placeholders like [Your Name], [Date], etc. where specific information would be needed
- Make it ready to send with minimal editing
- Ensure the tone matches exactly what was requested: ${tone}

Generate only the email reply, no additional commentary:`;

            const response = await fetch(API_CONFIG.baseUrl, {
                method: 'POST',
                headers: API_CONFIG.headers,
                body: JSON.stringify({
                    model: API_CONFIG.model,
                    messages: [
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    max_tokens: 500,
                    temperature: 0.7
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`API Error: ${response.status} - ${errorData.error?.message || 'Failed to generate reply'}`);
            }

            const data = await response.json();
            
            if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                throw new Error('Invalid response format from API');
            }

            return data.choices[0].message.content.trim();
        }

        // Fallback templates (used when API fails or for demo purposes)
        const fallbackTemplates = {
            friendly: `Hi there!

Thanks so much for reaching out! I really appreciate you taking the time to send this over.

I'd be happy to help with this. Let me check my schedule and get back to you with some available times that work for both of us.

Looking forward to connecting soon!

Best regards,
[Your Name]`,
            formal: `Dear [Name],

Thank you for your email. I acknowledge receipt of your message and appreciate you bringing this matter to my attention.

I have reviewed the information provided and will respond with a comprehensive analysis within the next 2-3 business days.

Should you require immediate clarification, please do not hesitate to contact me directly.

Sincerely,
[Your Name]`,
            apologetic: `Dear [Name],

I sincerely apologize for the delay in responding to your email. I understand how important this matter is, and I should have gotten back to you sooner.

I take full responsibility and am committed to resolving this situation promptly. I'll have a detailed response to you by [specific date].

Thank you for your patience and understanding.

Sincerely,
[Your Name]`,
            enthusiastic: `Hi there!

This is fantastic news! I'm absolutely thrilled that you reached out about this opportunity - it sounds incredible!

I'm 100% on board and ready to get started immediately. When can we kick things off? I'm flexible with my schedule and can prioritize this project.

This is going to be amazing! Thank you so much for thinking of me!

Excitedly yours,
[Your Name]`,
            brief: `Hi [Name],

Thanks for your email. I can help with this.

Available next week for a call. Will send calendar invite shortly.

Best,
[Your Name]`
        };

        // Form Submission and Reply Generation
        const form = document.getElementById('replyForm');
        const generateBtn = document.getElementById('generateBtn');
        const resultContainer = document.getElementById('resultContainer');
        const replyOutput = document.getElementById('replyOutput');
        const copyBtn = document.getElementById('copyBtn');
        const downloadBtn = document.getElementById('downloadBtn');

        // Store generated reply for download
        let generatedReply = '';

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const emailInput = document.getElementById('emailInput').value.trim();
            
            if (!emailInput) {
                alert('Please paste an email to reply to.');
                return;
            }

            // Show loading state
            generateBtn.classList.add('loading');
            generateBtn.disabled = true;

            try {
                // Try to generate AI reply first
                let reply;
                try {
                    reply = await generateAIReply(emailInput, selectedTone);
                    console.log('✅ AI Reply Generated Successfully');
                } catch (apiError) {
                    console.warn('⚠️ AI API Failed, using fallback:', apiError.message);
                    
                    // Show user-friendly error message
                    if (apiError.message.includes('API key')) {
                        alert('⚠️ API Key Required: Please add your OpenRouter API key to enable AI generation. Using demo reply for now.');
                    } else {
                        alert('⚠️ AI service temporarily unavailable. Using demo reply.');
                    }
                    
                    // Use fallback template
                    reply = fallbackTemplates[selectedTone];
                    
                    // Add a small delay to simulate processing
                    await new Promise(resolve => setTimeout(resolve, 1500));
                }

                // Store the reply for download
                generatedReply = reply;
                
                // Show result
                replyOutput.textContent = reply;
                resultContainer.classList.add('show');
                
                // Smooth scroll to result
                setTimeout(() => {
                    resultContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
                
            } catch (error) {
                console.error('❌ Generation failed:', error);
                alert('Sorry, something went wrong. Please try again.');
            } finally {
                // Reset button state
                generateBtn.classList.remove('loading');
                generateBtn.disabled = false;
            }
        });

        // Download functionality
        downloadBtn.addEventListener('click', () => {
            if (!generatedReply) {
                alert('No reply to download. Please generate a reply first.');
                return;
            }

            // Create filename with timestamp
            const now = new Date();
            const timestamp = now.toISOString().slice(0, 19).replace(/:/g, '-');
            const filename = `email-reply-${timestamp}.txt`;
            
            // Create downloadable content
            const content = `Generated Email Reply
Generated on: ${now.toLocaleString()}
Tone: ${selectedTone.charAt(0).toUpperCase() + selectedTone.slice(1)}
Generated by: ReplyGen Lite

---

${generatedReply}

---

Generated with ReplyGen Lite - https://replygen-lite.com
`;

            // Create and trigger download
            const blob = new Blob([content], { type: 'text/plain' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            // Show success feedback
            const originalText = downloadBtn.querySelector('span').textContent;
            downloadBtn.querySelector('span').textContent = 'Downloaded!';
            setTimeout(() => {
                downloadBtn.querySelector('span').textContent = originalText;
            }, 2000);
        });

        // Copy functionality
        copyBtn.addEventListener('click', async () => {
            const replyText = replyOutput.textContent;
            
            try {
                await navigator.clipboard.writeText(replyText);
                
                // Show success feedback
                const originalText = copyBtn.querySelector('.copy-text').textContent;
                copyBtn.querySelector('.copy-text').textContent = 'Copied!';
                copyBtn.classList.add('copied');
                
                setTimeout(() => {
                    copyBtn.querySelector('.copy-text').textContent = originalText;
                    copyBtn.classList.remove('copied');
                }, 2000);
                
            } catch (err) {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = replyText;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                
                copyBtn.querySelector('.copy-text').textContent = 'Copied!';
                setTimeout(() => {
                    copyBtn.querySelector('.copy-text').textContent = 'Copy Reply';
                }, 2000);
            }
        });

        // Auto-resize textarea
        const emailTextarea = document.getElementById('emailInput');
        emailTextarea.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.max(200, this.scrollHeight) + 'px';
        });

        // Initialize theme
        updateThemeIcon();
