
import { db } from "./src/db";
import { users, tenants, plans } from "./src/db/schema";

async function check() {
  console.log("--- Plans ---");
  const allPlans = db.select().from(plans).all();
  console.log(allPlans);

  console.log("--- Tenants ---");
  const allTenants = db.select().from(tenants).all();
  console.log(allTenants);

  console.log("--- Users ---");
  const allUsers = db.select().from(users).all();
  console.log(allUsers);
}

check().catch(console.error);
