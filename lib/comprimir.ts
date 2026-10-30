// Reduce una foto del celular a JPG de máximo 1080 px y menos de 300 KB.
export const LIMITE_FOTO = 300 * 1024;

export async function comprimirFoto(archivo: File): Promise<Blob> {
  const imagen = await createImageBitmap(archivo, {
    imageOrientation: "from-image",
  });
  let lado = 1080;
  let calidad = 0.82;

  for (let intento = 0; intento < 8; intento++) {
    const escala = Math.min(1, lado / Math.max(imagen.width, imagen.height));
    const lienzo = document.createElement("canvas");
    lienzo.width = Math.round(imagen.width * escala);
    lienzo.height = Math.round(imagen.height * escala);
    lienzo
      .getContext("2d")!
      .drawImage(imagen, 0, 0, lienzo.width, lienzo.height);
    const blob = await new Promise<Blob | null>((ok) =>
      lienzo.toBlob(ok, "image/jpeg", calidad),
    );
    if (blob && blob.size <= LIMITE_FOTO) return blob;
    if (calidad > 0.55) calidad -= 0.1;
    else lado = Math.round(lado * 0.8);
  }
  throw new Error("No pudimos hacer la foto más ligera. Prueba con otra.");
}
