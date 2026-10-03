const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); } });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach((element, index) => { element.style.transitionDelay = `${Math.min(index % 4, 2) * 90}ms`; observer.observe(element); });

const photo = document.querySelector('.parallax-photo img');
const impactMetrics = document.querySelectorAll('.metric');

function animateOnScroll() {
  if (photo) {
    const bounds = photo.getBoundingClientRect();
    const progress = (window.innerHeight - bounds.top) / (window.innerHeight + bounds.height);
    photo.style.transform = `scale(1.08) translateY(${Math.max(-12, Math.min(12, (progress - .5) * 28))}px)`;
  }
  impactMetrics.forEach((metric, index) => {
    const bounds = metric.getBoundingClientRect();
    const progress = Math.max(0, Math.min(1, (window.innerHeight - bounds.top) / window.innerHeight));
    metric.style.transform = `translateY(${(1 - progress) * (18 + index * 5)}px)`;
    metric.style.opacity = .35 + progress * .65;
  });
}

window.addEventListener('scroll', animateOnScroll, { passive: true });
animateOnScroll();
