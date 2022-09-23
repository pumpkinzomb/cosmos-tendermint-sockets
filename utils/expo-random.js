export function getRandomBytes(byteCount) {
  assertByteCount(byteCount, "getRandomBytes");
  const validByteCount = Math.floor(byteCount);
  const array = new Uint8Array(validByteCount);
  for (let i = 0; i < validByteCount; i++) {
    array[i] = Math.floor(Math.random() * 256);
  }
  return array;
}
