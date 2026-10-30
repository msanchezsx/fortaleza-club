"use client";

import { useSyncExternalStore } from "react";

// Carrito guardado en el celular del cliente: { idProducto: cantidad }.
export type Carrito = Record<number, number>;

const CLAVE = "fortaleza-carrito";
const VACIO = "{}";
const avisos = new Set<() => void>();

function leer(): string {
  try {
    return localStorage.getItem(CLAVE) ?? VACIO;
  } catch {
    return VACIO;
  }
}

function guardar(carrito: Carrito) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(carrito));
  } catch {
    // Sin almacenamiento (modo privado): el carrito vive solo en esta pantalla.
    memoria = JSON.stringify(carrito);
  }
  avisos.forEach((avisar) => avisar());
}

let memoria: string | null = null;

function suscribir(avisar: () => void) {
  avisos.add(avisar);
  window.addEventListener("storage", avisar);
  return () => {
    avisos.delete(avisar);
    window.removeEventListener("storage", avisar);
  };
}

export function useCarrito() {
  const texto = useSyncExternalStore(
    suscribir,
    () => memoria ?? leer(),
    () => VACIO,
  );
  let carrito: Carrito = {};
  try {
    carrito = JSON.parse(texto) as Carrito;
  } catch {
    carrito = {};
  }

  return {
    carrito,
    piezas: Object.values(carrito).reduce((suma, n) => suma + n, 0),
    poner(id: number, cantidad: number) {
      const nuevo = { ...carrito };
      if (cantidad <= 0) delete nuevo[id];
      else nuevo[id] = Math.min(cantidad, 10);
      guardar(nuevo);
    },
    agregar(id: number, cantidad: number, maximo = 10) {
      guardar({
        ...carrito,
        [id]: Math.min((carrito[id] ?? 0) + cantidad, maximo),
      });
    },
    vaciar() {
      guardar({});
    },
  };
}
