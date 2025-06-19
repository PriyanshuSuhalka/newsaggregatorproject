import inquirer from "inquirer";
import axios from "axios";

const BASE_URL = "http://localhost:8000";

function showWelcome(): void {
  console.clear();
  console.log(`
  
   Welcome to the News Aggregator application.               
   Please choose the options below.                          
                                                             
     1. Login                                                 
     2. Sign up                                               
     3. Exit                                                  
  `);
}

async function main(): Promise<void> {
  while (true) {
    showWelcome();

    const { choice } = await inquirer.prompt([
      {
        type: "input",
        name: "choice",
        message: "Enter your choice (1-3):",
        validate: (input: string) => {
          return ["1", "2", "3"].includes(input)
            ? true
            : "Please enter 1, 2, or 3";
        },
      },
    ]);

    switch (choice) {
      case "1":
        await handleLogin();
        break;
      case "2":
        await handleSignup();
        break;
      case "3":
        console.log("Goodbye!");
        return;
    }

    await pause();
  }
}

async function handleSignup(): Promise<void> {
  const { email, password, name } = await inquirer.prompt([
    { type: "input", name: "email", message: "Enter your email:" },
    { type: "password", name: "password", message: "Enter your password:" },
    { type: "input", name: "name", message: "Enter your name:" },
  ]);

  try {
    const res = await axios.post(`${BASE_URL}/auth/signup`, {
      email,
      password,
      name,
    });
    console.log("Signup successful:", res.data);
  } catch (error: any) {
    logError("Signup", error);
  }
}

async function handleLogin(): Promise<void> {
  const { email, password } = await inquirer.prompt([
    { type: "input", name: "email", message: "Enter your email:" },
    { type: "password", name: "password", message: "Enter your password:" },
  ]);

  try {
    const res = await axios.post(`${BASE_URL}/auth/login`, {
      email,
      password,
    });
    console.log(res.data.message);
  } catch (error: any) {
    logError("Login", error);
  }
}

function logError(action: string, error: any): void {
  const message = error.response?.data?.message || error.message;
  console.log(`${action} failed: ${message}`);
}

async function pause(): Promise<void> {
  await inquirer.prompt([
    { type: "input", name: "pause", message: "Press Enter to continue..." },
  ]);
}

main();
