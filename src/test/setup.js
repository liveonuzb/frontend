import "@testing-library/jest-dom/vitest";

const hasStorageApi = (storage) =>
  storage &&
  typeof storage.getItem === "function" &&
  typeof storage.setItem === "function" &&
  typeof storage.removeItem === "function" &&
  typeof storage.clear === "function" &&
  typeof storage.key === "function";

const createMemoryStorage = () => {
  const values = new Map();

  return {
    get length() {
      return values.size;
    },
    clear() {
      values.clear();
    },
    getItem(key) {
      const storageKey = String(key);
      return values.has(storageKey) ? values.get(storageKey) : null;
    },
    key(index) {
      return Array.from(values.keys())[index] ?? null;
    },
    removeItem(key) {
      values.delete(String(key));
    },
    setItem(key, value) {
      values.set(String(key), String(value));
    },
  };
};

const ensureStorage = (name) => {
  const current = globalThis.window?.[name] ?? globalThis[name];
  const storage = hasStorageApi(current) ? current : createMemoryStorage();

  Object.defineProperty(globalThis, name, {
    configurable: true,
    value: storage,
  });

  if (globalThis.window) {
    Object.defineProperty(globalThis.window, name, {
      configurable: true,
      value: storage,
    });
  }
};

ensureStorage("localStorage");
ensureStorage("sessionStorage");
