const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); } });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach((element, index) => { element.style.transitionDelay = `${Math.min(index % 4, 2) * 90}ms`; observer.observe(element); });
