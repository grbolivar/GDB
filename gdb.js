class GDB {

	constructor(namespace = 'default') {
		this.namespace = namespace;
		this._store = "default";

		this._dbp = new Promise((resolve, reject) => {
			const openreq = indexedDB.open(namespace, 1);
			openreq.onerror = () => reject(openreq.error);
			openreq.onsuccess = () => resolve(openreq.result);

			// First time setup: create an empty object store
			openreq.onupgradeneeded = () => {
				openreq.result.createObjectStore(this._store);
			};
		});
	}

	get(key) {
		let req;
		return this._withIDBStore(GDB.R, store => {
			req = store.get(key);
		}).then(() => req.result);
	}

	set(key, value) {
		return this._withIDBStore(GDB.W, store => {
			store.put(value, key);
		});
	}

	del(key) {
		return this._withIDBStore(GDB.W, store => {
			store.delete(key);
		});
	}

	clear() {
		return this._withIDBStore(GDB.W, store => {
			store.clear();
		});
	}

	keys() {
		const keys = [];
		return this._withIDBStore(GDB.R, store => {
			// This would be store.getAllKeys(), but it isn't supported by Edge or Safari.
			// And openKeyCursor isn't supported by Safari.
			(store.openKeyCursor || store.openCursor).call(store).onsuccess = function () {
				if (!this.result)
					return;
				keys.push(this.result.key);
				this.result.continue();
			};
		}).then(() => keys);
	}

	all() {
		return this._dbp.then(db => new Promise((resolve, reject) => {
			this.keys().then(keys => {

				let trans = db.transaction(this._store, GDB.R);
				let store = trans.objectStore(this._store);
				let reqs = {};

				trans.oncomplete = _ => {
					Object.keys(reqs).forEach(k => reqs[k] = reqs[k].result);
					resolve(reqs);
				};

				trans.onabort = trans.onerror = () => reject(trans.error);

				keys.forEach(key => reqs[key] = store.get(key));

			});
		}));
	}

	size() {
		return this.keys().then(keys => keys.length);
	}

	_withIDBStore(type, callback) {
		return this._dbp.then(db => new Promise((resolve, reject) => {
			const transaction = db.transaction(this._store, type);
			transaction.oncomplete = () => resolve();
			transaction.onabort = transaction.onerror = () => reject(transaction.error);
			callback(transaction.objectStore(this._store));
		}));
	}

};
GDB.R = "readonly";
GDB.W = "readwrite";