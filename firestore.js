// firestore.js
import { db } from './firebase.js';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Productos
const productosRef = collection(db, "productos");

export async function obtenerProductos() {
  const snapshot = await getDocs(productosRef);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function agregarProducto(producto) {
  await addDoc(productosRef, producto);
}

export async function actualizarProducto(id, data) {
  const ref = doc(db, "productos", id);
  await updateDoc(ref, data);
}

export async function eliminarProducto(id) {
  const ref = doc(db, "productos", id);
  await deleteDoc(ref);
}

export async function obtenerCarrusel() {
  const q = query(productosRef, where("carrusel", "==", true));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Banner
const bannerRef = doc(db, "config", "banner");

export async function obtenerBanner() {
  const snap = await getDoc(doc(db, "config", "banner"));
  if (!snap.exists()) return null;
  return snap.data(); // { mensajes: [], activo }
}

export async function actualizarBanner({ mensajes = [], contenido, activo }) {
  const datos = {
    activo,
    mensajes: Array.isArray(mensajes) && mensajes.length > 0
      ? mensajes
      : contenido
        ? [contenido]
        : []
  };

  await setDoc(bannerRef, datos);
}