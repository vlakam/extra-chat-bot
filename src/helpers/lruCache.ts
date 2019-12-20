export class LruCache<T> {

    protected values: Map<string, T> = new Map<string, T>();
    protected maxEntries: number = 20;

    constructor({ maxEntries = 20 }) {
        this.maxEntries = maxEntries;
    }

    public has(key: string): boolean {
        return this.values.has(key);
    }

    public get(key: string): T {
        let entry: T;
        if (this.has(key)) {
            entry = this.values.get(key);
            this.values.delete(key);
            this.values.set(key, entry);
        }

        return entry;
    }

    public put(key: string, value: T) {

        if (this.values.size >= this.maxEntries) {
            const keyToDelete = this.values.keys().next().value;
            this.values.delete(keyToDelete);
        }

        this.values.set(key, value);
    }

    public remove(key: string): boolean {
        if (this.has(key)) {
            this.values.delete(key);
            return true;
        }

        return false;
    }

    public reset() {
        this.values = new Map<string, T>();
    }
}

export class TimedLruCache<T> extends LruCache<T> {
    protected timeToLive: number;
    protected refreshTimer: NodeJS.Timeout;

    constructor({ maxEntries = 20, timeToLive = 60 }) {
        super({ maxEntries });
        this.timeToLive = timeToLive;

        this.refreshTimer = setTimeout(() => {
            this.reset();
        }, timeToLive * 1000);
    }

    public reset() {
        super.reset();
        this.refreshTimer.refresh();
    }
}
