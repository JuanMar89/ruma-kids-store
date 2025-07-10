
import { obtenerProductos } from './firestore.js';

let todosLosProductos = [];

import { obtenerBanner } from './firestore.js';

async function cargarProductos() {
  const contenedor = document.getElementById("productos-container");
  if (!contenedor) return;

  todosLosProductos = await obtenerProductos();
  aplicarFiltros();
}

function aplicarFiltros() {
  let lista = [...todosLosProductos];
  const texto = document.getElementById("buscador-productos").value.trim().toLowerCase();
  const orden = document.getElementById("ordenar-por").value;
  const botonLimpiar = document.getElementById("btn-limpiar-busqueda");

  if (botonLimpiar) {
    if (texto || orden !== "recientes") {
      botonLimpiar.style.display = "inline-block";
    } else {
      botonLimpiar.style.display = "none";
    }
  }

  if (texto) lista = lista.filter(p => p.nombre?.toLowerCase().includes(texto));

  switch (orden) {
    case "precio_asc": lista.sort((a, b) => a.precio - b.precio); break;
    case "precio_desc": lista.sort((a, b) => b.precio - a.precio); break;
    case "recientes":
      lista.sort((a, b) => {
        const stockA = Object.values(a.stock || {}).reduce((sum, val) => sum + val, 0);
        const stockB = Object.values(b.stock || {}).reduce((sum, val) => sum + val, 0);
        return stockB - stockA;
      });
      break;
  }

  renderizarProductos(lista);
  const contadorContainer = document.getElementById("filtros-collapse");
  if (contadorContainer) {
    const contador = document.getElementById("contador-resultados") || document.createElement("p");
    contador.id = "contador-resultados";
    contador.textContent = `Mostrando ${lista.length} productos.`;
    contadorContainer.appendChild(contador);
  }


}
const inputBuscador = document.getElementById("buscador-productos");

inputBuscador?.addEventListener("input", () => {
  const sugerencias = document.getElementById("sugerencias");
  const texto = inputBuscador.value.trim().toLowerCase();
  if (sugerencias) sugerencias.innerHTML = "";


  if (!texto || todosLosProductos.length === 0) return;

  const coincidencias = todosLosProductos.filter(p =>
    p.nombre.toLowerCase().includes(texto)
  ).slice(0, 1); // máximo 5 sugerencias

  coincidencias.forEach(p => {
    const li = document.createElement("li");
    li.className = "list-group-item list-group-item-action";
    li.textContent = p.nombre;
    li.addEventListener("click", () => {
      inputBuscador.value = p.nombre;
      sugerencias.innerHTML = "";
      aplicarFiltros();
    });
    sugerencias.appendChild(li);
  });
});


// Ocultar sugerencias al hacer clic fuera
document.addEventListener("click", (e) => {
  const sugerencias = document.getElementById("sugerencias");
  if (sugerencias && !sugerencias.contains(e.target) && e.target !== inputBuscador) {
    sugerencias.innerHTML = "";
  }
});



function limpiarBusqueda() {
  const input = document.getElementById('buscador-productos');
  const sugerencias = document.getElementById('sugerencias');
  const ordenar = document.getElementById('ordenar-por');

  if (input) input.value = '';
  if (sugerencias) sugerencias.innerHTML = '';
  if (ordenar) ordenar.value = 'recientes';

  aplicarFiltros();
}


function renderizarProductos(lista) {
  const contenedor = document.getElementById("productos-container");
  contenedor.innerHTML = "";

  if (lista.length === 0) {
    contenedor.innerHTML = `
      <div class="d-flex justify-content-center align-items-center" style="height: 50vh; width: 100%;">
        <div class="text-center">
          <h4 class="text-muted">😔 No se encontraron productos con ese nombre.</h4>
          <button class="btn btn-outline-secondary mt-3" onclick="limpiarBusqueda()">Limpiar búsqueda</button>
        </div>
      </div>`;
    return;
  }

  lista.forEach(p => {
    const tallesOpciones = Object.entries(p.stock || {})
      .filter(([_, cantidad]) => cantidad > 0)
      .map(([talle, cantidad]) => {
        const aviso = cantidad <= 2 ? " 🔥 Últimos!" : "";
        return `<option value="${talle}">${talle}${aviso}</option>`;
      })
      .join("");

    const imagenes = p.imagenes || [];
    const imagenPrincipal = imagenes[0] || "";
    const agotado = Object.values(p.stock || {}).every(c => c === 0);

    const card = document.createElement("div");
    card.className = "card h-100" + (agotado ? " producto-agotado" : "");

    // Slider interno
    let currentIndex = 0;

    card.innerHTML = `
  <div class="slider-imagen-container position-relative">
    <img src="${imagenPrincipal}" class="multi-img img-fluid slider-imagen" data-imgs='${JSON.stringify(imagenes)}'>

    ${imagenes.length > 1 ? `
      <button class="slider-prev slider-btn">&lt;</button>
      <button class="slider-next slider-btn">&gt;</button>
    ` : ""}
  </div>
  <div class="card-body d-flex flex-column justify-content-between">
    <h3 class="card-title">${p.nombre}</h3>
    <p class="precio">$${p.precio}</p>
    <label for="talle-${p.id}"><strong>Seleccioná talle:</strong></label>
    <select id="talle-${p.id}" class="form-select my-2 talle-select">
      <option value="" disabled selected>Seleccionar talle</option>
      ${Object.entries(p.stock || {})
        .filter(([_, cantidad]) => cantidad > 0)
        .map(([talle, cantidad]) => {
          const aviso = cantidad <= 2 ? " 🔥 Últimos!" : "";
          return `<option value="${talle}">${talle}${aviso}</option>`;
        })
        .join("")}
    </select>
    ${!agotado ? `
      <button class="btn btn-agregar-carrito mt-2"
        data-id="${p.id}" 
        data-nombre="${p.nombre}" 
        data-precio="${p.precio}">
        Agregar al carrito
      </button>` : ""}
  </div>
`;

    if (imagenes.length > 1) {
      const img = card.querySelector(".slider-imagen");
      const btnPrev = card.querySelector(".slider-prev");
      const btnNext = card.querySelector(".slider-next");

      btnPrev?.addEventListener("click", () => {
        currentIndex = (currentIndex - 1 + imagenes.length) % imagenes.length;
        img.src = imagenes[currentIndex];
      });

      btnNext?.addEventListener("click", () => {
        currentIndex = (currentIndex + 1) % imagenes.length;
        img.src = imagenes[currentIndex];
      });
    }

    // ✅ Envolver en columna
    const col = document.createElement("div");
    col.className = "col";
    col.appendChild(card); // ✅ ahora sí la tarjeta va DENTRO de la columna
    contenedor.appendChild(col);
  });

  fadeInCards?.();
  startCarousel?.();
}


["buscador-productos", "ordenar-por"].forEach(id => {
  document.getElementById(id)?.addEventListener("input", aplicarFiltros);
});

window.addEventListener("DOMContentLoaded", () => {
  cargarProductos();
  cargarCarruselDestacados?.();
  mostrarBannerSiActivo(); // Mostrar banner  
  conectarBuscadores();
});

function fadeInCards() {
  const cards = document.querySelectorAll(".card");
  cards.forEach((card, index) => {
    setTimeout(() => {
      card.classList.add("show");
    }, index * 80);
  });
}



async function cargarCarruselDestacados() {
  const carrusel = document.querySelector("#carruselDestacados .carousel-inner");
  if (!carrusel) return;

  const { obtenerCarrusel } = await import('./firestore.js');
  const productos = await obtenerCarrusel();
  const imagenes = productos.flatMap(p => p.imagenes || []).slice(0, 20);

  carrusel.innerHTML = "";
  const indicadores = document.getElementById("indicadores-carrusel");
  indicadores.innerHTML = "";

  for (let i = 0; i < imagenes.length; i += 2) {
    const img1 = imagenes[i];
    const img2 = imagenes[i + 1];

    const slide = document.createElement("div");
    slide.className = `carousel-item ${i === 0 ? "active" : ""}`;
    slide.innerHTML = `
      <div class="row g-0">
        <div class="col-6">
          <img src="${img1}" class="d-block w-100" style="aspect-ratio: 3/4; object-fit: cover;" alt="Carrusel ${i + 1}">
        </div>
        <div class="col-6">
          ${img2 ? `<img src="${img2}" class="d-block w-100" style="aspect-ratio: 3/4; object-fit: cover;" alt="Carrusel ${i + 2}">` : ""}
        </div>
      </div>
    `;
    carrusel.appendChild(slide);
    const boton = document.createElement("button");
    boton.type = "button";
    boton.setAttribute("data-bs-target", "#carruselDestacados");
    boton.setAttribute("data-bs-slide-to", i / 2);
    if (i === 0) boton.classList.add("active");
    indicadores.appendChild(boton);
  }
}
async function mostrarBannerSiActivo() {
  const datos = await obtenerBanner();
  const banner = document.getElementById("banner-promocional");
  const span = document.getElementById("banner-contenido");
  const cerrar = document.getElementById("cerrar-banner");

  if (!datos?.activo || !Array.isArray(datos.mensajes) || !banner || !span) return;

  const mensajes = datos.mensajes.filter(m => m.trim() !== "");
  if (mensajes.length === 0) return;

  let index = 0;

  function mostrarMensaje() {
    span.classList.remove("fade-in");
    void span.offsetWidth; // 🔁 reiniciar animación
    span.textContent = mensajes[index];
    span.classList.add("fade-in");

    index = (index + 1) % mensajes.length;
  }

  // Mostrar banner
  banner.style.display = "block";
  banner.style.transform = "translateY(0)";
  banner.style.opacity = "1";

  mostrarMensaje();
  const intervalo = setInterval(mostrarMensaje, 5000); // 🕔 cada 5 segundos

  // Cerrar banner
  cerrar?.addEventListener("click", () => {
    clearInterval(intervalo);
    banner.style.transform = "translateY(-100%)";
    banner.style.opacity = "0";
    setTimeout(() => {
      banner.style.display = "none";
    }, 500);
  });
}



function startCarousel() {
  const carousel = document.getElementById("fade-carousel");
  if (!carousel) return;

  const cantidadImagenes = 10;
  const imgElements = [];

  for (let i = 1; i <= cantidadImagenes; i++) {
    const img = document.createElement("img");
    img.src = `img/carru_${i}.jpg`;
    img.alt = `Destacado ${i}`;
    if (i === 1) img.classList.add("active");
    carousel.appendChild(img);
    imgElements.push(img);
  }

  let current = 0;
  let interval;

  const showSlide = (index) => {
    imgElements.forEach((img, i) => {
      img.classList.toggle("active", i === index);
    });
  };

  const nextSlide = () => {
    current = (current + 1) % imgElements.length;
    showSlide(current);
  };

  const prevSlide = () => {
    current = (current - 1 + imgElements.length) % imgElements.length;
    showSlide(current);
  };

  document.getElementById("fade-next")?.addEventListener("click", nextSlide);
  document.getElementById("fade-prev")?.addEventListener("click", prevSlide);

  const startAuto = () => {
    interval = setInterval(nextSlide, 4000);
  };

  const stopAuto = () => {
    clearInterval(interval);
  };

  carousel.parentElement.addEventListener("mouseenter", stopAuto);
  carousel.parentElement.addEventListener("mouseleave", startAuto);

  startAuto();
}




// Lightbox con múltiples imágenes
let currentImgList = [];
let currentImgIndex = 0;

document.addEventListener("click", function (e) {
  if (e.target.matches(".multi-img")) {
    const lightbox = document.getElementById("lightbox");
    const lightboxImg = document.getElementById("lightbox-img");

    currentImgList = JSON.parse(e.target.dataset.imgs || "[]");
    currentImgIndex = 0;

    if (currentImgList.length > 0) {
      lightboxImg.src = currentImgList[currentImgIndex];
      lightbox.style.display = "flex";
    }
  }

  if (e.target.id === "lightbox-next") {
    currentImgIndex = (currentImgIndex + 1) % currentImgList.length;
    document.getElementById("lightbox-img").src = currentImgList[currentImgIndex];
  }

  if (e.target.id === "lightbox-prev") {
    currentImgIndex = (currentImgIndex - 1 + currentImgList.length) % currentImgList.length;
    document.getElementById("lightbox-img").src = currentImgList[currentImgIndex];
  }

  if (e.target.id === "lightbox" || e.target.id === "lightbox-close") {
    document.getElementById("lightbox").style.display = "none";
  }
});


// Navbar collapse
document.querySelectorAll(".navbar-nav a").forEach((link) => {
  link.addEventListener("click", () => {
    const navbarCollapse = document.getElementById("navbarNav");
    if (navbarCollapse.classList.contains("show")) {
      new bootstrap.Collapse(navbarCollapse).toggle();
    }
  });
});

// Navbar scroll efecto
window.addEventListener("scroll", function () {
  const navbar = document.querySelector(".navbar");
  if (window.scrollY > 50) {
    navbar.classList.add("scrolled");
  } else {
    navbar.classList.remove("scrolled");
  }
});

/// Carrito de compras
const carritoItems = document.getElementById("carrito-items");
const carritoTotal = document.getElementById("carrito-total");
const btnFinalizar = document.getElementById("btn-finalizar");
const carritoPanel = document.getElementById("carrito");
const carritoCantidadMobile = document.getElementById("carrito-cantidad-mobile");
const carritoCantidadDesktop = document.getElementById("carrito-cantidad-desktop");
let carrito = JSON.parse(localStorage.getItem("carrito") || "{}");
renderizarCarrito();


document.getElementById("carrito-btn")?.addEventListener("click", () => {
  carritoPanel.classList.toggle("abierto");
});
document.getElementById("carrito-btn-desktop")?.addEventListener("click", () => {
  carritoPanel.classList.toggle("abierto");
});


document.addEventListener("click", function (e) {
  const esCarrito = e.target.closest("#carrito");
  const esBoton = e.target.closest("#carrito-btn") || e.target.closest("#carrito-btn-desktop");

  if (!esCarrito && !esBoton) {
    carritoPanel.classList.remove("abierto");
  }

  if (e.target.classList.contains("btn-agregar-carrito")) {
    const nombre = e.target.getAttribute("data-nombre");
    const precio = parseFloat(e.target.getAttribute("data-precio"));
    const select = e.target.parentElement.querySelector(".talle-select");
    const talle = select?.value || "Único";

    const key = `${nombre} (Talle ${talle})`;

    // Buscar el producto original
    const producto = todosLosProductos.find(p => p.nombre === nombre);
    const stockDisponible = producto?.stock?.[talle] ?? 0;
    const cantidadEnCarrito = carrito[key]?.cantidad || 0;

    if (cantidadEnCarrito >= stockDisponible) {
      // Mostrar aviso de error
      const aviso = document.createElement("div");
      aviso.textContent = "❌ Stock insuficiente para agregar más";
      aviso.style.position = "fixed";
      aviso.style.bottom = "20px";
      aviso.style.left = "50%";
      aviso.style.transform = "translateX(-50%)";
      aviso.style.background = "#dc3545";
      aviso.style.color = "white";
      aviso.style.padding = "10px 20px";
      aviso.style.borderRadius = "8px";
      aviso.style.boxShadow = "0 4px 10px rgba(0,0,0,0.2)";
      aviso.style.zIndex = "9999";
      aviso.style.opacity = "0";
      aviso.style.transition = "opacity 0.3s ease";
      document.body.appendChild(aviso);
      requestAnimationFrame(() => aviso.style.opacity = "1");
      setTimeout(() => aviso.remove(), 2500);
      return;
    }

    // Agregar al carrito
    if (!carrito[key]) {
      carrito[key] = { cantidad: 1, precio };
    } else {
      carrito[key].cantidad++;
    }

    renderizarCarrito();
    // ✅ Mostrar mensaje de confirmación
    const aviso = document.createElement("div");
    aviso.textContent = "✔️ Producto agregado al carrito";
    aviso.style.position = "fixed";
    aviso.style.bottom = "20px";
    aviso.style.left = "50%";
    aviso.style.transform = "translateX(-50%)";
    aviso.style.background = "#28a745";
    aviso.style.color = "white";
    aviso.style.padding = "10px 20px";
    aviso.style.borderRadius = "8px";
    aviso.style.boxShadow = "0 4px 10px rgba(0,0,0,0.2)";
    aviso.style.zIndex = "9999";
    aviso.style.opacity = "0";
    aviso.style.transition = "opacity 0.3s ease";
    document.body.appendChild(aviso);
    requestAnimationFrame(() => aviso.style.opacity = "1");
    setTimeout(() => aviso.remove(), 2500);

  }


  if (e.target.classList.contains("btn-sumar")) {
    const nombre = e.target.getAttribute("data-nombre");
    const item = carrito[nombre];
    const baseName = nombre.split(" (Talle ")[0];
    const talle = nombre.match(/\(Talle (.+)\)/)?.[1];
    const producto = todosLosProductos.find(p => p.nombre === baseName);
    const stockDisponible = producto?.stock?.[talle] ?? 0;

    if (item.cantidad < stockDisponible) {
      item.cantidad++;
      renderizarCarrito();
    } else {
      const aviso = document.createElement("div");
      aviso.textContent = "❌ No hay más stock disponible";
      aviso.style.position = "fixed";
      aviso.style.bottom = "20px";
      aviso.style.left = "50%";
      aviso.style.transform = "translateX(-50%)";
      aviso.style.background = "#dc3545";
      aviso.style.color = "white";
      aviso.style.padding = "10px 20px";
      aviso.style.borderRadius = "8px";
      aviso.style.zIndex = "9999";
      aviso.style.opacity = "0";
      aviso.style.transition = "opacity 0.3s ease";
      document.body.appendChild(aviso);
      requestAnimationFrame(() => aviso.style.opacity = "1");
      setTimeout(() => aviso.remove(), 2500);
    }
  }

  if (e.target.classList.contains("btn-restar")) {
    const nombre = e.target.getAttribute("data-nombre");
    if (carrito[nombre].cantidad > 1) {
      carrito[nombre].cantidad--;
    } else {
      delete carrito[nombre];
    }
    renderizarCarrito();
  }

});


function renderizarCarrito() {
  carritoItems.innerHTML = "";
  let total = 0;
  let cantidadTotal = 0;

  for (let nombre in carrito) {
    const item = carrito[nombre];
    const subtotal = item.precio * item.cantidad;
    total += subtotal;
    cantidadTotal += item.cantidad;

    const div = document.createElement("div");
    div.classList.add("mb-2");

    div.innerHTML = `
  <div class="d-flex justify-content-between align-items-center border-bottom pb-2 mb-2">
    <div>
      <div class="fw-semibold">${nombre}</div>
      <div class="text-muted small">Precio unitario: $${item.precio}</div>
      <div class="text-muted small">Subtotal: $${subtotal}</div>
    </div>
    <div class="d-flex flex-column align-items-end">
      <div class="btn-group" role="group">
        <button class="btn btn-sm btn-outline-secondary btn-restar" data-nombre="${nombre}">−</button>
        <span class="px-2 d-flex align-items-center">${item.cantidad}</span>
        <button class="btn btn-sm btn-outline-secondary btn-sumar" data-nombre="${nombre}">+</button>
      </div>
    </div>
  </div>
`;



    carritoItems.appendChild(div);
  }

  carritoTotal.textContent = `Total: $${total}`;
  if (carritoCantidadMobile) carritoCantidadMobile.textContent = cantidadTotal;
  if (carritoCantidadDesktop) carritoCantidadDesktop.textContent = cantidadTotal;

  if (btnFinalizar) {
    if (cantidadTotal === 0) {
      btnFinalizar.href = "#";
      btnFinalizar.classList.add("disabled");
    } else {
      let mensaje = "Hola! Quiero hacer una compra:%0A";
      for (let nombre in carrito) {
        const item = carrito[nombre];
        mensaje += `- ${item.cantidad} x ${nombre} ($${item.precio})%0A`;
      }
      mensaje += `Total: $${total}`;
      btnFinalizar.href = `https://wa.me/5491173618169?text=${mensaje}`;
      btnFinalizar.classList.remove("disabled");
    }
  }
  // Guardar carrito en localStorage
  localStorage.setItem("carrito", JSON.stringify(carrito));

  // Animación en ícono del carrito
  const carritoIcon = document.querySelector("#carrito-btn i, #carrito-btn-desktop i");
  if (carritoIcon) {
    carritoIcon.classList.add("animate-bump");
    setTimeout(() => carritoIcon.classList.remove("animate-bump"), 300);
  }
}

// Formulario de contacto
document.getElementById("formulario-contacto")?.addEventListener("submit", function () {
  alert("¡Gracias por tu mensaje! Estamos enviándolo...");
});

window.addEventListener("DOMContentLoaded", () => {
  ["buscador-productos", "filtro-talle", "filtro-precio-min", "filtro-precio-max", "ordenar-por"].forEach(id => {
    document.getElementById(id)?.addEventListener("input", aplicarFiltros);
  });
});

document.getElementById("cerrar-carrito")?.addEventListener("click", () => {
  carritoPanel.classList.remove("abierto");
});

window.limpiarBusqueda = limpiarBusqueda;
document.getElementById("btn-limpiar-busqueda")?.addEventListener("click", limpiarBusqueda);

window.mostrarBannerSiActivo = mostrarBannerSiActivo;


const inputNavbar = document.getElementById("buscador-navbar");
inputNavbar?.addEventListener("input", () => {
  const inputPrincipal = document.getElementById("buscador-productos");
  if (!inputPrincipal) return;
  inputPrincipal.value = inputNavbar.value;
  aplicarFiltros();
  // Scroll a productos si no está visible
  const seccionProductos = document.getElementById("productos");
  if (seccionProductos) {
    window.scrollTo({
      top: seccionProductos.offsetTop - 80,
      behavior: "smooth"
    });
  }
});
document.getElementById("buscador-navbar")?.addEventListener("input", () => {
  const inputNavbar = document.getElementById("buscador-navbar");
  const inputPrincipal = document.getElementById("buscador-productos");
  if (inputNavbar && inputPrincipal) {
    inputPrincipal.value = inputNavbar.value;
    aplicarFiltros();
    window.scrollTo({ top: document.getElementById("productos").offsetTop - 80, behavior: "smooth" });
  }
});

function conectarBuscadores() {
  const desktopInput = document.getElementById("buscador-navbar");
  const mobileInput = document.getElementById("buscador-navbar-mobile");
  const inputPrincipal = document.getElementById("buscador-productos");
  const navbarCollapse = document.getElementById("navbarNav");

  function aplicarBusqueda(valor) {
    if (inputPrincipal) inputPrincipal.value = valor;

    aplicarFiltros();

    // Esperar a que los productos se hayan renderizado
    setTimeout(() => {
      const seccion = document.getElementById("productos");
      if (seccion) {
        seccion.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 300);
  }

  function cerrarMenuMobile() {
    const toggler = document.querySelector(".navbar-toggler");
    if (navbarCollapse.classList.contains("show") && toggler) {
      toggler.click(); // simula click para cerrar correctamente
    }
  }

  // Escritorio
  desktopInput?.addEventListener("input", () => {
    aplicarBusqueda(desktopInput.value);
  });

  // Mobile
  mobileInput?.addEventListener("input", () => {
    aplicarBusqueda(mobileInput.value);
  });

  mobileInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      aplicarBusqueda(mobileInput.value);
      cerrarMenuMobile();
    }
  });

  mobileInput?.addEventListener("blur", () => {
    cerrarMenuMobile();
  });
}

