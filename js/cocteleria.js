/* ============================================================
   VÉRTICE GIN — Coctelería (Recipes filters & detail toggle)
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  const filters = document.querySelectorAll('.recipe-filter');
  const cards = document.querySelectorAll('.recipe-card');
  const recipeContainer = document.querySelector('.recipes-grid');

  if (!filters.length || !cards.length) return;

  // Filter by category
  filters.forEach(btn => {
    btn.addEventListener('click', () => {
      // Update active filter
      filters.forEach(f => f.classList.remove('recipe-filter--active'));
      btn.classList.add('recipe-filter--active');

      const category = btn.dataset.filter;
      cards.forEach(card => {
        if (category === 'all' || card.dataset.category === category) {
          card.style.display = '';
          card.style.animation = 'none';
          requestAnimationFrame(() => {
            card.style.animation = 'fadeInUp 0.4s ease both';
          });
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  // Toggle ingredients list
  cards.forEach(card => {
    const toggleBtn = card.querySelector('.toggle-ingredients');
    const ingredients = card.querySelector('.recipe-card__ingredients');
    if (toggleBtn && ingredients) {
      ingredients.style.display = 'none';
      toggleBtn.addEventListener('click', () => {
        const isVisible = ingredients.style.display !== 'none';
        ingredients.style.display = isVisible ? 'none' : 'block';
        toggleBtn.textContent = isVisible ? 'Ver ingredientes' : 'Ocultar ingredientes';
      });
    }
  });
});