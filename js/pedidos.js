document.addEventListener('DOMContentLoaded', () => {
  Carrito.init();
  renderizarProductos();
  bindCartUI();
  bindCheckout();
  document.getElementById('cart-float').addEventListener('click', abrirCarrito);
});

function renderizarProductos() {
  const grid = document.getElementById('productos-grid');
  if (!grid) return;
  const productos = obtenerProductos().filter(p => p.activo);

  grid.innerHTML = productos.map(p => {
    const enCarrito = Carrito.items.find(i => i.id === p.id);
    const cantidad = enCarrito ? enCarrito.cantidad : 0;
    const sinStock = p.stock === 0;

    return `
      <div class="producto-card${sinStock ? ' sin-stock' : ''}">
        <div class="producto-card__icon">${p.imagen}</div>
        <h3>${p.nombre}</h3>
        <div class="producto-card__sub">${p.subtitulo}</div>
        <div class="producto-card__desc">${p.descripcion}</div>
        <div class="producto-card__footer">
          <span class="producto-card__precio">${formatearPrecio(p.precio)}</span>
          ${sinStock
            ? '<span class="sin-stock-badge">Sin stock</span>'
            : `<button class="btn btn--cobre btn--add${cantidad > 0 ? ' agregado' : ''}" data-id="${p.id}">
                ${cantidad > 0 ? '✓ Agregado' : '+ Agregar'}
              </button>`
          }
        </div>
      </div>
    `;
  }).join('');

  grid.querySelectorAll('.btn--add').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = Number(btn.dataset.id);
      Carrito.agregar(id);
      actualizarBotonProducto(id);
      abrirCarrito();
    });
  });
}

function actualizarBotonProducto(id) {
  const item = Carrito.items.find(i => i.id === id);
  document.querySelectorAll(`.btn--add[data-id="${id}"]`).forEach(btn => {
    if (item) {
      btn.innerHTML = '✓ Agregado';
      btn.classList.add('agregado');
    } else {
      btn.innerHTML = '+ Agregar';
      btn.classList.remove('agregado');
    }
  });
}

function abrirCarrito() {
  document.getElementById('cart-drawer').classList.add('open');
  document.getElementById('cart-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  renderizarCarrito();
}

function cerrarCarrito() {
  document.getElementById('cart-drawer').classList.remove('open');
  document.getElementById('cart-overlay').classList.remove('open');
  document.body.style.overflow = '';
}

function renderizarCarrito() {
  const items = Carrito.obtenerItems();
  const container = document.getElementById('cart-items');
  const vacio = document.getElementById('cart-vacio');
  const footer = document.getElementById('cart-footer');
  const label = document.getElementById('cart-count-label');
  const totalEl = document.getElementById('cart-total');

  const count = Carrito.cantidadTotal;
  label.textContent = `(${count})`;

  if (count === 0) {
    vacio.style.display = 'block';
    container.style.display = 'none';
    footer.style.display = 'none';
    return;
  }

  vacio.style.display = 'none';
  container.style.display = 'block';
  footer.style.display = 'block';
  totalEl.textContent = formatearPrecio(Carrito.total);

  container.innerHTML = items.map(item => `
    <div class="cart-item">
      <div class="cart-item__icon">${item.imagen}</div>
      <div class="cart-item__info">
        <h4>${item.nombre}</h4>
        <div class="cart-item__precio">${formatearPrecio(item.precio)} c/u</div>
        <div class="cart-item__controles">
          <button class="qty-minus" data-id="${item.id}">−</button>
          <span>${item.cantidad}</span>
          <button class="qty-plus" data-id="${item.id}">+</button>
        </div>
      </div>
      <div class="cart-item__total">
        <div class="line-total">${formatearPrecio(item.subtotal)}</div>
        <button class="remove-btn" data-id="${item.id}">Eliminar</button>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.qty-plus').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = Number(btn.dataset.id);
      const item = Carrito.items.find(i => i.id === id);
      if (item) Carrito.actualizarCantidad(id, item.cantidad + 1);
      renderizarCarrito();
      actualizarBotonProducto(id);
    });
  });

  container.querySelectorAll('.qty-minus').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = Number(btn.dataset.id);
      const item = Carrito.items.find(i => i.id === id);
      if (item) Carrito.actualizarCantidad(id, item.cantidad - 1);
      renderizarCarrito();
      actualizarBotonProducto(id);
    });
  });

  container.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = Number(btn.dataset.id);
      Carrito.quitar(id);
      renderizarCarrito();
      actualizarBotonProducto(id);
    });
  });
}

function bindCartUI() {
  document.getElementById('cart-close').addEventListener('click', cerrarCarrito);
  document.getElementById('cart-overlay').addEventListener('click', cerrarCarrito);
  document.getElementById('checkout-btn').addEventListener('click', () => {
    if (Carrito.cantidadTotal === 0) return;
    cerrarCarrito();
    setTimeout(abrirCheckout, 350);
  });
}

function abrirCheckout() {
  document.getElementById('checkout-modal').classList.add('open');
  document.getElementById('checkout-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  renderizarResumenCheckout();
}

function cerrarCheckout() {
  document.getElementById('checkout-modal').classList.remove('open');
  document.getElementById('checkout-overlay').classList.remove('open');
  document.body.style.overflow = '';
}

function renderizarResumenCheckout() {
  const items = Carrito.obtenerItems();
  const container = document.getElementById('resumen-pedido');
  container.innerHTML = `
    <h3>Resumen del pedido</h3>
    ${items.map(i => `
      <div class="resumen-item">
        <span>${i.nombre} × ${i.cantidad}</span>
        <span>${formatearPrecio(i.subtotal)}</span>
      </div>
    `).join('')}
    <div class="resumen-total">
      <span>Total</span>
      <span>${formatearPrecio(Carrito.total)}</span>
    </div>
  `;
}

function bindCheckout() {
  document.getElementById('checkout-close').addEventListener('click', cerrarCheckout);
  document.getElementById('checkout-overlay').addEventListener('click', cerrarCheckout);

  document.getElementById('checkout-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = document.getElementById('submit-btn');
    btn.disabled = true;
    btn.innerHTML = 'Procesando...';

    const nombre = document.getElementById('nombre').value.trim();
    const telefono = document.getElementById('telefono').value.trim();
    const direccion = document.getElementById('direccion').value.trim();
    const notas = document.getElementById('notas').value.trim();

    if (!nombre || !telefono || !direccion) {
      showToast('Completá todos los campos obligatorios');
      btn.disabled = false;
      btn.innerHTML = 'Comprar';
      return;
    }

    guardarPedidoEnLocal(nombre, telefono, direccion, notas);

    cerrarCheckout();
    mostrarConfirmacion();
    Carrito.vaciar();
    renderizarProductos();

    btn.disabled = false;
    btn.innerHTML = 'Comprar';
  });
}

function guardarPedidoEnLocal(nombre, telefono, direccion, notas) {
  try {
    const pedidos = JSON.parse(localStorage.getItem('vertice-pedidos') || '[]');
    pedidos.unshift({
      id: 'PED-' + String(Date.now()).slice(-6),
      fecha: new Date().toLocaleString('es-AR'),
      nombre,
      telefono,
      direccion,
      notas,
      productos: Carrito.obtenerItems().map(i => ({
        nombre: i.nombre, cantidad: i.cantidad, precio: i.precio, subtotal: i.subtotal,
      })),
      total: Carrito.total,
      estado: 'Pendiente',
    });
    localStorage.setItem('vertice-pedidos', JSON.stringify(pedidos));
  } catch (e) {}
}

function mostrarConfirmacion() {
  document.getElementById('productos-grid').style.display = 'none';
  document.getElementById('cart-float').style.display = 'none';
  document.getElementById('confirmation-container').style.display = 'block';
  document.getElementById('confirmation-container').scrollIntoView({ behavior: 'smooth' });
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
