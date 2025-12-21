const safeGet = (storage, key) => {
  try {
    return storage.getItem(key);
  } catch (_error) {
    return null;
  }
};

const safeSet = (storage, key, value) => {
  try {
    storage.setItem(key, value);
  } catch (_error) {
    // swallow
  }
};

export const safeLocalGet = (key) => safeGet(localStorage, key);
export const safeLocalSet = (key, value) => safeSet(localStorage, key, value);
export const safeSessionGet = (key) => safeGet(sessionStorage, key);
export const safeSessionSet = (key, value) => safeSet(sessionStorage, key, value);
