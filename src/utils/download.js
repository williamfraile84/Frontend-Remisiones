/**
 * Dispara la descarga en navegador de un Blob binario (PDF / Excel) de forma segura.
 */
export const downloadBlob = (blobData, filename, mimeType) => {
  const blob = new Blob([blobData], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};
