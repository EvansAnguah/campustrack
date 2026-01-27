import { storage } from "../server/storage";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import inquirer from "inquirer";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString("hex")}.${salt}`;
}

async function main() {
    console.log("🎓 Add New Lecturer");
    console.log("-------------------");

    const answers = await inquirer.prompt([
        {
            type: "input",
            name: "name",
            message: "Full Name:",
            validate: (input) => input.trim() !== "" || "Name is required",
        },
        {
            type: "input",
            name: "username",
            message: "Username:",
            validate: (input) => input.trim() !== "" || "Username is required",
        },
        {
            type: "password",
            name: "password",
            message: "Password:",
            mask: "*",
            validate: (input) => input.length >= 6 || "Password must be at least 6 characters",
        },
    ]);

    try {
        const existing = await storage.getLecturerByUsername(answers.username);
        if (existing) {
            console.error(`\n❌ Error: Username '${answers.username}' already exists.`);
            process.exit(1);
        }

        console.log("\n🔒 Hashing password...");
        const hashedPassword = await hashPassword(answers.password);

        console.log("💾 Saving to database...");
        const lecturer = await storage.createLecturer({
            name: answers.name,
            username: answers.username,
            password: hashedPassword,
        });

        console.log(`\n✅ Success! Lecturer '${lecturer.name}' added with ID: ${lecturer.id}`);
        console.log("You can now log in at the dashboard.");

        process.exit(0);
    } catch (err) {
        console.error("\n❌ Failed to create lecturer:", err);
        process.exit(1);
    }
}

main();
