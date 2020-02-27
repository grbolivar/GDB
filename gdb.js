class GDB {

	constructor(name = "default") {
		this.name = name;
		this._storeName = "default";
		this._readonly = "readonly";
		this._readwrite = "readwrite";

		this._db = new Promise((resolve, reject) => {
			const openreq = indexedDB.open(name, 1);
			openreq.onerror = _ => reject(openreq.error);
			openreq.onsuccess = _ => resolve(openreq.result);

			// First time setup: create an empty object store
			openreq.onupgradeneeded = _ => {
				openreq.result.createObjectStore(this._storeName);
			};
		});
	}

	get(key) {
		let req;
		return this._transaction(this._readonly, store => {
			req = store.get(key);
		}).then(_ => req.result);
	}

	set(key, value) {
		return this._transaction(this._readwrite, store => {
			store.put(value, key);
		});
	}

	del(key) {
		return this._transaction(this._readwrite, store => {
			store.delete(key);
		});
	}

	clear() {
		return this._transaction(this._readwrite, store => {
			store.clear();
		});
	}

	keys() { 
		const keys = [];
		return this._transaction(this._readonly, store => {
			(store.openKeyCursor || store.openCursor).call(store).onsuccess = function () {
				let result = this.result;
				if (result) {
					keys.push(result.key);
					result.continue();
				}
			};
		}).then(_ => keys);
	}

	all() {
		let requests = {};
		return this._db.then(db => new Promise((resolve, reject) => {
			this.keys().then(keys => {

				let
					storeName = this._storeName,
					trans = db.transaction(storeName, this._readonly),
					store = trans.objectStore(storeName)
					;

				trans.oncomplete = _ => {
					Object.keys(requests).forEach(k => requests[k] = requests[k].result);
					resolve(requests);
				};

				trans.onabort = trans.onerror = _ => reject(trans.error);

				keys.forEach(key => requests[key] = store.get(key));

			});
		}));
	}

	size() {
		return this.keys().then(keys => keys.length);
	}

	//Inits a transaction on the store
	_transaction(type, callback) {
		return this._db.then(db => new Promise((resolve, reject) => {
			const transaction = db.transaction(this._storeName, type);
			transaction.oncomplete = _ => resolve();
			transaction.onabort = transaction.onerror = _ => reject(transaction.error);
			callback(transaction.objectStore(this._storeName));
		}));
	}

};