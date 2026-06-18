const Carrito = {
  items: [],

  init() {
    this.cargar();
    this.actualizarBadge();
  },

  obtenerItems() {
    const productos = obtenerProductos();
    return this.items.map(item => {
      const p = productos.find(pr => pr.id === item.id);
      return {
        id: item.id,
        cantidad: item.cantidad,
        nombre: p ? p.nombre : 'Producto',
        precio: p ? p.precio : 0,
        subtotal: p ? p.precio * item.cantidad : 0,
        imagen: p ? p.imagen : '📦',
      };
    });
  },

  agregar(id, qty) {
    qty = qty || 1;
    const idx = this.items.findIndex(i => i.id === id);
    if (idx >= 0) {
      this.items[idx].cantidad += qty;
    } else {
      this.items.push({ id, cantidad: qty });
    }
    this.guardar();
    this.actualizarBadge();
  },

  quitar(id) {
    this.items = this.items.filter(i => i.id !== id);
    this.guardar();
    this.actualizarBadge();
  },

  actualizarCantidad(id, qty) {
    if (qty <= 0) { this.quitar(id); return; }
    const idx = this.items.findIndex(i => i.id === id);
    if (idx >= 0) this.items[idx].cantidad = qty;
    this.guardar();
    this.actualizarBadge();
  },

  vaciar() {
    this.items = [];
    this.guardar();
    this.actualizarBadge();
  },

  get cantidadTotal() {
    return this.items.reduce((s, i) => s + i.cantidad, 0);
  },

  get total() {
    const productos = obtenerProductos();
    return this.items.reduce((s, i) => {
      const p = productos.find(pr => pr.id === i.id);
      return s + (p ? p.precio * i.cantidad : 0);
    }, 0);
  },

  guardar() {
    localStorage.setItem('vertice-carrito', JSON.stringify(this.items));
  },

  cargar() {
    try {
      this.items = JSON.parse(localStorage.getItem('vertice-carrito') || '[]');
    } catch (e) {
      this.items = [];
    }
  },

  actualizarBadge() {
    const count = this.cantidadTotal;
    document.querySelectorAll('.cart-count').forEach(el => {
      el.textContent = count;
      el.style.display = count > 0 ? '' : 'none';
    });
  },
};
