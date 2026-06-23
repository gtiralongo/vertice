let productosEditables = [];
let confirmCallback = null;
// Default statuses with colors matching the CSS badge classes
const DEFAULT_STATUSES = [
  { name: 'Pendiente', color: '#F59E0B' },
  { name: 'Confirmado', color: '#3B82F6' },
  { name: 'En Preparacion', color: '#6366F1' },
  { name: 'Enviado', color: '#10B981' },
  { name: 'Entregado', color: '#059669' },
  { name: 'Cancelado', color: '#EF4444' },
];

let orderStatuses = JSON.parse(localStorage.getItem('vertice-order-statuses') || 'null') || DEFAULT_STATUSES;

function persistOrderStatuses() {
  localStorage.setItem('vertice-order-statuses', JSON.stringify(orderStatuses));
}

function getStatusName(s) {
  return typeof s === 'string' ? s : s.name;
}

function getStatusColor(s) {
  if (typeof s === 'string') {
    // Return default color for built-in statuses
    const def = DEFAULT_STATUSES.find(d => d.name === s);
    return def ? def.color : '#6B7280';
  }
  return s.color || '#6B7280';
}

function getStatusClass(s) {
  const name = getStatusName(s);
  return name.replace(/\s/g, '');
}

function renderOrderStatuses() {
  const c = document.getElementById('orderStatusesContainer');
  if (!c) return;
  c.innerHTML = orderStatuses.map((s, i) => {
    const cls = getStatusClass(s);
    const color = getStatusColor(s);
    return '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">' +
      '<span class="status-badge status-' + esc(cls) + '" style="background:' + color + '22;color:' + color + ';border-color:' + color + '55;">' +
      '<span style="background:' + color + ';">&nbsp;</span>' + esc(getStatusName(s)) + '</span>' +
      '<button class="btn btn-xs btn-ghost" onclick="editOrderStatus(' + i + ')" title="Editar">✏️</button>' +
      '<button class="btn btn-xs btn-danger" onclick="removeOrderStatus(' + i + ')" title="Eliminar">✕</button>' +
      '</div>';
  }).join('');
}

function addOrderStatus() {
  const name = prompt('Nombre del nuevo estado:');
  if (!name || !name.trim()) return;
  if (orderStatuses.some(s => getStatusName(s) === name.trim())) { showToast('Ese estado ya existe', 'error'); return; }
  const color = prompt('Color (hex, ej: #FF6600):', '#6B7280');
  if (!color || !color.trim()) return;
  orderStatuses.push({ name: name.trim(), color: color.trim() });
  persistOrderStatuses();
  renderOrderStatuses();
  refreshStatusDropdowns();
  showToast('Estado agregado: ' + name.trim(), 'success');
}

function removeOrderStatus(idx) {
  const s = orderStatuses[idx];
  if (!s) return;
  const name = getStatusName(s);
  showConfirm('🗑️ Eliminar estado', '¿Eliminás el estado "' + name + '"? Los pedidos que lo usen lo conservarán pero ya no aparecerá como opción.', () => {
    orderStatuses.splice(idx, 1);
    persistOrderStatuses();
    renderOrderStatuses();
    refreshStatusDropdowns();
    showToast('Estado eliminado: ' + name, 'info');
  });
}

function editOrderStatus(idx) {
  const s = orderStatuses[idx];
  if (!s) return;
  const oldName = getStatusName(s);
  const oldColor = getStatusColor(s);
  const val = prompt('Nuevo nombre:', oldName);
  if (!val || !val.trim() || val.trim() === oldName) return;
  if (orderStatuses.some((s2, i2) => i2 !== idx && getStatusName(s2) === val.trim())) { showToast('Ese estado ya existe', 'error'); return; }
  const color = prompt('Color (hex, ej: #FF6600):', oldColor);
  if (!color || !color.trim()) return;
  let pedidos = [];
  try { pedidos = JSON.parse(localStorage.getItem('vertice-pedidos') || '[]'); } catch (e) {}
  const renamed = pedidos.filter(o => (o.estado || 'Pendiente') === oldName);
  if (renamed.length) {
    showConfirm('✏️ Renombrar estado', 'Hay ' + renamed.length + ' pedido(s) con estado "' + oldName + '". ¿Les cambiamos el estado a "' + val.trim() + '"?', () => {
      pedidos.forEach(o => { if ((o.estado || 'Pendiente') === oldName) o.estado = val.trim(); });
      localStorage.setItem('vertice-pedidos', JSON.stringify(pedidos));
      orderStatuses[idx] = { name: val.trim(), color: color.trim() };
      persistOrderStatuses();
      renderOrderStatuses();
      refreshStatusDropdowns();
      cargarPedidos();
      showToast('Estado renombrado a: ' + val.trim(), 'success');
    });
  } else {
    orderStatuses[idx] = { name: val.trim(), color: color.trim() };
    persistOrderStatuses();
    renderOrderStatuses();
    refreshStatusDropdowns();
    showToast('Estado renombrado a: ' + val.trim(), 'success');
  }
}

function refreshStatusDropdowns() {
  const filterSel = document.getElementById('orderStatusFilter');
  if (filterSel) {
    const cur = filterSel.value;
    filterSel.innerHTML = '<option value="">Todos los estados</option>' +
      orderStatuses.map(s => '<option value="' + esc(getStatusName(s)) + '">' + esc(getStatusName(s)) + '</option>').join('');
    filterSel.value = cur;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initSidebar();
  initTabs();
  bindModals();
  cargarProductos();
  cargarPedidos();
  cargarConfig();
  bindProductModal();
  bindConfig();
  bindJsonActions();
  bindDashboard();
});

function initSidebar() {
  document.getElementById('menuToggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('sidebar--open');
    document.getElementById('sidebarOverlay').classList.toggle('sidebar-overlay--visible');
  });
  document.getElementById('sidebarOverlay').addEventListener('click', () => {
    document.getElementById('sidebar').classList.remove('sidebar--open');
    document.getElementById('sidebarOverlay').classList.remove('sidebar-overlay--visible');
  });
}

function initTabs() {
  document.querySelectorAll('.sidebar__link[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.sidebar__link').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      const tab = document.getElementById('tab-' + btn.dataset.tab);
      if (tab) tab.classList.add('active');
      document.querySelector('#headerTitle h2').textContent = btn.querySelector('.sidebar__link-label').textContent;
      const subtitles = { dashboard: 'Panel de control', productos: 'Gestión de productos', pedidos: 'Gestión de pedidos', config: 'Ajustes del sistema' };
      document.querySelector('#headerTitle p').textContent = subtitles[btn.dataset.tab] || '';
      if (window.innerWidth <= 768) {
        document.getElementById('sidebar').classList.remove('sidebar--open');
        document.getElementById('sidebarOverlay').classList.remove('sidebar-overlay--visible');
      }
    });
  });
}

function bindModals() {
  const orderModal = document.getElementById('orderModal');
  document.getElementById('closeOrderModalBtn').addEventListener('click', () => orderModal.classList.remove('open'));
  orderModal.addEventListener('click', (e) => { if (e.target === orderModal) orderModal.classList.remove('open'); });

  const confirmModal = document.getElementById('confirmModal');
  document.getElementById('confirmCancelBtn').addEventListener('click', () => {
    confirmModal.classList.remove('open'); confirmCallback = null;
  });
  document.getElementById('confirmOkBtn').addEventListener('click', () => {
    confirmModal.classList.remove('open');
    if (confirmCallback) { confirmCallback(); confirmCallback = null; }
  });
  confirmModal.addEventListener('click', (e) => {
    if (e.target === confirmModal) { confirmModal.classList.remove('open'); confirmCallback = null; }
  });
}

function bindDashboard() {
  renderDashboard();
}

function renderDashboard() {
  const productos = obtenerProductos();
  const activos = productos.filter(p => p.activo);
  let pedidos = [];
  try { pedidos = JSON.parse(localStorage.getItem('vertice-pedidos') || '[]'); } catch (e) {}
  const pendientes = pedidos.filter(o => (o.estado || 'Pendiente') === 'Pendiente');
  const ingresos = pedidos.filter(o => (o.estado || 'Pendiente') !== 'Cancelado').reduce((s, o) => s + (o.total || 0), 0);

  document.getElementById('statProductos').textContent = productos.length;
  document.getElementById('statActivos').textContent = activos.length;
  document.getElementById('statPedidos').textContent = pedidos.length;
  document.getElementById('statPendientes').textContent = pendientes.length;
  document.getElementById('statIngresos').textContent = formatearPrecio(ingresos);
  document.getElementById('productBadge').textContent = productos.length;
  document.getElementById('orderBadge').textContent = pendientes.length;

  const recentOrders = document.getElementById('dashboardRecentOrders');
  if (pedidos.length === 0) {
    recentOrders.innerHTML = '<p style="color:var(--text-muted);font-size:13px;">No hay pedidos recientes.</p>';
  } else {
    const last5 = pedidos.slice(-5).reverse();
    recentOrders.innerHTML = last5.map(o => {
      const estado = o.estado || 'Pendiente';
      const statusObj = orderStatuses.find(s => getStatusName(s) === estado);
      const statusColor = statusObj ? getStatusColor(statusObj) : null;
      const badgeStyle = statusColor ? `style="background:${statusColor}22;color:${statusColor};border-color:${statusColor}55;"` : '';
      return `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--gray-100);font-size:13px;">
        <span><strong>${esc(o.id)}</strong> · ${esc(o.nombre)}</span>
        <span class="status-badge status-${estado.replace(/\s/g,'')}" ${badgeStyle}>${esc(estado)}</span>
      </div>`;
    }).join('') + '<div style="margin-top:8px;"><button class="btn btn-sm btn-ghost" onclick="switchTab(\'pedidos\')">Ver todos →</button></div>';
  }

  const quickProducts = document.getElementById('dashboardQuickProducts');
  if (productos.length === 0) {
    quickProducts.innerHTML = '<p style="color:var(--text-muted);font-size:13px;">No hay productos.</p>';
  } else {
    quickProducts.innerHTML = productos.slice(0, 5).map(p => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--gray-100);font-size:13px;">
        <span>${p.emoji || p.imagen || '🍸'} <strong>${esc(p.nombre)}</strong></span>
        <span style="color:${p.activo ? 'var(--verde)' : 'var(--text-muted)'};font-weight:600;">${p.activo ? 'Activo' : 'Inactivo'}</span>
      </div>
    `).join('') + '<div style="margin-top:8px;"><button class="btn btn-sm btn-ghost" onclick="switchTab(\'productos\')">Ver todos →</button></div>';
  }
}

function switchTab(tabName) {
  const btn = document.querySelector(`.sidebar__link[data-tab="${tabName}"]`);
  if (btn) btn.click();
}

function cargarProductos() {
  productosEditables = JSON.parse(JSON.stringify(obtenerProductos()));
  renderizarTablaProductos();
  renderDashboard();
}

function renderizarTablaProductos() {
  const tbody = document.getElementById('productTableBody');
  const searchTerm = (document.getElementById('productSearch').value || '').toLowerCase();
  let filtered = productosEditables;
  if (searchTerm) {
    filtered = productosEditables.filter(p =>
      p.nombre.toLowerCase().includes(searchTerm) ||
      p.categoria.toLowerCase().includes(searchTerm) ||
      String(p.id).includes(searchTerm)
    );
  }
  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="7">
      <div class="empty-state">
        <div class="empty-state__icon">${searchTerm ? '🔍' : '📦'}</div>
        <h3>${searchTerm ? 'Sin resultados' : 'No hay productos'}</h3>
        <p>${searchTerm ? 'No encontramos productos con ese término.' : 'Agregá el primer producto para empezar.'}</p>
      </div>
    </td></tr>`;
    return;
  }
  tbody.innerHTML = filtered.map(p => `
    <tr>
      <td><span style="font-size:22px;">${p.emoji || p.imagen || '🍸'}</span></td>
      <td>
        <div class="product-table-card__info">
          <h4>${esc(p.nombre)}</h4>
          ${p.subtitulo ? '<p>' + esc(p.subtitulo) + '</p>' : ''}
        </div>
      </td>
      <td><strong>${formatearPrecio(p.precio)}</strong></td>
      <td><span style="padding:3px 10px;background:var(--gray-100);border-radius:6px;font-size:11px;font-weight:500;">${esc(p.categoria)}</span></td>
      <td>${p.stock === -1 ? '∞' : p.stock}</td>
      <td>
        <label class="toggle" onclick="event.stopPropagation()">
          <input type="checkbox" ${p.activo ? 'checked' : ''} onchange="toggleProducto(${p.id})">
          <span class="toggle__slider"></span>
        </label>
      </td>
      <td>
        <button class="btn btn-sm btn-ghost" onclick="editarProducto(${p.id})" title="Editar">✏️</button>
        <button class="btn btn-sm ${p.activo ? 'btn-ghost' : 'btn-success'}" onclick="toggleProducto(${p.id})" title="${p.activo ? 'Desactivar' : 'Activar'}">
          ${p.activo ? '⏸️' : '▶️'}
        </button>
      </td>
    </tr>
  `).join('');
}

function editarProducto(id) {
  const p = productosEditables.find(x => x.id === id);
  if (!p) return;
  document.getElementById('productModalTitle').textContent = 'Editar Producto';
  document.getElementById('editProductId').value = p.id;
  document.getElementById('prod-nombre').value = p.nombre || '';
  document.getElementById('prod-subtitulo').value = p.subtitulo || '';
  document.getElementById('prod-descripcion').value = p.descripcion || '';
  document.getElementById('prod-descripcion_larga').value = p.descripcion_larga || '';
  document.getElementById('prod-precio').value = p.precio || '';
  document.getElementById('prod-categoria').value = p.categoria || '';
  document.getElementById('prod-stock').value = p.stock !== undefined ? p.stock : -1;
  document.getElementById('prod-emoji').value = p.emoji || '🍸';
  document.getElementById('prod-imagen_url').value = p.imagen_url || '';
  document.getElementById('prod-especificaciones').value = (p.especificaciones || []).map(e => `${e.label}: ${e.value}`).join('\n');
  renderBotanicosList(p.botanicos || []);
  renderProcesoStepsList(p.proceso_steps || []);
  document.getElementById('productModal').classList.add('open');
}

function toggleProducto(id) {
  const p = productosEditables.find(x => x.id === id);
  if (!p) return;
  p.activo = !p.activo;
  guardarProductos(productosEditables);
  renderizarTablaProductos();
  renderDashboard();
  showToast(p.activo ? 'Producto activado' : 'Producto desactivado', 'success');
}

function bindProductModal() {
  const modal = document.getElementById('productModal');
  const closeModal = () => modal.classList.remove('open');

  document.getElementById('addProductBtn').addEventListener('click', () => {
    document.getElementById('productModalTitle').textContent = 'Agregar Producto';
    document.getElementById('editProductId').value = '';
    ['prod-nombre','prod-subtitulo','prod-descripcion','prod-descripcion_larga','prod-precio','prod-categoria','prod-emoji','prod-imagen_url','prod-especificaciones'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('prod-stock').value = '-1';
    document.getElementById('prod-emoji').value = '🍸';
    renderBotanicosList([]);
    renderProcesoStepsList([]);
    modal.classList.add('open');
  });

  document.getElementById('cancelProductBtn').addEventListener('click', closeModal);
  document.getElementById('closeProductModalBtn').addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

  document.getElementById('saveProductBtn').addEventListener('click', () => {
    const botanicos = getBotanicosFromForm();
    const proceso_steps = getProcesoStepsFromForm();

    const specsRaw = document.getElementById('prod-especificaciones').value.trim();
    const especificaciones = specsRaw ? specsRaw.split('\n').map(line => {
      const sep = line.indexOf(':');
      if (sep < 1) return null;
      return { label: line.slice(0, sep).trim(), value: line.slice(sep + 1).trim() };
    }).filter(Boolean) : [];

    const data = {
      nombre: document.getElementById('prod-nombre').value.trim(),
      subtitulo: document.getElementById('prod-subtitulo').value.trim(),
      descripcion: document.getElementById('prod-descripcion').value.trim(),
      descripcion_larga: document.getElementById('prod-descripcion_larga').value.trim(),
      precio: Number(document.getElementById('prod-precio').value) || 0,
      categoria: document.getElementById('prod-categoria').value.trim(),
      stock: Number(document.getElementById('prod-stock').value) || -1,
      emoji: document.getElementById('prod-emoji').value.trim() || '🍸',
      imagen_url: document.getElementById('prod-imagen_url').value.trim() || '',
      especificaciones,
      botanicos,
      proceso_steps,
      activo: true,
    };
    if (!data.nombre) { showToast('El nombre es obligatorio', 'error'); return; }
    if (data.precio <= 0) { showToast('El precio debe ser mayor a 0', 'error'); return; }

    const editId = document.getElementById('editProductId').value;
    if (editId) {
      const idx = productosEditables.findIndex(p => p.id === Number(editId));
      if (idx >= 0) {
        productosEditables[idx] = { ...productosEditables[idx], ...data, id: Number(editId) };
      }
    } else {
      const maxId = productosEditables.reduce((m, p) => Math.max(m, p.id), 0);
      productosEditables.push({ id: maxId + 1, ...data });
    }

    guardarProductos(productosEditables);
    closeModal();
    renderizarTablaProductos();
    renderDashboard();
    showToast(editId ? 'Producto actualizado' : 'Producto agregado', 'success');
  });
}

function bindJsonActions() {
  document.getElementById('exportJsonBtn').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(productosEditables, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'vertice-productos.json'; a.click();
    URL.revokeObjectURL(url);
    showToast('JSON exportado', 'success');
  });

  document.getElementById('importJsonBtn').addEventListener('click', () => {
    document.getElementById('jsonFileInput').click();
  });

  document.getElementById('jsonFileInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!Array.isArray(data)) throw new Error('Formato inválido');
        productosEditables = data;
        guardarProductos(productosEditables);
        renderizarTablaProductos();
        renderDashboard();
        showToast('Productos importados correctamente', 'success');
      } catch (err) {
        showToast('Error al importar: ' + err.message, 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  });

  document.getElementById('exportAllBtn').addEventListener('click', () => {
    const data = {
      productos: productosEditables,
      config: (() => { try { return JSON.parse(localStorage.getItem('vertice-admin-config') || '{}'); } catch(e) { return {}; } })(),
      orderStatuses,
      pedidos: (() => { try { return JSON.parse(localStorage.getItem('vertice-pedidos') || '[]'); } catch(e) { return []; } })(),
      exportDate: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'vertice-backup.json'; a.click();
    URL.revokeObjectURL(url);
    showToast('Backup exportado', 'success');
  });

  document.getElementById('importAllBtn').addEventListener('click', () => {
    document.getElementById('importAllInput').click();
  });

  document.getElementById('importAllInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (data.productos && Array.isArray(data.productos)) {
          productosEditables = data.productos;
          guardarProductos(productosEditables);
        }
        if (data.pedidos && Array.isArray(data.pedidos)) {
          localStorage.setItem('vertice-pedidos', JSON.stringify(data.pedidos));
        }
        if (data.config && typeof data.config === 'object') {
          localStorage.setItem('vertice-admin-config', JSON.stringify(data.config));
        }
        if (data.orderStatuses && Array.isArray(data.orderStatuses)) {
          orderStatuses = data.orderStatuses;
          persistOrderStatuses();
        }
        cargarProductos();
        cargarPedidos();
        cargarConfig();
        renderDashboard();
        showToast('Datos importados correctamente', 'success');
      } catch (err) {
        showToast('Error al importar: ' + err.message, 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  });

  document.getElementById('resetAllBtn').addEventListener('click', () => {
    showConfirm('🗑️ Resetear datos', '¿Estás seguro? Se borrarán todos los productos, pedidos y configuración. Esta acción no se puede deshacer.', () => {
      localStorage.removeItem('vertice-productos');
      localStorage.removeItem('vertice-pedidos');
      localStorage.removeItem('vertice-admin-config');
      localStorage.removeItem('vertice-order-statuses');
      orderStatuses = JSON.parse(JSON.stringify(DEFAULT_STATUSES));
      cargarProductos();
      cargarPedidos();
      cargarConfig();
      renderDashboard();
      showToast('Datos reseteados', 'info');
    });
  });
}

function cargarPedidos() {
  const tbody = document.getElementById('orderTableBody');
  let pedidos = [];
  try { pedidos = JSON.parse(localStorage.getItem('vertice-pedidos') || '[]'); } catch (e) {}

  const searchTerm = (document.getElementById('orderSearch').value || '').toLowerCase();
  const statusFilter = document.getElementById('orderStatusFilter').value;

  let filtered = pedidos;
  if (searchTerm) {
    filtered = filtered.filter(o =>
      (o.id || '').toLowerCase().includes(searchTerm) ||
      (o.nombre || '').toLowerCase().includes(searchTerm) ||
      (o.telefono || '').toLowerCase().includes(searchTerm)
    );
  }
  if (statusFilter) {
    filtered = filtered.filter(o => (o.estado || 'Pendiente') === statusFilter);
  }

  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="8">
      <div class="empty-state">
        <div class="empty-state__icon">${searchTerm || statusFilter ? '🔍' : '📦'}</div>
        <h3>${searchTerm || statusFilter ? 'Sin resultados' : 'No hay pedidos'}</h3>
        <p>${searchTerm || statusFilter ? 'No hay pedidos con esos filtros.' : 'Los pedidos aparecerán aquí cuando los clientes los realicen.'}</p>
      </div>
    </td></tr>`;
    renderDashboard();
    return;
  }

  tbody.innerHTML = filtered.map((o, idx) => {
    const origIdx = pedidos.indexOf(o);
    const items = o.productos || [];
    const itemsStr = items.map(i => `${i.cantidad}× ${i.nombre}`).join(', ');
    const estado = o.estado || 'Pendiente';
    const estadoClass = estado.replace(/\s/g, '');
    const statusObj = orderStatuses.find(s => getStatusName(s) === estado);
    const statusColor = statusObj ? getStatusColor(statusObj) : null;
    const badgeStyle = statusColor ? `style="background:${statusColor}22;color:${statusColor};border-color:${statusColor}55;"` : '';

    return `<tr>
      <td><strong style="font-family:var(--font-heading)">#${esc(o.id)}</strong></td>
      <td style="font-size:12px;color:var(--text-muted);white-space:nowrap;">${esc(o.fecha)}</td>
      <td><strong>${esc(o.nombre)}</strong></td>
      <td style="font-size:12px;"><a href="https://wa.me/${esc(o.telefono)}" target="_blank" style="color:inherit;text-decoration:underline;text-underline-offset:2px;">${esc(o.telefono)}</a></td>
      <td style="max-width:160px;font-size:12px;color:var(--text-secondary);">${esc(itemsStr.length > 70 ? itemsStr.slice(0,67)+'…' : itemsStr)}</td>
      <td><strong style="color:var(--cobre);">${formatearPrecio(o.total)}</strong></td>
      <td><span class="status-badge status-${estadoClass}" ${badgeStyle}>${esc(estado)}</span></td>
      <td>
        <button class="btn btn-sm btn-ghost" onclick="verPedido(${origIdx})" title="Ver detalle">👁️</button>
        <select class="status-select" onchange="cambiarEstadoPedido(${origIdx}, this.value)">
          <option value="">Cambiar</option>
          ${orderStatuses.map(s => '<option value="' + esc(getStatusName(s)) + '"' + (estado === getStatusName(s) ? ' selected' : '') + '>' + esc(getStatusName(s)) + '</option>').join('')}
        </select>
      </td>
    </tr>`;
  }).join('');
  renderDashboard();
}

function verPedido(idx) {
  let pedidos = [];
  try { pedidos = JSON.parse(localStorage.getItem('vertice-pedidos') || '[]'); } catch (e) {}
  const o = pedidos[idx];
  if (!o) return;

  const estado = o.estado || 'Pendiente';
  const statusObj = orderStatuses.find(s => getStatusName(s) === estado);
  const statusColor = statusObj ? getStatusColor(statusObj) : null;
  const badgeStyle = statusColor ? `style="background:${statusColor}22;color:${statusColor};border-color:${statusColor}55;"` : '';

  document.getElementById('orderDetailContent').innerHTML = `
    <div class="order-detail-grid">
      <div class="order-detail-section">
        <h4>Información del pedido</h4>
        <p><strong>ID:</strong> #${esc(o.id)}</p>
        <p><strong>Fecha:</strong> ${esc(o.fecha)}</p>
        <p><strong>Estado:</strong> <span class="status-badge status-${estado.replace(/\s/g,'')}" ${badgeStyle}>${esc(estado)}</span></p>
      </div>
      <div class="order-detail-section">
        <h4>Cliente</h4>
        <p><strong>Nombre:</strong> ${esc(o.nombre)}</p>
        <p><strong>Teléfono:</strong> <a href="https://wa.me/${esc(o.telefono)}" target="_blank" style="color:var(--cobre);">${esc(o.telefono)}</a></p>
        ${o.notas ? '<p><strong>Notas:</strong> ' + esc(o.notas) + '</p>' : ''}
      </div>
      <div class="order-detail-section">
        <h4>Productos</h4>
        ${(o.productos || []).map(i => `
          <div class="order-item-row">
            <span>${esc(i.nombre)} × ${i.cantidad}</span>
            <span style="font-weight:600;">${formatearPrecio(i.subtotal)}</span>
          </div>
        `).join('')}
        <div style="display:flex;justify-content:space-between;padding:10px 0 0;margin-top:8px;border-top:2px solid var(--carbon);font-size:16px;font-weight:700;">
          <span>Total</span>
          <span style="color:var(--cobre)">${formatearPrecio(o.total)}</span>
        </div>
      </div>
    </div>
  `;
  document.getElementById('orderModal').classList.add('open');
}

function cambiarEstadoPedido(idx, estado) {
  if (!estado) return;
  let pedidos = [];
  try { pedidos = JSON.parse(localStorage.getItem('vertice-pedidos') || '[]'); } catch (e) {}
  if (pedidos[idx]) {
    pedidos[idx].estado = estado;
    localStorage.setItem('vertice-pedidos', JSON.stringify(pedidos));
    cargarPedidos();
    showToast('Estado actualizado a ' + estado, 'success');
  }
}

function cargarConfig() {
  try {
    const cfg = JSON.parse(localStorage.getItem('vertice-admin-config') || '{}');
    document.getElementById('cfg-whatsapp').value = cfg.whatsapp || '549XXXXXXXXXX';
    document.getElementById('cfg-delivery').value = cfg.delivery || '';
  } catch (e) {}
  const saved = JSON.parse(localStorage.getItem('vertice-order-statuses') || 'null');
  if (saved && Array.isArray(saved)) orderStatuses = saved;
  renderOrderStatuses();
  refreshStatusDropdowns();
}

function bindConfig() {
  document.getElementById('saveConfigBtn').addEventListener('click', () => {
    const cfg = {
      whatsapp: document.getElementById('cfg-whatsapp').value.trim(),
      delivery: document.getElementById('cfg-delivery').value.trim(),
    };
    localStorage.setItem('vertice-admin-config', JSON.stringify(cfg));
    persistOrderStatuses();
    refreshStatusDropdowns();
    showToast('Configuración guardada', 'success');
  });
}

function showConfirm(title, message, onConfirm) {
  document.getElementById('confirmIcon').textContent = '⚠️';
  document.getElementById('confirmTitle').textContent = title;
  document.getElementById('confirmMessage').textContent = message;
  confirmCallback = onConfirm;
  document.getElementById('confirmModal').classList.add('open');
}

function showToast(msg, type) {
  type = type || 'info';
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = 'toast toast--' + type;
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  toast.innerHTML = '<span>' + (icons[type] || 'ℹ️') + '</span>' + esc(msg);
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('toast--remove');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function renderBotanicosList(data) {
  const c = document.getElementById('botanicos-container');
  c.innerHTML = '';
  (data || []).forEach((b, i) => c.appendChild(crearBotanicoItem(b, i)));
}

function renderProcesoStepsList(data) {
  const c = document.getElementById('proceso-steps-container');
  c.innerHTML = '';
  (data || []).forEach((s, i) => c.appendChild(crearProcesoStepItem(s, i)));
}

function crearBotanicoItem(b, i) {
  const div = document.createElement('div');
  div.className = 'dynamic-item';
  div.innerHTML = `
    <button class="btn btn-xs btn-danger remove-item-btn" onclick="removeBotanico(${i})">✕</button>
    <div class="dynamic-item__row">
      <input class="botanico-icono" value="${esc(b.icono||'')}" placeholder="🌲" maxlength="6" style="width:50px">
      <input class="botanico-nombre" value="${esc(b.nombre||'')}" placeholder="Nombre del botánico">
    </div>
    <textarea class="botanico-descripcion" rows="2" placeholder="Descripción del aporte...">${esc(b.descripcion||'')}</textarea>
    <label class="dynamic-item__checkbox">
      <input type="checkbox" class="botanico-local" ${b.local ? 'checked' : ''}>
      <span>Local (de Pasteur)</span>
    </label>`;
  return div;
}

function crearProcesoStepItem(s, i) {
  const div = document.createElement('div');
  div.className = 'dynamic-item';
  div.innerHTML = `
    <button class="btn btn-xs btn-danger remove-item-btn" onclick="removeProcesoStep(${i})">✕</button>
    <div class="dynamic-item__row">
      <input class="step-numero" type="number" value="${s.numero||''}" placeholder="1" min="1" style="width:60px">
      <input class="step-titulo" value="${esc(s.titulo||'')}" placeholder="Título del paso">
    </div>
    <textarea class="step-descripcion" rows="2" placeholder="Descripción del paso...">${esc(s.descripcion||'')}</textarea>`;
  return div;
}

function addBotanico() {
  const c = document.getElementById('botanicos-container');
  const i = c.children.length;
  c.appendChild(crearBotanicoItem({}, i));
}

function addProcesoStep() {
  const c = document.getElementById('proceso-steps-container');
  const i = c.children.length;
  c.appendChild(crearProcesoStepItem({}, i));
}

function removeBotanico(index) {
  const items = getBotanicosFromForm();
  items.splice(index, 1);
  renderBotanicosList(items);
}

function removeProcesoStep(index) {
  const items = getProcesoStepsFromForm();
  items.splice(index, 1);
  renderProcesoStepsList(items);
}

function getBotanicosFromForm() {
  const container = document.getElementById('botanicos-container');
  return Array.from(container.querySelectorAll('.dynamic-item')).map(el => ({
    icono: el.querySelector('.botanico-icono').value.trim(),
    nombre: el.querySelector('.botanico-nombre').value.trim(),
    descripcion: el.querySelector('.botanico-descripcion').value.trim(),
    local: el.querySelector('.botanico-local') ? el.querySelector('.botanico-local').checked : false,
  })).filter(b => b.nombre || b.icono);
}

function getProcesoStepsFromForm() {
  const container = document.getElementById('proceso-steps-container');
  return Array.from(container.querySelectorAll('.dynamic-item')).map(el => ({
    numero: Number(el.querySelector('.step-numero').value) || (Array.from(el.parentNode.children).indexOf(el) + 1),
    titulo: el.querySelector('.step-titulo').value.trim(),
    descripcion: el.querySelector('.step-descripcion').value.trim(),
  })).filter(s => s.titulo);
}
