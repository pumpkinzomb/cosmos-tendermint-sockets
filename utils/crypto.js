export function getRandomValues(values) {
  return getRandomValuesInsecure(values);
}

export function getRandomValuesInsecure(values) {
  // Write random bytes to the given TypedArray's underlying ArrayBuffer
  const byteView = new Uint8Array(
    values.buffer,
    values.byteOffset,
    values.byteLength
  );
  for (let i = 0; i < byteView.length; i++) {
    // The range of Math.random() is [0, 1) and the ToUint8 abstract operation rounds down
    byteView[i] = Math.random() * 256;
  }
  return values;
}
