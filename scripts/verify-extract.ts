import * as ftp from "basic-ftp";

async function verifyExtract() {
    const client = new ftp.Client();
    try {
        await client.access({
            host: "ftp.camquote.cc",
            user: "antigravity@camquote.cc",
            password: "Related123@",
            secure: false
        });

        await client.cd("public_html/.next");
        const list = await client.list();
        const hasBuildId = list.find(f => f.name === "BUILD_ID");
        if (hasBuildId) {
            console.log("✅ BUILD_ID existe! La extracción fue exitosa.");
        } else {
            console.log("❌ BUILD_ID no existe. La extracción puede haber fallado.");
        }
    } catch (err: any) {
        console.error("Error:", err.message);
    } finally {
        client.close();
    }
}

verifyExtract();
