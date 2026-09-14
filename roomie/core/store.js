import { initialState } from '../data/seed.js';

function clone(value) {
  return structuredClone(value);
}

export function createRoomieStore() {
  let state = clone(initialState);
  const listeners = new Set();

  function getState() {
    return state;
  }

  function setState(recipe) {
    const next = clone(state);
    recipe(next);
    state = next;
    listeners.forEach((listener) => listener(state));
    return state;
  }

  function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function reset() {
    state = clone(initialState);
    listeners.forEach((listener) => listener(state));
  }

  return { getState, setState, subscribe, reset };
}

export const store = createRoomieStore();
