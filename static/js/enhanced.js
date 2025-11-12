// Enhanced JavaScript for Portfolio Website
// Includes: Contact form validation, Toast notifications, Lightbox, Search, Analytics, etc.

// =========================================
// Toast Notification System
// =========================================
class Toast {
  static show(message, type = 'success', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.innerHTML = `
      <span class="toast__message">${message}</span>
      <button class="toast__close" aria-label="Close notification">×</button>
    `;
    
    document.body.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => toast.classList.add('toast--show'), 10);
    
    // Auto remove
    const autoRemove = setTimeout(() => {
      Toast.remove(toast);
    }, duration);
    
    // Manual close
    toast.querySelector('.toast__close').addEventListener('click', () => {
      clearTimeout(autoRemove);
      Toast.remove(toast);
    });
  }
  
  static remove(toast) {
    toast.classList.remove('toast--show');
    setTimeout(() => toast.remove(), 300);
  }
}

// =========================================
// Enhanced Contact Form
// =========================================
(function() {
  const contactForm = document.getElementById('contact-form');
  if (!contactForm) return;
  
  contactForm.addEventListener('submit', async function(e) {
    e.preventDefault(); // prevent default to use AJAX; server also supports non-AJAX fallback
    
    const submitBtn = contactForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';
    
    const formData = {
      name: document.getElementById('name').value.trim(),
      email: document.getElementById('email').value.trim(),
      subject: document.getElementById('subject').value.trim(),
      message: document.getElementById('message').value.trim()
    };
    
    // Client-side validation
    if (!formData.name || !formData.email || !formData.message) {
      Toast.show('Please fill in all required fields.', 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
      return;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      Toast.show('Please enter a valid email address.', 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
      return;
    }
    
    try {
      const response = await fetch('/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });
      
      let data = {};
      try { data = await response.json(); } catch (err) { data = { success: response.ok }; }
      
      if (data.success) {
        Toast.show(data.message || 'Thank you! Your message has been sent.', 'success');
        contactForm.reset();
      } else {
        Toast.show(data.message || 'Something went wrong. Please try again.', 'error');
      }
    } catch (error) {
      Toast.show('Network error. Please check your connection and try again.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
})();

// =========================================
// Newsletter Subscription
// =========================================
(function() {
  const newsletterForm = document.getElementById('newsletter-form');
  if (!newsletterForm) return;
  
  newsletterForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const emailInput = newsletterForm.querySelector('input[type="email"]');
    const email = emailInput.value.trim();
    const submitBtn = newsletterForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Toast.show('Please enter a valid email address.', 'error');
      return;
    }
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Subscribing...';
    
    try {
      const response = await fetch('/newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      });
      
      const data = await response.json();
      
      if (data.success) {
        Toast.show(data.message || 'Thank you for subscribing!', 'success');
        emailInput.value = '';
      } else {
        Toast.show(data.message || 'Subscription failed. Please try again.', 'error');
      }
    } catch (error) {
      Toast.show('Network error. Please try again later.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
})();

// =========================================
// Lightbox for Hobbies Gallery
// =========================================
(function() {
  const hobbyImages = document.querySelectorAll('.masonry__item img');
  if (hobbyImages.length === 0) return;
  
  // Create lightbox
  const lightbox = document.createElement('div');
  lightbox.className = 'lightbox';
  lightbox.setAttribute('role', 'dialog');
  lightbox.setAttribute('aria-label', 'Image lightbox');
  lightbox.innerHTML = `
    <button class="lightbox__close" aria-label="Close lightbox">×</button>
    <button class="lightbox__prev" aria-label="Previous image">‹</button>
    <button class="lightbox__next" aria-label="Next image">›</button>
    <div class="lightbox__content">
      <img class="lightbox__image" src="" alt="" />
      <div class="lightbox__caption"></div>
    </div>
  `;
  document.body.appendChild(lightbox);
  
  let currentIndex = 0;
  const images = Array.from(hobbyImages);
  
  function openLightbox(index) {
    currentIndex = index;
    const img = images[index];
    lightbox.querySelector('.lightbox__image').src = img.src;
    lightbox.querySelector('.lightbox__image').alt = img.alt || '';
    lightbox.querySelector('.lightbox__caption').textContent = img.alt || '';
    lightbox.classList.add('lightbox--active');
    document.body.style.overflow = 'hidden';
    
    // Focus management
    lightbox.querySelector('.lightbox__close').focus();
  }
  
  function closeLightbox() {
    lightbox.classList.remove('lightbox--active');
    document.body.style.overflow = '';
  }
  
  function showNext() {
    currentIndex = (currentIndex + 1) % images.length;
    openLightbox(currentIndex);
  }
  
  function showPrev() {
    currentIndex = (currentIndex - 1 + images.length) % images.length;
    openLightbox(currentIndex);
  }
  
  // Event listeners
  hobbyImages.forEach((img, index) => {
    img.style.cursor = 'pointer';
    img.addEventListener('click', () => openLightbox(index));
  });
  
  lightbox.querySelector('.lightbox__close').addEventListener('click', closeLightbox);
  lightbox.querySelector('.lightbox__prev').addEventListener('click', showPrev);
  lightbox.querySelector('.lightbox__next').addEventListener('click', showNext);
  
  lightbox.addEventListener('click', function(e) {
    if (e.target === lightbox) closeLightbox();
  });
  
  // Keyboard navigation
  document.addEventListener('keydown', function(e) {
    if (!lightbox.classList.contains('lightbox--active')) return;
    
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') showPrev();
    if (e.key === 'ArrowRight') {
      const nextBtn = lightbox.querySelector('.lightbox__next');
      if (nextBtn) showNext();
    }
  });
})();

// =========================================
// Search Functionality with Suggestions
// =========================================
(function() {
  const searchInput = document.getElementById('search-input');
  const searchDropdown = document.getElementById('search-dropdown');
  const searchResultsList = document.getElementById('search-results');
  
  if (!searchInput || !searchDropdown || !searchResultsList) return;
  
  const searchIndex = [
    {
      title: 'About Me',
      description: 'Professional summary, principles, background',
      url: '#about',
      tags: ['about', 'profile', 'summary']
    },
    {
      title: 'Hobbies Gallery',
      description: 'Photography, lifestyle, creative hobbies',
      url: '#hobbies',
      tags: ['hobbies', 'gallery', 'photos']
    },
    {
      title: 'Technical Skills',
      description: 'Frontend, backend, DevOps, content creation tools',
      url: '#skills',
      tags: ['skills', 'tech', 'stack', 'tools']
    },
    {
      title: 'Portfolio Work',
      description: 'Featured projects and case studies',
      url: '#work',
      tags: ['projects', 'portfolio', 'case study']
    },
    {
      title: 'Blog Articles',
      description: 'Latest research, AI insights, content strategy',
      url: '#blog',
      tags: ['blog', 'articles', 'research', 'ai']
    },
    {
      title: 'Testimonials',
      description: 'What clients and collaborators say',
      url: '#testimonials',
      tags: ['testimonials', 'reviews', 'feedback']
    },
    {
      title: 'Timeline',
      description: 'Career milestones and journey',
      url: '#timeline',
      tags: ['timeline', 'journey', 'career']
    },
    {
      title: 'Certifications',
      description: 'Professional achievements and recognitions',
      url: '#certifications',
      tags: ['certifications', 'achievements', 'awards']
    },
    {
      title: 'Newsletter',
      description: 'Subscribe for updates and insights',
      url: '#newsletter',
      tags: ['newsletter', 'subscribe', 'updates']
    },
    {
      title: 'Contact Form',
      description: 'Reach out to discuss your project',
      url: '#contact',
      tags: ['contact', 'email', 'form']
    },
    {
      title: 'HE Coffee — Cafe Management App',
      description: 'Internal cafe management system',
      url: '#work',
      tags: ['he coffee', 'cafe', 'management']
    },
    {
      title: 'LearnLangs — Language Learning App',
      description: 'AI-powered language learning platform',
      url: '#work',
      tags: ['learnlangs', 'language', 'learning', 'ai']
    },
    {
      title: 'typingtest — Typing Practice App',
      description: 'Minimalist typing trainer inspired by Monkeytype',
      url: '#work',
      tags: ['typingtest', 'typing', 'practice']
    }
  ];
  
  function filterResults(query) {
    const lowerQuery = query.toLowerCase();
    return searchIndex.filter(item => {
      return (
        item.title.toLowerCase().includes(lowerQuery) ||
        item.description.toLowerCase().includes(lowerQuery) ||
        item.tags.some(tag => tag.includes(lowerQuery))
      );
    });
  }
  
  function renderResults(results, query) {
    searchResultsList.innerHTML = '';
    
    if (!query || query.length < 2) {
      searchDropdown.classList.remove('active');
      return;
    }
    
    if (results.length === 0) {
      const li = document.createElement('li');
      li.className = 'search__result';
      li.innerHTML = `
        <span class="search__result-title">No matches found</span>
        <span class="search__result-description">Try searching for: skills, projects, blog, contact</span>
      `;
      searchResultsList.appendChild(li);
      searchDropdown.classList.add('active');
      return;
    }
    
    results.slice(0, 6).forEach(item => {
      const li = document.createElement('li');
      li.className = 'search__result';
      li.tabIndex = 0;
      li.innerHTML = `
        <span class="search__result-title">${item.title}</span>
        <span class="search__result-description">${item.description}</span>
        <span class="search__result-tag">#${item.tags[0]}</span>
      `;
      li.addEventListener('click', () => {
        window.location.hash = item.url;
        searchDropdown.classList.remove('active');
      });
      li.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          window.location.hash = item.url;
          searchDropdown.classList.remove('active');
        }
      });
      searchResultsList.appendChild(li);
    });
    
    searchDropdown.classList.add('active');
  }
  
  function performSearch(query) {
    const trimmed = query.trim();
    if (!trimmed) {
      searchDropdown.classList.remove('active');
      return;
    }
    
    const results = filterResults(trimmed);
    
    if (results.length > 0) {
      window.location.hash = results[0].url;
      searchDropdown.classList.remove('active');
    } else {
      window.location.href = `/search?q=${encodeURIComponent(trimmed)}`;
    }
  }
  
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value;
    const results = filterResults(query);
    renderResults(results, query);
  });
  
  searchInput.addEventListener('focus', () => {
    const query = searchInput.value;
    if (query.length >= 2) {
      renderResults(filterResults(query), query);
    }
  });
  
  searchInput.addEventListener('keydown', (e) => {
    const focusableResults = Array.from(searchResultsList.querySelectorAll('.search__result'));
    const activeElement = document.activeElement;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (focusableResults.length > 0) {
        focusableResults[0].focus();
      }
    } else if (e.key === 'Enter' && activeElement === searchInput) {
      e.preventDefault();
      performSearch(searchInput.value);
    } else if (e.key === 'Escape') {
      searchDropdown.classList.remove('active');
    }
  });
  
  searchResultsList.addEventListener('keydown', (e) => {
    const items = Array.from(searchResultsList.querySelectorAll('.search__result'));
    const currentIndex = items.indexOf(document.activeElement);
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = (currentIndex + 1) % items.length;
      items[nextIndex].focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (currentIndex === 0) {
        searchInput.focus();
      } else {
        items[currentIndex - 1].focus();
      }
    } else if (e.key === 'Escape') {
      searchDropdown.classList.remove('active');
      searchInput.focus();
    }
  });
  
  searchInput.addEventListener('blur', () => {
    setTimeout(() => {
      searchDropdown.classList.remove('active');
    }, 150);
  });
  
  document.addEventListener('click', (e) => {
    if (!document.getElementById('global-search')?.contains(e.target)) {
      searchDropdown.classList.remove('active');
    }
  });
})();

// =========================================
// Animated Counters
// =========================================
function animateCounter(element, target, duration = 2000) {
  const start = 0;
  const increment = target / (duration / 16);
  let current = start;
  
  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      element.textContent = target;
      clearInterval(timer);
    } else {
      element.textContent = Math.floor(current);
    }
  }, 16);
}

// Observe stats for animation
const statsObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const statNum = entry.target.querySelector('.stat__num');
      if (statNum && !statNum.dataset.animated) {
        const text = statNum.textContent;
        const number = parseInt(text.replace(/\D/g, ''));
        if (number) {
          statNum.dataset.animated = 'true';
          statNum.textContent = '0';
          animateCounter(statNum, number);
        }
      }
      statsObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('.stat').forEach(stat => {
  statsObserver.observe(stat);
});

// =========================================
// Share Buttons
// =========================================
function shareContent(url, title, text) {
  if (navigator.share) {
    navigator.share({
      title: title,
      text: text,
      url: url
    }).catch(err => console.log('Error sharing', err));
  } else {
    // Fallback: copy to clipboard
    navigator.clipboard.writeText(url).then(() => {
      Toast.show('Link copied to clipboard!', 'success');
    });
  }
}

// Add share buttons to blog posts
document.querySelectorAll('[data-share]').forEach(btn => {
  btn.addEventListener('click', function() {
    const url = this.dataset.shareUrl || window.location.href;
    const title = this.dataset.shareTitle || document.title;
    const text = this.dataset.shareText || '';
    shareContent(url, title, text);
  });
});

// =========================================
// Testimonials Carousel
// =========================================
(function() {
  const testimonialsContainer = document.querySelector('.testimonials__carousel');
  if (!testimonialsContainer) return;
  
  let currentIndex = 0;
  const testimonials = testimonialsContainer.querySelectorAll('.testimonial');
  const total = testimonials.length;
  
  if (total <= 1) return;
  
  function showTestimonial(index) {
    testimonials.forEach((testimonial, i) => {
      testimonial.classList.toggle('testimonial--active', i === index);
    });
  }
  
  function nextTestimonial() {
    currentIndex = (currentIndex + 1) % total;
    showTestimonial(currentIndex);
  }
  
  function prevTestimonial() {
    currentIndex = (currentIndex - 1 + total) % total;
    showTestimonial(currentIndex);
  }
  
  // Auto-rotate
  setInterval(nextTestimonial, 5000);
  
  // Manual controls
  const prevBtn = document.querySelector('.testimonials__prev');
  const nextBtn = document.querySelector('.testimonials__next');
  
  if (prevBtn) prevBtn.addEventListener('click', prevTestimonial);
  if (nextBtn) nextBtn.addEventListener('click', nextTestimonial);
  
  showTestimonial(0);
})();

// =========================================
// Load Testimonials from API
// =========================================
(async function() {
  const testimonialsSection = document.getElementById('testimonials');
  if (!testimonialsSection) return;
  
  try {
    const response = await fetch('/api/testimonials');
    const testimonials = await response.json();
    
    if (testimonials.length > 0) {
      const container = testimonialsSection.querySelector('.testimonials__carousel');
      if (container) {
        container.innerHTML = testimonials.map(t => `
          <article class="testimonial card">
            <div class="testimonial__content">
              <p class="testimonial__text">"${t.content}"</p>
              <div class="testimonial__author">
                <div class="testimonial__info">
                  <h4 class="testimonial__name">${t.name}</h4>
                  <p class="testimonial__role">${t.role}${t.company ? ` at ${t.company}` : ''}</p>
                </div>
                <div class="testimonial__rating">
                  ${'★'.repeat(t.rating)}${'☆'.repeat(5 - t.rating)}
                </div>
              </div>
            </div>
          </article>
        `).join('');
      }
    }
  } catch (error) {
    console.log('Could not load testimonials:', error);
  }
})();

// =========================================
// Progress Bars Animation
// =========================================
const progressObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const progressBar = entry.target;
      const value = progressBar.dataset.value;
      if (value && !progressBar.dataset.animated) {
        progressBar.dataset.animated = 'true';
        progressBar.style.width = '0%';
        setTimeout(() => {
          progressBar.style.width = value + '%';
        }, 100);
      }
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('.progress__bar').forEach(bar => {
  progressObserver.observe(bar);
});

// =========================================
// Google Analytics (if configured)
// =========================================
if (typeof gtag !== 'undefined') {
  // Track page views
  gtag('config', 'GA_MEASUREMENT_ID');
  
  // Track contact form submissions
  document.getElementById('contact-form')?.addEventListener('submit', function() {
    gtag('event', 'contact_form_submit', {
      'event_category': 'engagement',
      'event_label': 'Contact Form'
    });
  });
  
  // Track newsletter subscriptions
  document.getElementById('newsletter-form')?.addEventListener('submit', function() {
    gtag('event', 'newsletter_subscribe', {
      'event_category': 'engagement',
      'event_label': 'Newsletter'
    });
  });
}

// =========================================
// Service Worker Registration (PWA)
// =========================================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('Service Worker registered:', registration);
      })
      .catch(error => {
        console.log('Service Worker registration failed:', error);
      });
  });
}

// =========================================
// Lazy Loading Images
// =========================================
if ('IntersectionObserver' in window) {
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          img.classList.add('loaded');
        }
        observer.unobserve(img);
      }
    });
  });
  
  document.querySelectorAll('img[data-src]').forEach(img => {
    imageObserver.observe(img);
  });
}

// =========================================
// Enhanced Accessibility
// =========================================
// Skip to main content on keyboard navigation
document.addEventListener('keydown', function(e) {
  if (e.key === 'Tab' && !e.shiftKey && document.activeElement === document.body) {
    const skipLink = document.querySelector('.skip');
    if (skipLink) skipLink.focus();
  }
});

// Focus trap for modals
function trapFocus(container) {
  const focusableElements = container.querySelectorAll(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  
  container.addEventListener('keydown', function(e) {
    if (e.key !== 'Tab') return;
    
    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        lastElement.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastElement) {
        firstElement.focus();
        e.preventDefault();
      }
    }
  });
}

// Apply focus trap to all modals
document.querySelectorAll('.blog-modal, .lightbox').forEach(modal => {
  trapFocus(modal);
});

// =========================================
// Blog horizontal slider controls
// =========================================
(function () {
  const slider = document.querySelector('.blog__slider');
  if (!slider) return;
  const track = slider.querySelector('.blog__track');
  const prev = slider.querySelector('.blog__nav--prev');
  const next = slider.querySelector('.blog__nav--next');
  const dotsContainer = slider.querySelector('.blog__dots');
  if (!track || !prev || !next || !dotsContainer) return;

  const slides = Array.from(track.children);
  let slideWidth = () => track.clientWidth;

  // Build dots
  dotsContainer.innerHTML = slides.map((_, i) => `<button class="blog__dot${i===0?' blog__dot--active':''}" aria-label="Go to slide ${i+1}" aria-controls="blog-slide-${i+1}"></button>`).join('');
  const dots = Array.from(dotsContainer.querySelectorAll('.blog__dot'));

  function goToSlide(index) {
    const maxIndex = slides.length - 1;
    const clamped = Math.max(0, Math.min(index, maxIndex));
    track.scrollTo({ left: clamped * slideWidth(), behavior: 'smooth' });
  }

  function updateActiveDot() {
    const index = Math.round(track.scrollLeft / slideWidth());
    dots.forEach((d, i) => d.classList.toggle('blog__dot--active', i === index));
  }

  prev.addEventListener('click', () => goToSlide(Math.round(track.scrollLeft / slideWidth()) - 1));
  next.addEventListener('click', () => goToSlide(Math.round(track.scrollLeft / slideWidth()) + 1));
  dots.forEach((dot, i) => dot.addEventListener('click', () => goToSlide(i)));

  track.addEventListener('scroll', () => {
    // Throttle with rAF
    if (track._ticking) return;
    track._ticking = true;
    requestAnimationFrame(() => {
      updateActiveDot();
      track._ticking = false;
    });
  });

  window.addEventListener('resize', () => {
    // Keep slide centered on resize
    setTimeout(() => goToSlide(Math.round(track.scrollLeft / slideWidth())), 100);
  });
})();

