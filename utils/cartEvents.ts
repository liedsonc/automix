type Listener = () => void;

class CartEventEmitter {
  private listeners: Set<Listener> = new Set();

  subscribe(callback: Listener) {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  emit() {
    this.listeners.forEach(callback => callback());
  }
}

export const cartEventEmitter = new CartEventEmitter();
