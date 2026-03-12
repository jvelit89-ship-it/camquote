import { db } from "../src/db";
import { users, tenants, plans } from "../src/db/schema";

async function check() {
    console.log("--- Plans ---");
    const allPlans = await db.select().from(plans);
    console.log(allPlans);

  console.log("--- Tenants ---");
    const allTenants = await db.select().from(tenants);
    console.log(allTenants);

  console.log("--- Users ---");
    const allUsers = await db.select().from(users);
    console.log(allUsers);
}

check().catch(console.error);
