const PRODUCTOS = [
  {
    id: 1,
    nombre: 'Vértice Gin Clásico 750ml',
    subtitulo: '42% ABV · 750 ml',
    descripcion: 'Nuestro gin insignia. Destilado en alambique de cobre con botánicos de la plaza de Pasteur.',
    precio: 18000,
    categoria: 'Gin',
    imagen: '🍸',
    stock: -1,
    activo: true,
  },
  {
    id: 2,
    nombre: 'Vértice Gin 375ml',
    subtitulo: '42% ABV · 375 ml',
    descripcion: 'Media botella. Ideal para regalar o probar nuestro gin.',
    precio: 10000,
    categoria: 'Gin',
    imagen: '🥃',
    stock: -1,
    activo: true,
  },
  {
    id: 3,
    nombre: 'Vértice Gin Mini 200ml',
    subtitulo: '42% ABV · 200 ml',
    descripcion: 'Formato degustación. Llevate la experiencia Vértice a donde vayas.',
    precio: 5500,
    categoria: 'Gin',
    imagen: '🫗',
    stock: -1,
    activo: true,
  },
  {
    id: 4,
    nombre: 'Pack Vértice x2',
    subtitulo: '2 botellas de 750 ml',
    descripcion: 'Llevá dos botellas y ahorrá en el envío. Ideal para compartir o regalar.',
    precio: 32000,
    categoria: 'Combos',
    imagen: '🎁',
    stock: -1,
    activo: true,
  },
  {
    id: 5,
    nombre: 'Experiencia Vértice',
    subtitulo: 'Botella + Recetario + Copa',
    descripcion: 'La experiencia completa con recetario exclusivo y copa de cata serigrafiada.',
    precio: 25000,
    categoria: 'Combos',
    imagen: '✨',
    stock: -1,
    activo: true,
  },
];

function obtenerProductos() {
  try {
    const overrides = JSON.parse(localStorage.getItem('vertice-productos') || '[]');
    if (!overrides || overrides.length === 0) return PRODUCTOS;
    return PRODUCTOS.map(p => {
      const o = overrides.find(x => x.id === p.id);
      return o ? { ...p, ...o } : p;
    }).concat(overrides.filter(o => !PRODUCTOS.some(p => p.id === o.id)));
  } catch (e) {
    return PRODUCTOS;
  }
}

function guardarProductos(lista) {
  const data = lista.map(p => ({
    id: p.id, nombre: p.nombre, subtitulo: p.subtitulo,
    descripcion: p.descripcion, precio: p.precio, categoria: p.categoria,
    imagen: p.imagen, stock: p.stock, activo: p.activo,
  }));
  localStorage.setItem('vertice-productos', JSON.stringify(data));
}

function formatearPrecio(n) {
  return '$' + Number(n).toLocaleString('es-AR');
}
