import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyDf-HVPpDo1_L-5EhxakQZmdZ-0pnU0TuI",
  authDomain: "rumakidsweb.firebaseapp.com",
  projectId: "rumakidsweb",
  storageBucket: "rumakidsweb.appspot.com",
  messagingSenderId: "648272882666",
  appId: "1:648272882666:web:9df19c0c8bc083e766a093",
  measurementId: "G-HE37FMJS6E"
};

const app = getApps().length === 0
  ? initializeApp(firebaseConfig)
  : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const productosRef = collection(db, "productos");

const ALLOWED_USERS = ["admin@rumakids.com.ar", "juanmartinez89@gmail.com"];
const loginContainer = document.getElementById("login-container");
const adminPanel = document.getElementById("admin-panel");
const tabla = document.getElementById("tabla-productos");

let productosCache = [];

function filtrarProductosPorBusqueda(texto) {
  const normalizado = texto.trim().toLowerCase();
  if (!normalizado) {
    renderizarTabla(productosCache);
  } else {
    const filtrados = productosCache.filter(p =>
      p.nombre?.toLowerCase().includes(normalizado)
    );
    renderizarTabla(filtrados);
  }
}



onAuthStateChanged(auth, async (user) => {
  if (user && ALLOWED_USERS.includes(user.email)) {
    loginContainer.style.display = "none";
    adminPanel.style.display = "block";
    await cargarProductos();
  } else {
    loginContainer.style.display = "block";
    adminPanel.style.display = "none";
  }
});
console.log("admin.js cargado");
window.login = () => {
  const email = document.getElementById("email").value;
  const pass = document.getElementById("password").value;
  signInWithEmailAndPassword(auth, email, pass).catch(err => alert("Error de login: " + err.message));
};

window.logout = () => signOut(auth);

async function cargarProductos() {
  const snapshot = await getDocs(productosRef);
  productosCache = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
  filtrarProductosPorBusqueda(document.getElementById("buscador")?.value || "");
}



function renderizarTabla(lista) {
  tabla.innerHTML = "";

  lista.forEach(p => {
    const id = p.id;
    const tr = document.createElement("tr");
    const fecha = p.timestamp?.seconds ? new Date(p.timestamp.seconds * 1000).toLocaleDateString("es-AR") : "";


    tr.innerHTML = `
      <td data-label="Nombre"><input class="form-control nombre" value="${p.nombre}"></td>
      <td data-label="Precio" class="precio-columna"><input type="number" class="form-control precio" value="${p.precio}"></td>
      <td data-label="Imágenes" class="imagenes-col"></td>
      <td class="stock-col"></td>
      <td data-label="Carrusel"><input type="checkbox" class="form-check-input carrusel-checkbox" ${p.carrusel ? "checked" : ""}></td>
      <td data-label="Fecha">${fecha}</td>
      <td class="acciones-columna"><button class="btn btn-danger btn-sm borrar-btn">Eliminar producto</button></td>
    `;

    // Nombre y precio
    tr.querySelector(".nombre").addEventListener("change", e =>
      editar(id, "nombre", e.target.value)
    );
    tr.querySelector(".precio").addEventListener("change", e =>
      editar(id, "precio", parseFloat(e.target.value))
    );

    // Carrusel
    const carruselCheckbox = tr.querySelector(".carrusel-checkbox");
    carruselCheckbox.addEventListener("change", async (e) => {
      await editar(id, "carrusel", e.target.checked);
    });

    // Stock
    const stockCol = tr.querySelector(".stock-col");
    stockCol.classList.add("stock-display");

    ["4", "6", "8", "10", "12", "14"].forEach(talle => {
      const cantidad = p.stock?.[talle] ?? 0;

      const box = document.createElement("div");
      box.className = "stock-box";

      const label = document.createElement("label");
      label.textContent = `T${talle}`;

      const input = document.createElement("input");
      input.type = "number";
      input.min = 0;
      input.value = cantidad;
      input.dataset.talle = talle;
      input.className = "form-control form-control-sm";
      if (cantidad === 0) {
        input.classList.add("bg-danger-subtle", "text-danger");
      }

      input.addEventListener("change", e => {
        const nuevo = parseInt(e.target.value);
        editarStock(id, talle, nuevo);
      });

      box.appendChild(label);
      box.appendChild(input);
      stockCol.appendChild(box);
    });


    tr.querySelectorAll(".stock-input").forEach(input => {
      input.addEventListener("change", e => {
        const talle = e.target.dataset.talle;
        const valor = parseInt(e.target.value);
        editarStock(id, talle, valor);
      });
    });

    // Imágenes
    const imagenesCol = tr.querySelector(".imagenes-col");
    const previewContainer = document.createElement("div");
    previewContainer.className = "d-flex flex-wrap gap-2 mb-2";

    (p.imagenes || []).forEach(url => {
      const img = document.createElement("img");
      img.src = url;
      img.className = "img-thumbnail";
      img.style.width = "100px";
      img.style.height = "100px";
      img.style.objectFit = "cover";
      previewContainer.appendChild(img);
    });

    imagenesCol.appendChild(previewContainer);

    const textarea = document.createElement("textarea");
    textarea.className = "form-control mb-2";
    textarea.rows = 4;
    textarea.value = (p.imagenes || []).join('\n');
    imagenesCol.appendChild(textarea);

    const btnGuardar = document.createElement("button");
    btnGuardar.textContent = "Guardar imágenes";
    btnGuardar.className = "btn btn-sm btn-success";

    btnGuardar.addEventListener("click", async () => {
      const nuevasUrls = textarea.value
        .split('\n')
        .map(u => u.trim())
        .filter(u => u.startsWith("http"));

      await updateDoc(doc(db, "productos", id), { imagenes: nuevasUrls });

      const producto = productosCache.find(p => p.id === id);
      if (producto) producto.imagenes = nuevasUrls;

      alert("Imágenes actualizadas");
      cargarProductos();
    });

    imagenesCol.appendChild(btnGuardar);

    // Borrar
    tr.querySelector(".borrar-btn").addEventListener("click", () => borrar(id));

    tabla.appendChild(tr);
  });
}


window.editar = async (id, campo, valor) => {
  await updateDoc(doc(db, "productos", id), { [campo]: valor });
  const producto = productosCache.find(p => p.id === id);
  if (producto) producto[campo] = valor;
};

window.editarStock = async (id, talle, valor) => {
  if (isNaN(valor)) return;
  const refDoc = doc(db, "productos", id);
  const producto = productosCache.find(p => p.id === id);
  if (!producto) return;

  const nuevoStock = { ...(producto.stock || {}) };
  nuevoStock[talle] = valor;

  await updateDoc(refDoc, { stock: nuevoStock });
  producto.stock = nuevoStock;
};

window.borrar = async (id) => {
  if (confirm("¿Eliminar este producto?")) {
    await deleteDoc(doc(db, "productos", id));
    cargarProductos();
  }
};

async function eliminarImagen(id, url) {
  if (!confirm("¿Eliminar esta imagen?")) return;
  const refDoc = doc(db, "productos", id);
  const producto = productosCache.find(p => p.id === id);
  if (!producto) return;

  const nuevasImagenes = (producto.imagenes || []).filter(u => u !== url);
  await updateDoc(refDoc, { imagenes: nuevasImagenes });
  producto.imagenes = nuevasImagenes;
  cargarProductos();
}

function abrirSubirImagenesModal(id) {
  const inputFile = document.createElement("input");
  inputFile.type = "file";
  inputFile.multiple = true;
  inputFile.accept = "image/*";

  inputFile.onchange = async () => {
    const files = inputFile.files;
    if (files.length === 0) return;

    const productoDoc = doc(db, "productos", id);
    const producto = productosCache.find(p => p.id === id);
    const imagenesActuales = producto?.imagenes || [];

    const urlsSubidas = [];
    for (let file of files) {
      const storageRef = ref(storage, `productos/${Date.now()}_${file.name}`);
      const snap = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snap.ref);
      urlsSubidas.push(url);
    }

    await updateDoc(productoDoc, { imagenes: [...imagenesActuales, ...urlsSubidas] });
    cargarProductos();
  };

  inputFile.click();
}

document.getElementById("form-producto").addEventListener("submit", async (e) => {
  e.preventDefault();

  const btn = document.getElementById("btn-agregar");
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span> Guardando...`;

  const nombre = document.getElementById("nombre").value;
  const precio = parseFloat(document.getElementById("precio").value);
  const talles = ["4", "6", "8", "10", "12", "14"];
  const stock = {};

  talles.forEach(talle => {
    const valor = parseInt(document.getElementById(`stock-${talle}`).value);
    if (!isNaN(valor)) stock[talle] = valor;
  });

  const imagenesURLInput = document.getElementById("imagenes-url");
  const urls = imagenesURLInput.value
    .split(",")
    .map(u => u.trim())
    .filter(u => u.startsWith("http"));

  await addDoc(productosRef, {
    nombre,
    precio,
    imagenes: urls,
    stock,
    carrusel: false,
    timestamp: new Date()
  });

  e.target.reset();
  imagenesURLInput.value = "";
  btn.disabled = false;
  btn.textContent = "Agregar producto";
  cargarProductos();
});



document.getElementById("buscador").addEventListener("input", (e) => {
  filtrarProductosPorBusqueda(e.target.value);
});

window.mostrarPreviewURLs = () => {
  const contenedor = document.getElementById("preview-imagenes");
  const input = document.getElementById("imagenes-url");
  const urls = input.value.split(",").map(u => u.trim()).filter(u => u.startsWith("http"));

  contenedor.innerHTML = "";
  urls.forEach(url => {
    const img = document.createElement("img");
    img.src = url;
    img.style.width = "50px";
    img.style.height = "50px";
    img.style.objectFit = "cover";
    img.classList.add("rounded", "border");
    contenedor.appendChild(img);
  });
};

import { obtenerBanner, actualizarBanner } from './firestore.js';

async function cargarBanner() {
  const datos = await obtenerBanner();
  if (!datos) return;

  const textarea = document.getElementById("banner-mensajes");
  const activo = document.getElementById("banner-activo");

  // Mostrar los mensajes como texto separado por líneas
  textarea.value = Array.isArray(datos.mensajes)
    ? datos.mensajes.join('\n')
    : (datos.contenido || "");

  activo.checked = datos.activo || false;
}

window.guardarBanner = async () => {
  const textarea = document.getElementById("banner-mensajes");
  const activo = document.getElementById("banner-activo");

  const mensajes = textarea.value
    .split('\n')
    .map(m => m.trim())
    .filter(m => m.length > 0); // evitar líneas vacías

  await actualizarBanner({ mensajes, activo: activo.checked });
  alert("Banner actualizado correctamente");
};

// Llamar cuando se carga el admin
onAuthStateChanged(auth, async (user) => {
  if (user && ALLOWED_USERS.includes(user.email)) {
    loginContainer.style.display = "none";
    adminPanel.style.display = "block";
    await cargarProductos();
    await cargarBanner();
  } else {
    loginContainer.style.display = "block";
    adminPanel.style.display = "none";
  }
});

