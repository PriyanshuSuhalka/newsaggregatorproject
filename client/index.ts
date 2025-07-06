import inquirer from "inquirer";
import axios from "axios";
import { showUserMenu } from "./user-menu";
import { showAdminMenu } from "./admin-menu"; // Add this at the top

const BASE_URL = "http://localhost:8000";
let currentUserEmail: string | null = null;
let currentUserRole: "admin" | "user" | null = null;

async function mainMenu(): Promise<void> {
  console.log("\n--- Main Menu ---");
  const { choice } = await inquirer.prompt({
    type: "input",
    name: "choice",
    message: `Select option:\n1. Signup\n2. Login\n3. Exit\nEnter your choice:`,
    validate: (input) =>
      ["1", "2", "3"].includes(input) || "Enter a valid number",
  });

  switch (choice) {
    case "1":
      await handleSignup();
      break;
    case "2":
      await handleLogin();
      break;
    case "3":
      console.log("Goodbye!");
      process.exit(0);
  }

  await mainMenu();
}

async function handleSignup() {
  const { email, password, name } = await inquirer.prompt([
    { type: "input", name: "email", message: "Email:" },
    { type: "password", name: "password", message: "Password:" },
    { type: "input", name: "name", message: "Name:" },
  ]);

  try {
    const res = await axios.post(`${BASE_URL}/auth/signup`, {
      email,
      password,
      name,
    });
    console.log("Signup successful:", res.data);
  } catch (error: any) {
    console.error(
      "Signup failed:",
      error.response?.data?.message || error.message
    );
  }
}

async function handleLogin() {
  const { email, password } = await inquirer.prompt([
    { type: "input", name: "email", message: "Email:" },
    { type: "password", name: "password", message: "Password:" },
  ]);

  try {
    const res = await axios.post(`${BASE_URL}/auth/login`, {
      email,
      password,
    });

    console.log(res.data.message);
    currentUserEmail = email;
    currentUserRole = res.data.role;

    if (currentUserRole === "admin") {
      console.log("Admin login successful");
      await showAdminMenu(email);
      return;
    } else {
      console.log("User login successful");
      await showUserMenu(res.data.name || email); 
      return;
    }
  } catch (error: any) {
    console.error(
      "Login failed:",
      error.response?.data?.message || error.message
    );
  }
}

async function adminMenu() {
  while (true) {
    const { choice } = await inquirer.prompt({
      type: "input",
      name: "choice",
      message: `\n--- Admin Menu ---\n1. View external servers and status\n2. View server details\n3. Edit server\n4. Add news category\n5. Logout\nEnter your choice:`,
      validate: (input) =>
        ["1", "2", "3", "4", "5"].includes(input) || "Enter a valid number",
    });

    switch (choice) {
      case "1":
        await viewExternalServers();
        break;
      case "2":
        await viewServerDetails();
        break;
      case "3":
        await updateServer();
        break;
      case "4":
        await addCategory();
        break;
      case "5":
        console.log("Logged out.");
        currentUserEmail = null;
        currentUserRole = null;
        return;
    }
  }
}

async function viewExternalServers() {
  try {
    const res = await axios.get(`${BASE_URL}/external-servers`);
    res.data.forEach((server: any) => {
      console.log(server.display);
    });
  } catch (error: any) {
    console.error("Error:", error.response?.data?.message || error.message);
  }
}

async function viewServerDetails() {
  try {
    const res = await axios.get(`${BASE_URL}/external-servers`);
    const servers = res.data;

    console.log("\nList of external server details:");
    servers.forEach((server: any, index: number) => {
      console.log("Server Response:", server); // Debug log
      console.log(
        `${index + 1}. ${server.name} - ${
          server.key || server.APIKey || "<missing>"
        }`
      );
    });
  } catch (error: any) {
    console.error("Error:", error.response?.data?.message || error.message);
  }
}

async function updateServer() {
  const { id, key } = await inquirer.prompt([
    { type: "input", name: "id", message: "Enter external server ID:" },
    { type: "input", name: "key", message: "Enter the updated API key:" },
  ]);

  try {
    const res = await axios.put(`${BASE_URL}/external-servers/${id}`, { key });
    console.log("API key updated successfully:", res.data);
  } catch (error: any) {
    console.error(
      "Update failed:",
      error.response?.data?.message || error.message
    );
  }
}

async function addCategory() {
  const { categoryName } = await inquirer.prompt({
    type: "input",
    name: "categoryName",
    message: "Enter new category name:",
  });

  try {
    const res = await axios.post(`${BASE_URL}/categories`, { categoryName });
    console.log("Category added:", res.data);
  } catch (error: any) {
    console.error(
      "Failed to add category:",
      error.response?.data?.message || error.message
    );
  }
}

// Start the program
mainMenu();
