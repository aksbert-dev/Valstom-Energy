// js/email-handler.js
// EmailJS Handler for Valstom Energy Contact Form

class ValstomEmailHandler {
    constructor() {
        // EmailJS Configuration - REPLACE THESE WITH YOUR ACTUAL VALUES
        this.config = {
            serviceId: '',     
            templateId: '',  
            toEmail: '',  
            fromName: 'Valstom Energy Website',
            publicKey: ''     
        };
        
        this.isInitialized = false;
        this.init();
    }
    
    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }
    
    setup() {
        try {
            // Check if EmailJS is loaded
            if (typeof emailjs === 'undefined') {
                console.error('EmailJS not loaded. Make sure the EmailJS script is included.');
                this.showMessage('Email service not available. Please try again later.', 'error');
                return;
            }
            
            // Initialize EmailJS
            this.initializeEmailJS();
            
            // Bind form events
            this.bindFormEvents();
            
            this.isInitialized = true;
            console.log('Valstom Email Handler initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize email handler:', error);
            this.showMessage('Unable to initialize contact form. Please refresh the page.', 'error');
        }
    }
    
    initializeEmailJS() {
        try {
            // Initialize with public key
            emailjs.init(this.config.publicKey);
            console.log('EmailJS initialized with public key');
        } catch (error) {
            console.error('EmailJS initialization failed:', error);
            throw error;
        }
    }
    
    bindFormEvents() {
        const form = document.getElementById('valContactForm');
        if (!form) {
            console.error('Contact form not found with ID "valContactForm"');
            return;
        }
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmit(e);
        });
        
        // Add input validation
        this.addInputValidation(form);
    }
    
    addInputValidation(form) {
        const inputs = form.querySelectorAll('input, textarea');
        
        inputs.forEach(input => {
            // Add validation on blur
            input.addEventListener('blur', () => {
                this.validateInput(input);
            });
            
            // Remove error state on input
            input.addEventListener('input', () => {
                this.clearInputError(input);
            });
        });
    }
    
    validateInput(input) {
        if (!input.checkValidity()) {
            this.showInputError(input, this.getValidationMessage(input));
            return false;
        }
        
        // Custom validation for email
        if (input.type === 'email' && input.value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(input.value)) {
                this.showInputError(input, 'Please enter a valid email address');
                return false;
            }
        }
        
        this.clearInputError(input);
        return true;
    }
    
    getValidationMessage(input) {
        if (input.validity.valueMissing) {
            return 'This field is required';
        }
        if (input.validity.typeMismatch) {
            if (input.type === 'email') return 'Please enter a valid email';
        }
        return 'Please check this field';
    }
    
    showInputError(input, message) {
        this.clearInputError(input);
        
        input.classList.add('val-input-error');
        
        // Create error message element
        const errorEl = document.createElement('div');
        errorEl.className = 'val-input-error-message';
        errorEl.textContent = message;
        errorEl.style.cssText = `
            color: #dc3545;
            font-size: 12px;
            margin-top: 5px;
        `;
        
        input.parentNode.appendChild(errorEl);
    }
    
    clearInputError(input) {
        input.classList.remove('val-input-error');
        
        const errorEl = input.parentNode.querySelector('.val-input-error-message');
        if (errorEl) {
            errorEl.remove();
        }
    }
    
    async handleFormSubmit(event) {
        const form = event.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;
        
        try {
            // Show loading state
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            submitBtn.disabled = true;
            
            // Validate all inputs
            const isValid = this.validateForm(form);
            if (!isValid) {
                throw new Error('Please fill all required fields correctly.');
            }
            
            // Collect form data
            const formData = this.collectFormData(form);
            
            // Send email
            const result = await this.sendEmail(formData);
            
            // Show success message
            this.showMessage(
                'Thank you! Your message has been sent successfully. We\'ll get back to you soon.',
                'success'
            );
            
            // Reset form
            form.reset();
            
            // Log success
            console.log('Email sent successfully:', result);
            
            // Scroll to form
            form.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
        } catch (error) {
            console.error('Email sending failed:', error);
            
            // Show appropriate error message
            const userMessage = error.message.includes('Network')
                ? 'Network error. Please check your connection and try again.'
                : error.message || 'Failed to send message. Please try again.';
            
            this.showMessage(userMessage, 'error');
            
        } finally {
            // Restore button state
            submitBtn.innerHTML = originalBtnText;
            submitBtn.disabled = false;
        }
    }
    
    validateForm(form) {
        let isValid = true;
        const requiredInputs = form.querySelectorAll('[required]');
        
        requiredInputs.forEach(input => {
            if (!this.validateInput(input)) {
                isValid = false;
            }
        });
        
        return isValid;
    }
    
    collectFormData(form) {
        const formData = new FormData(form);
        
        return {
            name: formData.get('name') || '',
            company: formData.get('company') || '',
            email: formData.get('email') || '',
            phone: formData.get('phone') || '',
            message: formData.get('message') || '',
            pageUrl: window.location.href,
            timestamp: new Date().toLocaleString('en-US', { 
                timeZone: 'Asia/Dubai',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }),
            userAgent: navigator.userAgent,
            referrer: document.referrer || 'Direct visit'
        };
    }
    
    async sendEmail(formData) {
        // Prepare template parameters
        const templateParams = {
            to_email: this.config.toEmail,
            from_name: formData.name,
            from_company: formData.company,
            from_email: formData.email,
            from_phone: formData.phone || 'Not provided',
            message: formData.message,
            timestamp: formData.timestamp,
            page_url: formData.pageUrl,
            user_agent: formData.userAgent,
            referrer: formData.referrer,
            subject: `New Contact Form Submission - ${formData.company}`
        };
        
        console.log('Sending email with params:', templateParams);
        
        try {
            // Send email using EmailJS
            const response = await emailjs.send(
                this.config.serviceId,
                this.config.templateId,
                templateParams
            );
            
            console.log('EmailJS response:', response);
            return response;
            
        } catch (error) {
            console.error('EmailJS send error:', error);
            
            // Provide more detailed error information
            const errorMessage = error.text || error.message || 'Unknown error';
            throw new Error(`Email service error: ${errorMessage}`);
        }
    }
    
    showMessage(text, type = 'info') {
        // Remove existing messages
        this.removeExistingMessages();
        
        // Create message element
        const messageEl = this.createMessageElement(text, type);
        
        // Insert message before the form
        const form = document.getElementById('valContactForm');
        if (form) {
            form.parentNode.insertBefore(messageEl, form);
            
            // Scroll to message
            messageEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Auto-remove after timeout
            if (type === 'success') {
                setTimeout(() => {
                    if (messageEl.parentNode) {
                        this.animateMessageOut(messageEl);
                    }
                }, 8000);
            }
        }
    }
    
    removeExistingMessages() {
        const existingMessages = document.querySelectorAll('.val-email-message');
        existingMessages.forEach(msg => msg.remove());
    }
    
    createMessageElement(text, type) {
        const messageEl = document.createElement('div');
        messageEl.className = `val-email-message val-email-message-${type}`;
        
        const icon = type === 'success' ? 'fa-check-circle' : 
                    type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle';
        
        messageEl.innerHTML = `
            <div class="val-message-content">
                <i class="fas ${icon}"></i>
                <span>${text}</span>
            </div>
            <button class="val-message-close" aria-label="Close message">&times;</button>
        `;
        
        // Add close button functionality
        const closeBtn = messageEl.querySelector('.val-message-close');
        closeBtn.addEventListener('click', () => this.animateMessageOut(messageEl));
        
        return messageEl;
    }
    
    animateMessageOut(messageEl) {
        messageEl.style.opacity = '0';
        messageEl.style.transform = 'translateY(-20px)';
        
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.remove();
            }
        }, 300);
    }
    
    // Utility method to test email sending
    testEmailSending() {
        const testData = {
            name: 'Test User',
            company: 'Test Company LLC',
            email: 'test@example.com',
            phone: '+971 55 123 4567',
            message: 'This is a test message sent from the Valstom Energy website contact form for testing purposes.'
        };
        
        console.log('Testing email sending with data:', testData);
        
        this.sendEmail(testData)
            .then(response => {
                console.log('Test email sent successfully:', response);
                alert('Test email sent successfully! Check your inbox.');
            })
            .catch(error => {
                console.error('Test email failed:', error);
                alert('Test failed: ' + error.message);
            });
    }
}

// Initialize the email handler when page loads
let valstomEmailHandler;

// document.addEventListener('DOMContentLoaded', () => {
//     valstomEmailHandler = new ValstomEmailHandler();
    
//     // Expose to window for testing (remove in production)
//     window.valstomEmailHandler = valstomEmailHandler;
    
//     // Optional: Add test button for development (remove in production)
//     if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
//         const testBtn = document.createElement('button');
//         testBtn.textContent = 'Test Email';
//         testBtn.style.cssText = `
//             position: fixed;
//             bottom: 20px;
//             right: 20px;
//             z-index: 9999;
//             background: #004080;
//             color: white;
//             border: none;
//             padding: 10px 15px;
//             border-radius: 5px;
//             cursor: pointer;
//             font-size: 12px;
//         `;
//         testBtn.onclick = () => valstomEmailHandler.testEmailSending();
//         document.body.appendChild(testBtn);
//     }
// });