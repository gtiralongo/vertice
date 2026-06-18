let productosEditables = [];

document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  cargarProductos();
  cargarPedidos();
  cargarConfig();
  bindProductModal();
  bindConfig();
  bindJsonActions();
});

function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      const tab = document.getElementById('tab-' + btn.dataset.tab);
      if (tab) tab.classList.add('active');
    });
  });
}

function cargarProductos() {
  productosEditables = JSON.parse(JSON.stringify(obtenerProductos()));
  renderizarTablaProductos();
}

function renderizarTablaProductos() {
  const tbody = document.getElementById('productTableBody');
  if (!productosEditables.length) {
    tbody.innerHTML = '<tr><td colspan="7"><div class="empty-state"><p>No hay productos. Agregá el primero.</p></div></td></tr>';
    return;
  }
  tbody.innerHTML = productosEditables.map(p => `
    <tr>
      <td>${p.id}</td>
      <td><strong>${esc(p.nombre)}</strong></td>
      <td>${formatearPrecio(p.precio)}</td>
      <td>${esc(p.categoria)}</td>
      <td>${p.stock === -1 ? '∞' : p.stock}</td>
      <td><span style="color:${p.activo ? 'var(--verde)' : '#B00020'};font-weight:600">${p.activo ? 'Sí' : 'No'}</span></td>
      <td>
        <button class="btn btn-sm btn-outline" onclick="editarProducto(${p.id})">Editar</button>
        <button class="btn btn-sm ${p.activo ? 'btn-danger' : 'btn-success'}" onclick="toggleProducto(${p.id})">${p.activo ? 'Desact.' : 'Activar'}</button>
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
  document.getElementById('prod-precio').value = p.precio || '';
  document.getElementById('prod-categoria').value = p.categoria || '';
  document.getElementById('prod-stock').value = p.stock !== undefined ? p.stock : -1;
  document.getElementById('prod-imagen').value = p.imagen || '🍸';
  document.getElementById('productModal').classList.add('open');
}

function toggleProducto(id) {
  const p = productosEditables.find(x => x.id === id);
  if (!p) return;
  p.activo = !p.activo;
  guardarProductos(productosEditables);
  renderizarTablaProductos();
  showToast(p.activo ? 'Producto activado' : 'Producto desactivado');
}

function bindProductModal() {
  document.getElementById('addProductBtn').addEventListener('click', () => {
    document.getElementById('productModalTitle').textContent = 'Agregar Producto';
    document.getElementById('editProductId').value = '';
    ['prod-nombre','prod-subtitulo','prod-descripcion','prod-precio','prod-categoria','prod-imagen'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('prod-stock').value = '-1';
    document.getElementById('prod-imagen').value = '🍸';
    document.getElementById('productModal').classList.add('open');
  });

  document.getElementById('cancelProductBtn').addEventListener('click', () => {
    document.getElementById('productModal').classList.remove('open');
  });

  document.getElementById('saveProductBtn').addEventListener('click', () => {
    const data = {
      nombre: document.getElementById('prod-nombre').value.trim(),
      subtitulo: document.getElementById('prod-subtitulo').value.trim(),
      descripcion: document.getElementById('prod-descripcion').value.trim(),
      precio: Number(document.getElementById('prod-precio').value) || 0,
      categoria: document.getElementById('prod-categoria').value.trim(),
      stock: Number(document.getElementById('prod-stock').value) || -1,
      imagen: document.getElementById('prod-imagen').value.trim() || '🍸',
      activo: true,
    };
    if (!data.nombre) { showToast('El nombre es obligatorio'); return; }
    if (data.precio <= 0) { showToast('El precio debe ser mayor a 0'); return; }

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
    document.getElementById('productModal').classList.remove('open');
    renderizarTablaProductos();
    showToast(editId ? 'Producto actualizado' : 'Producto agregado');
  });
}

function bindJsonActions() {
  document.getElementById('exportJsonBtn').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(productosEditables, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vertice-productos.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast('JSON exportado');
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
        showToast('Productos importados correctamente');
      } catch (err) {
        showToast('Error al importar: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  });
}

function cargarPedidos() {
  const tbody = document.getElementById('orderTableBody');
  let pedidos = [];
  try { pedidos = JSON.parse(localStorage.getItem('vertice-pedidos') || '[]'); } catch (e) {}

  if (!pedidos.length) {
    tbody.innerHTML = '<tr><td colspan="8"><div class="empty-state"><p>No hay pedidos todavía.</p></div></td></tr>';
    return;
  }

  tbody.innerHTML = pedidos.map((o, idx) => {
    const items = o.productos || [];
    const itemsStr = items.map(i => `${i.cantidad}× ${i.nombre}`).join(', ');
    const estado = o.estado || 'Pendiente';
    const estadoClass = estado.replace(/\s/g, '');

    return `<tr>
      <td><strong>${esc(o.id)}</strong></td>
      <td>${esc(o.fecha)}</td>
      <td>${esc(o.nombre)}</td>
      <td>${esc(o.telefono)}</td>
      <td style="max-width:180px;font-size:11px;">${esc(itemsStr.length > 80 ? itemsStr.slice(0,77)+'...' : itemsStr)}</td>
      <td><strong>${formatearPrecio(o.total)}</strong></td>
      <td><span class="status-badge status-${estadoClass}">${esc(estado)}</span></td>
      <td>
        <button class="btn btn-sm btn-outline" onclick="verPedido(${idx})">Ver</button>
        <select onchange="cambiarEstadoPedido(${idx}, this.value)" style="padding:4px 6px;border-radius:6px;border:1px solid rgba(0,0,0,0.08);font-size:11px;font-family:var(--font-body)">
          <option value="">Estado</option>
          <option value="Pendiente">Pendiente</option>
          <option value="Confirmado">Confirmado</option>
          <option value="En Preparacion">En Preparación</option>
          <option value="Enviado">Enviado</option>
          <option value="Entregado">Entregado</option>
          <option value="Cancelado">Cancelado</option>
        </select>
      </td>
    </tr>`;
  }).join('');
}

function verPedido(idx) {
  let pedidos = [];
  try { pedidos = JSON.parse(localStorage.getItem('vertice-pedidos') || '[]'); } catch (e) {}
  const o = pedidos[idx];
  if (!o) return;

  const items = o.productos || [];
  const itemsHtml = items.map(i =>
    `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid rgba(0,0,0,0.04)">
      <span>${esc(i.nombre)} × ${i.cantidad}</span>
      <span style="font-weight:600">${formatearPrecio(i.subtotal)}</span>
    </div>`
  ).join('');

  document.getElementById('orderDetailContent').innerHTML = `
    <div style="margin-bottom:16px">
      <p><strong>Pedido:</strong> ${esc(o.id)}</p>
      <p><strong>Fecha:</strong> ${esc(o.fecha)}</p>
      <p><strong>Estado:</strong> <span class="status-badge status-${(o.estado||'Pendiente').replace(/\s/g,'')}">${esc(o.estado||'Pendiente')}</span></p>
    </div>
    <div style="margin-bottom:16px">
      <p><strong>Cliente:</strong> ${esc(o.nombre)}</p>
      <p><strong>Teléfono:</strong> ${esc(o.telefono)}</p>
      <p><strong>Dirección:</strong> ${esc(o.direccion)}</p>
      ${o.notas ? '<p><strong>Notas:</strong> '+esc(o.notas)+'</p>' : ''}
    </div>
    <div>
      <p style="font-weight:600;margin-bottom:6px;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-muted)">Productos</p>
      ${itemsHtml}
      <div style="display:flex;justify-content:space-between;padding:8px 0 0;margin-top:4px;border-top:2px solid var(--carbon);font-size:15px;font-weight:700">
        <span>Total</span><span style="color:var(--cobre)">${formatearPrecio(o.total)}</span>
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
    showToast('Estado actualizado');
  }
}

document.getElementById('closeOrderModal').addEventListener('click', () => {
  document.getElementById('orderModal').classList.remove('open');
});

function cargarConfig() {
  try {
    const cfg = JSON.parse(localStorage.getItem('vertice-admin-config') || '{}');
    document.getElementById('cfg-whatsapp').value = cfg.whatsapp || '549XXXXXXXXXX';
    document.getElementById('cfg-delivery').value = cfg.delivery || '';
  } catch (e) {}
}

function bindConfig() {
  document.getElementById('saveConfigBtn').addEventListener('click', () => {
    const cfg = {
      whatsapp: document.getElementById('cfg-whatsapp').value.trim(),
      delivery: document.getElementById('cfg-delivery').value.trim(),
    };
    localStorage.setItem('vertice-admin-config', JSON.stringify(cfg));
    showToast('Configuración guardada');
  });
}

function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => el.classList.remove('show'), 2500);
}
