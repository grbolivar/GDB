# gdb

Simple Promise-based IndexedDB store based on [idb-keyval](https://github.com/jakearchibald/idb-keyval) with an OOP approach.
 
## Usage

```js
let store = new GDB("storeName");

//Set entry
store.set("key", "value");

//Retrieve entry
store.get("key").then( value => ... );

//Delete entry
store.del("key");

//Retrieve all keys
store.keys().then( keys => ... );

//Retrieve all entries on a {key:value} object
store.all().then( entries => ... );

//Get the size of the store (number of entries)
store.size().then( size => ... )

//Clear entire store
store.clear();
```

## Installing

### Via jsDelivr

```html
<script src="https://cdn.jsdelivr.net/gh/grbolivar/gdb/gdb.min.js"></script>
```