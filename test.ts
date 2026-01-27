console.log("DB URL exists:", !!process.env.DATABASE_URL);
if (process.env.DATABASE_URL) {
    console.log("DB URL starts with:", process.env.DATABASE_URL.substring(0, 10) + "...");
}
