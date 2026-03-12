
async function smokeTest() {
  const baseUrl = "http://localhost:3000";
  
  console.log("Testing Login...");
  try {
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@cotizaciones.com", password: "admin123" })
    });
    
    if (loginRes.ok) {
      console.log("✅ Login successful");
      const cookie = loginRes.headers.get("set-cookie");
      
      console.log("Testing Clients API...");
      const clientsRes = await fetch(`${baseUrl}/api/clients`, {
        headers: { "Cookie": cookie || "" }
      });
      if (clientsRes.ok) {
        console.log("✅ Clients API working");
      } else {
        console.log("❌ Clients API failed:", clientsRes.status);
      }
      
      console.log("Testing Products API...");
      const productsRes = await fetch(`${baseUrl}/api/products`, {
        headers: { "Cookie": cookie || "" }
      });
      if (productsRes.ok) {
        console.log("✅ Products API working");
      } else {
        console.log("❌ Products API failed:", productsRes.status);
      }
    } else {
      console.log("❌ Login failed:", loginRes.status);
      const err = await loginRes.json();
      console.log(err);
    }
  } catch (e) {
    console.error("❌ Connection failed:", e);
  }
}

smokeTest();
