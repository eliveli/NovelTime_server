export default function createId() {
  return new Date().valueOf().toString(36) + Math.random().toString(36).slice(2);
}
