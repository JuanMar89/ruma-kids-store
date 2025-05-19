window.onload = function () {
  fetch("productos.html")
    .then(res => res.text())
    .then(html => {
      const container = document.getElementById("productos-container");
      container.innerHTML = html;
      document.getElementById('loading').style.display = 'none'; // Ocultar cargando

      // Esperar a que al menos una imagen esté cargada antes de iniciar el carrusel
      const checkImagesReady = setInterval(() => {
        const productImages = container.querySelectorAll(".card img");
        if (productImages.length > 0) {
          clearInterval(checkImagesReady);
          startCarousel(productImages);
        }
      }, 100);
    });
};

function startCarousel() {
  const images = document.querySelectorAll(".card img");
  const track = document.getElementById("carousel-track");

  if (!track || images.length === 0) return;

  track.innerHTML = "";

  for (let i = 0; i < 2; i++) {
    images.forEach(img => {
      const clone = document.createElement("img");
      clone.src = img.src;
      clone.alt = img.alt || "";
      clone.loading = "lazy"; // optimizar imágenes
      track.appendChild(clone);
    });
  }
}




function toggleMenu() {
  document.getElementById("mainNav").classList.toggle("active");
}


/* Lightbox con botón cierre */
document.addEventListener('click', function(e) {
  if (e.target.matches('.card img')) {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    lightboxImg.src = e.target.src;
    lightbox.style.display = 'flex';
  }

  if (e.target.matches('#lightbox, #lightbox img, .lightbox::after')) {
    document.getElementById('lightbox').style.display = 'none';
  }
});

// Fade-in en tarjetas cuando se cargan
function fadeInCards() {
  const cards = document.querySelectorAll('.card');
  cards.forEach((card, index) => {
    setTimeout(() => {
      card.classList.add('show');
    }, index * 150); // pequeño delay entre cada tarjeta
  });
}

// Llamarlo después de cargar los productos
window.onload = function () {
  fetch("productos.html")
    .then(res => res.text())
    .then(html => {
      const container = document.getElementById("productos-container");
      container.innerHTML = html;
      document.getElementById('loading').style.display = 'none';
      fadeInCards(); // 👈 Agregamos aquí

      const checkImagesReady = setInterval(() => {
        const productImages = container.querySelectorAll(".card img");
        if (productImages.length > 0) {
          clearInterval(checkImagesReady);
          startCarousel(productImages);
        }
      }, 100);
    });
};

// Cerrar menú responsive al hacer click en un enlace
document.querySelectorAll('.navbar-nav a').forEach(link => {
  link.addEventListener('click', () => {
    const navbarCollapse = document.getElementById('navbarNav');
    if (navbarCollapse.classList.contains('show')) {
      new bootstrap.Collapse(navbarCollapse).toggle();
    }
  });
});


window.addEventListener('scroll', function() {
  const navbar = document.querySelector('.navbar');
  if (window.scrollY > 50) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
});
