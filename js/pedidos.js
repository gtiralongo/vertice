/* ============================================================
   VÉRTICE GIN — Sistema de Pedidos
   ============================================================ */

const PRODUCTS = [
  {
    id: 'vertice-clasico',
    name: 'Vértice Gin Clásico',
    subtitle: 'Botella 750 ml · 42% ABV',
    price: 0, // Precio a definir por la marca
    priceLabel: 'Consultar precio',
    image: '🍸',
    description: 'Nuestro gin insignia. Destilado en alambre de cobre con botánicos de la plaza de Pasteur.',
    maxQty: 12,
  },
  {
    id: 'vertice-pack',
    name: 'Pack Vértice x2',
    subtitle: '2 botellas 750 ml',
    price: 0,
    priceLabel: 'Consultar precio',
    image: '🎁',
    description: 'Llevá dos botellas y ahorrá en el envío. Ideal para compartir o regalar.',
    maxQty: 6,
  },
  {
    id: 'vertice-experiencia',
    name: 'Experiencia Vértice',
    subtitle: 'Botella + Recetario + Copa',
    price: 0,
    priceLabel: 'Consultar precio',
    image: '✨',
    description: 'La experiencia completa: gin + recetario exclusivo + copa de cata serigrafiada.',
    maxQty: 3,
  },
];

const SHIPPING_OPTIONS = [
  { id: 'pickup', label: 'Retiro en Pasteur', price: 0, eta: 'Coordinamos horario' },
  { id: 'local', label: 'Envío zona Lincoln/Junín/Salto', price: 0, eta: '2-3 días hábiles' },
  { id: 'provincia', label: 'Envío Pcia. Buenos Aires', price: 0, eta: '3-7 días hábiles' },
  { id: 'nacional', label: 'Envío resto del país', price: 0, eta: '5-12 días hábiles' },
];

const SHIPPING_CITIES = {
  pasteur: { label: 'Pasteur', optionId: 'pickup' },
  lincoln: { label: 'Lincoln', optionId: 'local' },
  junin: { label: 'Junín', optionId: 'local' },
  salto: { label: 'Salto', optionId: 'local' },
};

let cart = [];
let step = 1;

function initStore() {
  loadCart();
  renderProducts();
  renderCartSummary();
  renderShippingOptions();
  bindFormSteps();
  updateCartBadge();
}

function loadCart() {
  try {
    const saved = localStorage.getItem('vertice-cart');
    cart = saved ? JSON.parse(saved) : [];
  } catch (e) {
    cart = [];
  }
}

function saveCart() {
  localStorage.setItem('vertice-cart', JSON.stringify(cart));
  updateCartBadge();
}

function updateCartBadge() {
  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  document.querySelectorAll('.cart-badge').forEach(el => {
    el.textContent = count;
    el.style.display = count > 0 ? 'flex' : 'none';
  });
}

function renderProducts() {
  const container = document.getElementById('products-list');
  if (!container) return;
  container.innerHTML = PRODUCTS.map(p => `
    <div class="store-card store-card--product" data-id="${p.id}">
      <div class="store-card__icon" style="font-size:2.2rem;">${p.image}</div>
      <div class="store-card__info" style="flex:1;">
        <h4>${p.name}</h4>
        <p style="margin:0.15rem 0 0.25rem;font-size:0.8rem;color:var(--cobre);font-weight:500;">${p.subtitle}</p>
        <p style="font-size:0.85rem;">${p.description}</p>
        <div class="product-qty" style="display:flex;align-items:center;gap:0.75rem;margin-top:0.75rem;">
          <button class="qty-btn qty-minus" data-id="${p.id}" style="width:32px;height:32px;border-radius:50%;border:1px solid var(--cobre);background:transparent;color:var(--cobre);font-size:1.1rem;cursor:pointer;display:flex;align-items:center;justify-content:center;">−</button>
          <span class="qty-value" data-id="${p.id}" style="font-weight:600;min-width:24px;text-align:center;">${getCartQty(p.id)}</span>
          <button class="qty-btn qty-plus" data-id="${p.id}" style="width:32px;height:32px;border-radius:50%;border:1px solid var(--cobre);background:var(--cobre);color:var(--crema);font-size:1.1rem;cursor:pointer;display:flex;align-items:center;justify-content:center;">+</button>
        </div>
      </div>
      <div style="text-align:right;flex-shrink:0;">
        <div style="font-size:0.85rem;color:var(--text-muted);font-weight:500;">${p.priceLabel}</div>
      </div>
    </div>
  `).join('');

  // Bind qty buttons
  container.querySelectorAll('.qty-plus').forEach(btn => {
    btn.addEventListener('click', () => addToCart(btn.dataset.id, 1));
  });
  container.querySelectorAll('.qty-minus').forEach(btn => {
    btn.addEventListener('click', () => addToCart(btn.dataset.id, -1));
  });
}

function getCartQty(id) {
  const item = cart.find(c => c.id === id);
  return item ? item.qty : 0;
}

function addToCart(id, delta) {
  const product = PRODUCTS.find(p => p.id === id);
  if (!product) return;
  const idx = cart.findIndex(c => c.id === id);

  if (idx >= 0) {
    const newQty = cart[idx].qty + delta;
    if (newQty <= 0) {
      cart.splice(idx, 1);
    } else if (newQty <= product.maxQty) {
      cart[idx].qty = newQty;
    } else {
      showToast(`Máximo ${product.maxQty} unidades por pedido`);
      return;
    }
  } else if (delta > 0) {
    cart.push({ id, qty: 1 });
  } else {
    return;
  }

  saveCart();

  // Update all qty displays
  document.querySelectorAll(`.qty-value[data-id="${id}"]`).forEach(el => {
    el.textContent = getCartQty(id);
  });

  // Update product card highlight
  document.querySelectorAll(`.store-card--product[data-id="${id}"]`).forEach(el => {
    el.classList.toggle('store-card--in-cart', getCartQty(id) > 0);
  });

  renderCartSummary();

  // Auto-advance to step 2 if cart has items
  if (cart.length > 0 && step === 1) {
    goToStep(2);
  }
  if (cart.length === 0) {
    goToStep(1);
  }
}

function renderCartSummary() {
  const container = document.getElementById('cart-summary');
  const empty = document.getElementById('cart-empty');
  const total = document.getElementById('cart-total');
  const items = document.getElementById('cart-items');
  const submitBtn = document.getElementById('submit-order');

  if (!container) return;

  const hasItems = cart.length > 0;

  if (empty) empty.style.display = hasItems ? 'none' : 'block';
  if (total) total.style.display = hasItems ? 'flex' : 'none';
  if (items) items.style.display = hasItems ? 'block' : 'none';
  if (submitBtn) submitBtn.style.display = hasItems ? 'inline-flex' : 'none';

  if (hasItems && items) {
    items.innerHTML = cart.map(c => {
      const product = PRODUCTS.find(p => p.id === c.id);
      return `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:0.5rem 0;border-bottom:1px solid rgba(0,0,0,0.04);">
          <div>
            <strong style="font-size:0.9rem;">${product?.name || c.id}</strong>
            <span style="font-size:0.8rem;color:var(--text-muted);margin-left:0.5rem;">× ${c.qty}</span>
          </div>
          <button class="qty-btn" data-id="${c.id}" data-remove style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:0.8rem;">✕</button>
        </div>
      `;
    }).join('');
    items.querySelectorAll('[data-remove]').forEach(btn => {
      btn.addEventListener('click', () => addToCart(btn.dataset.id, -999));
    });
  }

  updateOrderSummary();
}

function updateOrderSummary() {
  const summary = document.getElementById('order-summary-items');
  const totalQty = document.getElementById('order-total-qty');
  if (!summary) return;

  if (cart.length === 0 || !totalQty) return;

  const totalItems = cart.reduce((s, c) => s + c.qty, 0);
  totalQty.textContent = `${totalItems} ${totalItems === 1 ? 'unidad' : 'unidades'}`;

  summary.innerHTML = cart.map(c => {
    const p = PRODUCTS.find(pr => pr.id === c.id);
    return `<div style="display:flex;justify-content:space-between;font-size:0.85rem;padding:0.3rem 0;">
      <span>${p?.name || c.id} × ${c.qty}</span>
      <span style="color:var(--text-muted);">${p?.priceLabel || ''}</span>
    </div>`;
  }).join('');
}

function renderShippingOptions() {
  const container = document.getElementById('shipping-options');
  if (!container) return;
  container.innerHTML = SHIPPING_OPTIONS.map(o => `
    <label class="shipping-option" data-id="${o.id}" style="display:flex;align-items:flex-start;gap:0.75rem;padding:0.75rem 1rem;border:2px solid var(--crema);border-radius:var(--radius-md);cursor:pointer;transition:all 0.15s;">
      <input type="radio" name="shipping" value="${o.id}" style="margin-top:0.15rem;accent-color:var(--cobre);">
      <div>
        <strong style="font-size:0.9rem;">${o.label}</strong>
        <div style="font-size:0.8rem;color:var(--text-muted);">${o.eta}</div>
      </div>
      <div style="margin-left:auto;font-size:0.85rem;color:var(--text-muted);">${o.price === 0 ? 'A consultar' : `$${o.price.toFixed(2)}`}</div>
    </label>
  `).join('');

  container.querySelectorAll('.shipping-option').forEach(el => {
    el.addEventListener('click', () => {
      container.querySelectorAll('.shipping-option').forEach(o => o.style.borderColor = 'var(--crema)');
      el.style.borderColor = 'var(--cobre)';
      el.querySelector('input').checked = true;
    });
  });
}

function bindFormSteps() {
  // Payment option styling
  document.querySelectorAll('.payment-option').forEach(el => {
    const radio = el.querySelector('input[type="radio"]');
    if (!radio) return;
    radio.addEventListener('change', () => {
      document.querySelectorAll('.payment-option').forEach(o => o.classList.remove('payment-option--selected'));
      if (radio.checked) el.classList.add('payment-option--selected');
    });
    el.addEventListener('click', (e) => {
      if (e.target.tagName !== 'INPUT') radio.checked = true;
      document.querySelectorAll('.payment-option').forEach(o => o.classList.remove('payment-option--selected'));
      el.classList.add('payment-option--selected');
    });
  });

  // Step navigation
  document.querySelectorAll('[data-goto-step]').forEach(btn => {
    btn.addEventListener('click', () => goToStep(parseInt(btn.dataset.gotoStep)));
  });

  // Back buttons
  document.querySelectorAll('[data-prev-step]').forEach(btn => {
    btn.addEventListener('click', () => goToStep(parseInt(btn.dataset.prevStep)));
  });

  // Next step validations
  const nextToStep2 = document.getElementById('next-to-step2');
  if (nextToStep2) {
    nextToStep2.addEventListener('click', (e) => {
      if (cart.length === 0) {
        showToast('Agregá al menos un producto para continuar');
        return;
      }
      goToStep(2);
    });
  }

  const nextToStep3 = document.getElementById('next-to-step3');
  if (nextToStep3) {
    nextToStep3.addEventListener('click', (e) => {
      const form = document.getElementById('customer-form');
      if (form && !form.checkValidity()) {
        form.reportValidity();
        return;
      }
      goToStep(3);
    });
  }

  const nextToStep4 = document.getElementById('next-to-step4');
  if (nextToStep4) {
    nextToStep4.addEventListener('click', (e) => {
      const shippingSelected = document.querySelector('input[name="shipping"]:checked');
      if (!shippingSelected) {
        showToast('Seleccioná un método de envío');
        return;
      }
      renderFinalOrder();
      goToStep(4);
    });
  }

  // Submit order
  const submitBtn = document.getElementById('submit-order');
  if (submitBtn) {
    submitBtn.addEventListener('click', submitOrder);
  }
}

function goToStep(n) {
  step = n;
  document.querySelectorAll('.order-step').forEach(el => {
    el.classList.remove('order-step--active');
  });
  const active = document.getElementById(`step-${n}`);
  if (active) active.classList.add('order-step--active');

  // Update step indicators
  document.querySelectorAll('.step-indicator').forEach(el => {
    el.classList.toggle('step-indicator--active', parseInt(el.dataset.step) === n);
    el.classList.toggle('step-indicator--done', parseInt(el.dataset.step) < n);
  });

  // Scroll to top of form
  const formContainer = document.getElementById('order-form');
  if (formContainer) formContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderFinalOrder() {
  const container = document.getElementById('final-order-detail');
  if (!container) return;

  // Get form data
  const form = document.getElementById('customer-form');
  const formData = new FormData(form);
  const shipping = document.querySelector('input[name="shipping"]:checked');
  const shippingLabel = shipping ? SHIPPING_OPTIONS.find(o => o.id === shipping.value)?.label || shipping.value : 'No seleccionado';

  container.innerHTML = `
    <div style="background:var(--crema);border-radius:var(--radius-md);padding:1.25rem;">
      <h4 style="font-size:0.9rem;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-muted);margin-bottom:0.75rem;">Productos</h4>
      ${cart.map(c => {
        const p = PRODUCTS.find(pr => pr.id === c.id);
        return `<div style="display:flex;justify-content:space-between;font-size:0.9rem;padding:0.25rem 0;">
          <span>${p?.name || c.id} <span style="color:var(--text-muted);">× ${c.qty}</span></span>
        </div>`;
      }).join('')}
    </div>

    <div style="background:var(--crema);border-radius:var(--radius-md);padding:1.25rem;margin-top:0.75rem;">
      <h4 style="font-size:0.9rem;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-muted);margin-bottom:0.75rem;">Datos de contacto</h4>
      <div style="font-size:0.875rem;line-height:1.8;">
        <strong>Nombre:</strong> ${formData.get('name') || ''}<br>
        <strong>Teléfono:</strong> ${formData.get('phone') || ''}<br>
        <strong>Email:</strong> ${formData.get('email') || ''}
      </div>
    </div>

    <div style="background:var(--crema);border-radius:var(--radius-md);padding:1.25rem;margin-top:0.75rem;">
      <h4 style="font-size:0.9rem;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-muted);margin-bottom:0.75rem;">Dirección de envío</h4>
      <div style="font-size:0.875rem;line-height:1.8;">
        <strong>Localidad:</strong> ${formData.get('city') || ''}<br>
        <strong>Provincia:</strong> ${formData.get('province') || ''}<br>
        <strong>Dirección:</strong> ${formData.get('address') || ''}<br>
        <strong>Código postal:</strong> ${formData.get('zip') || ''}
      </div>
    </div>

    <div style="background:var(--crema);border-radius:var(--radius-md);padding:1.25rem;margin-top:0.75rem;">
      <h4 style="font-size:0.9rem;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-muted);margin-bottom:0.75rem;">Envío</h4>
      <div style="font-size:0.875rem;">${shippingLabel}</div>
    </div>

    <div style="background:var(--crema);border-radius:var(--radius-md);padding:1.25rem;margin-top:0.75rem;">
      <h4 style="font-size:0.9rem;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-muted);margin-bottom:0.75rem;">Método de pago</h4>
      <div style="font-size:0.875rem;">${formData.get('payment') || 'No seleccionado'}</div>
    </div>

    ${formData.get('notes') ? `
    <div style="background:var(--crema);border-radius:var(--radius-md);padding:1.25rem;margin-top:0.75rem;">
      <h4 style="font-size:0.9rem;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-muted);margin-bottom:0.75rem;">Notas</h4>
      <div style="font-size:0.875rem;">${formData.get('notes')}</div>
    </div>` : ''}
  `;
}

function submitOrder() {
  const btn = document.getElementById('submit-order');
  if (!btn) return;
  btn.disabled = true;
  btn.innerHTML = 'Enviando pedido...';

  const form = document.getElementById('customer-form');
  const formData = new FormData(form);
  formData.append('_subject', 'Nuevo pedido Vértice Gin');

  // Build order summary text
  let orderText = '📦 *NUEVO PEDIDO — VÉRTICE GIN*\n\n';
  orderText += '*Productos:*\n';
  cart.forEach(c => {
    const p = PRODUCTS.find(pr => pr.id === c.id);
    orderText += `  • ${p?.name || c.id} × ${c.qty}\n`;
  });
  orderText += `\n*Contacto:*\n  Nombre: ${formData.get('name')}\n  Tel: ${formData.get('phone')}\n  Email: ${formData.get('email')}\n`;
  orderText += `\n*Envío:* ${formData.get('address') || ''}, ${formData.get('city') || ''}, ${formData.get('province') || ''} (CP: ${formData.get('zip') || ''})\n`;
  orderText += `\n*Pago:* ${formData.get('payment') || ''}\n`;
  if (formData.get('notes')) orderText += `\n*Notas:* ${formData.get('notes')}\n`;

  formData.append('order_summary', orderText);

  // Send via Formspree
  const formAction = form.action;
  if (formAction && formAction.includes('formspree')) {
    fetch(formAction, {
      method: 'POST',
      body: formData,
      headers: { 'Accept': 'application/json' }
    })
    .then(res => {
      if (res.ok) {
        showConfirmation();
      } else {
        throw new Error('Error al enviar');
      }
    })
    .catch(() => {
      // Fallback: show order and let user copy
      fallbackOrder(orderText);
    });
  } else {
    // No Formspree configured — fallback
    fallbackOrder(orderText);
  }
}

function fallbackOrder(orderText) {
  const container = document.getElementById('order-confirmation');
  const btn = document.getElementById('submit-order');
  if (container) {
    document.getElementById('order-form').style.display = 'none';
    container.style.display = 'block';
    container.innerHTML = `
      <div class="cta-section fade-in" style="text-align:center;">
        <div style="font-size:3rem;margin-bottom:1rem;">✅</div>
        <h2>¡Pedido recibido!</h2>
        <p style="color:var(--text-secondary);max-width:500px;margin:0 auto 2rem;">
          En las próximas horas te vamos a contactar al <strong>${document.querySelector('[name="phone"]')?.value || 'teléfono indicado'}</strong>
          para confirmar stock, precio final y coordinar el pago y envío.
        </p>
        <div style="background:var(--crema);border-radius:var(--radius-md);padding:1.5rem;text-align:left;max-width:500px;margin:0 auto;font-size:0.85rem;line-height:1.6;white-space:pre-wrap;font-family:monospace;">${orderText.replace(/\n/g, '<br>')}</div>
        <p style="margin-top:1.5rem;font-size:0.8rem;color:var(--text-muted);">
          Guardá este número de pedido o copiá el resumen antes de salir.
        </p>
        <button class="btn btn--cobre" style="margin-top:1rem;" onclick="cart=[];saveCart();window.location.href='../'">
          Volver al inicio
        </button>
      </div>
    `;
  }
  if (btn) btn.style.display = 'none';
  renderCartSummary();
  updateCartBadge();
}

function showConfirmation() {
  const container = document.getElementById('order-confirmation');
  document.getElementById('order-form').style.display = 'none';
  container.style.display = 'block';
  container.innerHTML = `
    <div class="cta-section fade-in" style="text-align:center;">
      <div style="font-size:3rem;margin-bottom:1rem;">✅</div>
      <h2>¡Pedido enviado con éxito!</h2>
      <p style="color:var(--text-secondary);max-width:500px;margin:0 auto 2rem;">
        Te vamos a contactar por WhatsApp o email para confirmar stock, precio final y coordinar el pago y envío.
      </p>
      <button class="btn btn--cobre" onclick="cart=[];saveCart();window.location.href='../'">
        Volver al inicio
      </button>
    </div>
  `;
  cart = [];
  saveCart();
}

function showToast(msg) {
  const existing = document.querySelector('.toast-notification');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = 'toast-notification';
  toast.textContent = msg;
  Object.assign(toast.style, {
    position: 'fixed', bottom: '100px', left: '50%', transform: 'translateX(-50%)',
    background: 'var(--carbon)', color: 'var(--crema)', padding: '12px 24px',
    borderRadius: 'var(--radius-full)', fontSize: '0.875rem', zIndex: '9999',
    boxShadow: 'var(--shadow-lg)', fontFamily: 'var(--font-sans)',
    transition: 'opacity 0.3s ease', opacity: '1',
  });
  document.body.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 2500);
}

document.addEventListener('DOMContentLoaded', initStore);
