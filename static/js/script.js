// Dark mode toggle with localStorage
const root = document.documentElement;
const saved = localStorage.getItem('theme') || 'dark';
if(saved === 'light'){ root.classList.add('light'); }

const btn = document.getElementById('themeToggle');
if(btn){
  btn.addEventListener('click', () => {
    root.classList.toggle('light');
    localStorage.setItem('theme', root.classList.contains('light') ? 'light' : 'dark');
  });
}

// Mobile nav toggle
const toggle = document.querySelector('.nav-toggle');
const navList = document.getElementById('nav-list');
if(toggle){
  toggle.addEventListener('click', () => {
    const open = navList.style.display === 'block';
    navList.style.display = open ? 'none' : 'block';
    toggle.setAttribute('aria-expanded', String(!open));
  });
}

// Year in footer
document.getElementById('year').textContent = new Date().getFullYear();

// Contact form (optional enhancement): basic confirmation
const form = document.getElementById('contactForm');
if(form){
  form.addEventListener('submit', () => {
    // let the service handle it — we can show a quick toast or alert
    setTimeout(() => {
      alert('Thanks! Your message was sent.');
    }, 200);
  });
}