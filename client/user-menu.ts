// user-menu.ts
import axios from "axios";
import inquirer from "inquirer";
import dayjs from "dayjs";

const BASE_URL = "http://localhost:8000";
let userData: { userEmail: string; userID: number };

export async function showUserMenu(userEmail: string) {
  userData = await fetchUserInfo(userEmail);

  while (true) {
    const currentDate = dayjs().format("DD-MMM-YYYY");
    const currentTime = dayjs().format("h:mmA");

    console.log(`\nWelcome to the News Application, ${userEmail}! Date: ${currentDate}`);
    console.log(`Time: ${currentTime}`);
    console.log("Please choose the options below");

    const { choice } = await inquirer.prompt({
      type: "input",
      name: "choice",
      message:
        "1. Headlines\n2. Saved Articles\n3. Search\n4. Notifications\n5. Logout\nEnter your choice:",
      validate: (input) => ["1", "2", "3", "4", "5"].includes(input) || "Enter a valid number (1-5)",
    });

    switch (choice) {
      case "1":
        await showHeadlinesSubMenu(userEmail);
        break;
      case "2":
        await fetchSavedArticles(userEmail, userData.userID);
        break;
      case "3":
        await handleSearch(userEmail);
        break;
      case "5":
        console.log("Logged out.");
        return;
      default:
        console.log("This feature is coming soon.");
    }
  }
}

async function handleSearch(userEmail: string) {
  const { keyword } = await inquirer.prompt({
    type: "input",
    name: "keyword",
    message: "Enter a keyword to search:",
    validate: (val) => val.trim() !== "" || "Keyword cannot be empty",
  });

  try {
    const res = await axios.get(`${BASE_URL}/articles/search`, {
      params: { keyword },
    });

    const articles = res.data;

    if (!articles.length) {
      console.log("\nNo articles found matching your search.\n");
      return;
    }

    console.log(`\n--- Search Results for \"${keyword}\" ---`);
    articles.forEach((a: any) => {
      console.log(`Article ID: ${a.articleID}`);
      console.log(`Title: ${a.articleTitle}`);
      console.log(`Content: ${a.articleContent}`);
      console.log(`Source: ${a.source}`);
      console.log(`URL: ${a.URL}\n`);
    });

    console.log("1. Save an Article\n2. Back\n3. Logout");
    const { action } = await inquirer.prompt({
      type: "input",
      name: "action",
      message: "Enter your choice:",
      validate: (val) => ["1", "2", "3"].includes(val) || "Enter 1, 2 or 3",
    });

    if (action === "1") {
      const { articleID } = await inquirer.prompt({
        type: "input",
        name: "articleID",
        message: "Enter the Article ID to save:",
        validate: (val) => /^\d+$/.test(val) || "Enter a valid numeric Article ID",
      });

      try {
        await axios.post(`${BASE_URL}/saved-articles`, {
          userId: userData.userID,
          articleId: parseInt(articleID),
        });
        console.log("✅ Article saved.");
      } catch (err: any) {
        console.error("Save failed:", err.response?.data?.message || err.message);
      }
    } else if (action === "3") {
      console.log("Logging out...");
      process.exit(0);
    }
  } catch (error: any) {
    console.error("Search failed:", error.response?.data?.message || error.message);
  }
}

async function fetchUserInfo(email: string) {
  const res = await axios.get(`${BASE_URL}/users/by-email`, {
    params: { email },
  });
  return res.data;
}

async function showHeadlinesSubMenu(userEmail: string) {
  while (true) {
    const currentDate = dayjs().format("DD-MMM-YYYY");
    const currentTime = dayjs().format("h:mmA");

    console.log(`\nWelcome to the News Application, ${userEmail}! Date: ${currentDate}`);
    console.log(`Time: ${currentTime}`);

    const { choice } = await inquirer.prompt({
      type: "input",
      name: "choice",
      message: "1. Today\n2. Date range\n3. Logout\nEnter your choice:",
      validate: (input) => ["1", "2", "3"].includes(input) || "Enter a valid number (1-3)",
    });

    switch (choice) {
      case "1":
        await fetchHeadlinesToday(userEmail);
        break;
      case "2":
        await fetchHeadlinesByDateRange(userEmail);
        break;
      case "3":
        console.log("Logging out...");
        process.exit(0);
    }
  }
}

async function fetchHeadlinesToday(userEmail: string) {
  const today = dayjs().format("YYYY-MM-DD");
  try {
    const res = await axios.get(`${BASE_URL}/articles`, {
      params: { start: today, end: today },
    });

    const articles = res.data;
    if (!articles.length) {
      console.log("\nNo headlines found for today.\n");
      return;
    }

    console.log(`\n--- Headlines for ${today} ---`);
    articles.forEach((a: any) => {
      console.log(`Article ID: ${a.articleID}`);
      console.log(`Title: ${a.articleTitle}`);
      console.log(`Content: ${a.articleContent}`);
      console.log(`Source: ${a.source}`);
      console.log(`URL: ${a.URL}\n`);
    });

    await postHeadlinesMenu(userEmail);
  } catch (err: any) {
    console.error("Error fetching headlines:", err.response?.data?.message || err.message);
  }
}

async function fetchHeadlinesByDateRange(userEmail: string) {
  const { start, end } = await inquirer.prompt([
    {
      type: "input",
      name: "start",
      message: "Enter start date (YYYY-MM-DD):",
      validate: (val) => dayjs(val, "YYYY-MM-DD", true).isValid() || "Enter a valid date",
    },
    {
      type: "input",
      name: "end",
      message: "Enter end date (YYYY-MM-DD):",
      validate: (val) => dayjs(val, "YYYY-MM-DD", true).isValid() || "Enter a valid date",
    },
  ]);

  const res = await axios.get(`${BASE_URL}/articles`, {
    params: { start, end },
  });

  const articles = res.data;
  if (!articles.length) {
    console.log(`\nNo headlines found between ${start} and ${end}.\n`);
    return;
  }

  articles.forEach((a: any) => {
    console.log(`Article ID: ${a.articleID}`);
    console.log(`Title: ${a.articleTitle}`);
    console.log(`Content: ${a.articleContent}`);
    console.log(`Source: ${a.source}`);
    console.log(`URL: ${a.URL}\n`);
  });

  await postHeadlinesMenu(userEmail);
}

async function postHeadlinesMenu(userEmail: string) {
  while (true) {
    const { choice } = await inquirer.prompt({
      type: "input",
      name: "choice",
      message: "1. Save an Article\n2. Back\n3. Logout\nEnter your choice:",
      validate: (input) => ["1", "2", "3"].includes(input) || "Enter a valid number (1-3)",
    });

    switch (choice) {
      case "1":
        const { articleID } = await inquirer.prompt({
          type: "input",
          name: "articleID",
          message: "Enter the Article ID to save:",
          validate: (val) => /^\d+$/.test(val) || "Enter a valid numeric Article ID",
        });

        try {
          const response = await axios.post(`${BASE_URL}/saved-articles`, {
            userId: userData.userID,
            articleId: parseInt(articleID),
          });
          console.log(response.data.message || "✅ Article bookmarked successfully!");
        } catch (err: any) {
          console.error("❌ Failed to bookmark article:", err.response?.data?.message || err.message);
        }
        break;

      case "2":
        return;

      case "3":
        console.log("Logging out...");
        process.exit(0);
    }
  }
}

async function fetchSavedArticles(userName: string, userId: number) {
  try {
    const res = await axios.get(`${BASE_URL}/saved-articles/${userId}`);
    const savedArticles = res.data;

    if (savedArticles.length === 0) {
      console.log("\nNo saved articles.\n");
    } else {
      console.log(`\n--- Saved Articles for ${userName} ---`);
      savedArticles.forEach((entry: any) => {
        const a = entry.article;
        console.log(`Article ID: ${a.articleID}`);
        console.log(`Title: ${a.articleTitle}`);
        console.log(`Content: ${a.articleContent}`);
        console.log(`Source: ${a.source}`);
        console.log(`URL: ${a.URL}\n`);
      });
    }
  } catch (error: any) {
    console.error("Error fetching saved articles:", error.response?.data?.message || error.message);
  }
}