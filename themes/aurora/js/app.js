// Aurora Theme JavaScript
// Author: animesao

import './bootstrap';

// Initialize animations
document.addEventListener('DOMContentLoaded', function() {
    // Add staggered fade-in animation to cards
    const cards = document.querySelectorAll('.card, .stats-card');
    cards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.15}s`;
        card.classList.add('animate-fade-in');
    });

    // Add floating animation to icons
    const icons = document.querySelectorAll('.stats-icon, .brand-image');
    icons.forEach(icon => {
        icon.classList.add('animate-float');
    });

    // Add hover effects to sidebar links with slide animation
    const sidebarLinks = document.querySelectorAll('.nav-sidebar .nav-link');
    sidebarLinks.forEach(link => {
        link.addEventListener('mouseenter', function() {
            this.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        });
    });

    // Smooth scroll for internal links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Add loading state to forms with gradient animation
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            const submitButton = form.querySelector('button[type="submit"]');
            if (submitButton) {
                submitButton.disabled = true;
                const originalText = submitButton.innerHTML;
                submitButton.innerHTML = '<span class="spinner spinner-sm"></span> <span class="animate-shimmer">Processing...</span>';

                // Restore after 3 seconds as fallback
                setTimeout(() => {
                    submitButton.disabled = false;
                    submitButton.innerHTML = originalText;
                }, 3000);
            }
        });
    });

    // Auto-hide alerts with animation
    const alerts = document.querySelectorAll('.alert:not(.alert-permanent)');
    alerts.forEach(alert => {
        setTimeout(() => {
            alert.style.transition = 'all 0.5s ease';
            alert.style.opacity = '0';
            alert.style.transform = 'translateY(-20px)';
            setTimeout(() => {
                alert.remove();
            }, 500);
        }, 5000);
    });

    // Add wave effect to buttons on click
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            const wave = document.createElement('span');
            wave.classList.add('wave-effect');
            wave.style.cssText = `
                position: absolute;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.4);
                transform: scale(0);
                animation: wave 0.6s linear;
                pointer-events: none;
            `;
            this.appendChild(wave);

            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;

            wave.style.width = wave.style.height = size + 'px';
            wave.style.left = x + 'px';
            wave.style.top = y + 'px';

            setTimeout(() => wave.remove(), 600);
        });
    });

    // Add progress bar animation
    const progressBars = document.querySelectorAll('.progress-bar');
    progressBars.forEach(bar => {
        const width = bar.style.width;
        bar.style.width = '0%';
        setTimeout(() => {
            bar.style.transition = 'width 1s ease';
            bar.style.width = width;
        }, 100);
    });

    // Add number counter animation for stats
    const statValues = document.querySelectorAll('.stats-value');
    statValues.forEach(stat => {
        const finalValue = parseFloat(stat.textContent);
        if (!isNaN(finalValue)) {
            stat.textContent = '0';
            let currentValue = 0;
            const increment = finalValue / 50;
            const timer = setInterval(() => {
                currentValue += increment;
                if (currentValue >= finalValue) {
                    stat.textContent = finalValue.toLocaleString();
                    clearInterval(timer);
                } else {
                    stat.textContent = Math.floor(currentValue).toLocaleString();
                }
            }, 30);
        }
    });
});

// Add wave animation keyframes
const style = document.createElement('style');
style.textContent = `
    @keyframes wave {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Export for use in other modules
export default {
    init: function() {
        console.log('Aurora theme initialized');
    }
};
