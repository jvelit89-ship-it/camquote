import Database from "better-sqlite3";
const db = new Database("quotation.db", { readonly: true });
console.log(db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all());
const products = db.prepare("SELECT * FROM products LIMIT 2").all();
console.log("Products sample:", products);
