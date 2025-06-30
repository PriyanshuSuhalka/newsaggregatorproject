import axios from "axios";
import inquirer from "inquirer";
import dayjs from "dayjs";

const BASE_URL = "http://localhost:8000";
let userData: { userEmail: string; userID: number };

export async function showUserMenu(userEmail: string) {
  while (true) {
    const currentDate = dayjs().format("DD-MMM-YYYY");
    const currentTime = dayjs().format("h:mmA");

    console.log(
      `\nWelcome to the News Application, ${userEmail}! Date: ${currentDate}`
    );
    console.log(`Time: ${currentTime}`);
    console.log("Please choose the options below");

    const { choice } = await inquirer.prompt({
      type: "input",
      name: "choice",
      message:
        "1. Headlines\n2. Saved Articles\n3. Search\n4. Notifications\n5. Logout\nEnter your choice:",
      validate: (input) =>
        ["1", "2", "3", "4", "5"].includes(input) ||
        "Enter a valid number (1-5)",
    });

    switch (choice) {
      case "1":
        await showHeadlinesSubMenu(userEmail);
        break;
      case "2":
        userData = await fetchUserInfo(userEmail);
        fetchSavedArticles(userEmail, userData.userID);
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
    type: 'input',
    name: 'keyword',
    message: 'Enter a keyword to search:',
    validate: (val) => val.trim() !== '' || 'Keyword cannot be empty',
  });

  try {
    const res = await axios.get(`${BASE_URL}/articles/search`, {
      params: { keyword },
    });

    const articles = res.data;

    if (!articles.length) {
      console.log('\nNo articles found matching your search.\n');
      return;
    }

    console.log(`\n--- Search Results for "${keyword}" ---`);
    articles.forEach((a: any, index: number) => {
      console.log(`${index + 1}. ${a.articleTitle}`);
      console.log(`   Content: ${a.articleContent}`);
      console.log(`   Source: ${a.source}`);
      console.log(`   URL: ${a.URL}\n`);
    });

    console.log("1. Save an Article\n2. Back\n3. Logout");
    const { action } = await inquirer.prompt({
      type: "input",
      name: "action",
      message: "Enter your choice:",
      validate: (val) => ["1", "2", "3"].includes(val) || "Enter 1, 2 or 3",
    });

    if (action === "1") {
      const { articleIndex } = await inquirer.prompt({
        type: "input",
        name: "articleIndex",
        message: `Enter article number to save (1-${articles.length}):`,
        validate: (val) =>
          /^\d+$/.test(val) &&
          parseInt(val) >= 1 &&
          parseInt(val) <= articles.length ||
          `Enter a number between 1 and ${articles.length}`,
      });

      const selectedArticle = articles[parseInt(articleIndex) - 1];
      try {
        await axios.post(`${BASE_URL}/saved-articles`, {
          email: userEmail,
          articleID: selectedArticle.articleID,
        });
        console.log("✅ Article saved.");
      } catch (err: any) {
        console.error("Save failed:", err.response?.data?.message || err.message);
      }

      // 🔁 Return to action menu only, not full keyword prompt again
      return;
    } else if (action === "2") {
      return;
    } else {
      console.log("Logging out...");
      process.exit(0);
    }
  } catch (error: any) {
    console.error('Search failed:', error.response?.data?.message || error.message);
  }
}

async function fetchUserInfo(email: string) {
  try {
    const res = await axios.get(`${BASE_URL}/users/by-email`, {
      params: { email },
    });
    return res.data;
  } catch (error: any) {
    console.error(
      "Error retrieving user info:",
      error.response?.data?.message || error.message
    );
    return null;
  }
}

async function showHeadlinesSubMenu(userEmail: string) {
  while (true) {
    const currentDate = dayjs().format("DD-MMM-YYYY");
    const currentTime = dayjs().format("h:mmA");

    console.log(
      `\nWelcome to the News Application, ${userEmail}! Date: ${currentDate}`
    );
    console.log(`Time: ${currentTime}`);
    console.log("Please choose the options below");

    const { choice } = await inquirer.prompt({
      type: "input",
      name: "choice",
      message: "1. Today\n2. Date range\n3. Logout\nEnter your choice:",
      validate: (input) =>
        ["1", "2", "3"].includes(input) || "Enter a valid number (1-3)",
    });

    switch (choice) {
      case "1":
        await fetchHeadlinesToday(userEmail);
        break;
      case "2":
        await fetchHeadlinesByDateRange(userEmail);
        break;
      case "3":
        console.log("Logged out.");
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
    articles.forEach((a: any, index: number) => {
      console.log(`Article ID: ${a.articleID}`);
      console.log(`Title: ${a.articleTitle}`);
      console.log(`Content: ${a.articleContent}`);
      console.log(`Source: ${a.source}`);
      console.log(`URL: ${a.URL}`);
      console.log("");
    });

    await postHeadlinesMenu(userEmail);
  } catch (err: any) {
    console.error(
      "Error fetching headlines:",
      err.response?.data?.message || err.message
    );
  }
}

async function fetchHeadlinesByDateRange(userEmail: string) {
  const { start, end } = await inquirer.prompt([
    {
      type: 'input',
      name: 'start',
      message: 'Enter start date (YYYY-MM-DD):',
      validate: (val) =>
        dayjs(val, 'YYYY-MM-DD', true).isValid() || 'Enter a valid date',
    },
    {
      type: 'input',
      name: 'end',
      message: 'Enter end date (YYYY-MM-DD):',
      validate: (val) =>
        dayjs(val, 'YYYY-MM-DD', true).isValid() || 'Enter a valid date',
    },
  ]);

  console.log('\nPlease choose the category below');
  console.log('1. All');
  console.log('2. Business');
  console.log('3. Entertainment');
  console.log('4. Sports');
  console.log('5. Technology');

  const { categoryChoice } = await inquirer.prompt({
    type: 'input',
    name: 'categoryChoice',
    message: 'Enter your choice (1–5):',
    validate: (val) =>
      ['1', '2', '3', '4', '5'].includes(val) || 'Enter a valid option (1–5)',
  });

  const categoryMap: { [key: string]: string } = {
    '1': 'All',
    '2': 'Business',
    '3': 'Entertainment',
    '4': 'Sports',
    '5': 'Technology',
  };

  const selectedCategory = categoryMap[categoryChoice];

  try {
    const queryParams: any = { start, end };
    if (selectedCategory !== 'All') queryParams.category = selectedCategory;

    const res = await axios.get(`${BASE_URL}/articles`, { params: queryParams });
    const articles = res.data;

    if (!articles.length) {
      console.log(`\nNo headlines found between ${start} and ${end}.\n`);
      return;
    }

    console.log(`\n--- Headlines from ${start} to ${end} (Category: ${selectedCategory}) ---`);
    articles.forEach((a: any, index: number) => {
      console.log(`${index + 1}. ${a.articleTitle}`);
      console.log(`   Content: ${a.articleContent}`);
      console.log(`   Source: ${a.source}`);
      console.log(`   URL: ${a.URL}`);
      console.log(`   Category: ${a.category?.categoryName || 'Unknown'}\n`);
    });

    console.log("1. Save an Article\n2. Back\n3. Logout");
    const { action } = await inquirer.prompt({
      type: "input",
      name: "action",
      message: "Enter your choice:",
      validate: (val) =>
        ["1", "2", "3"].includes(val) || "Enter a valid number (1-3)",
    });

    if (action === "1") {
      const { articleIndex } = await inquirer.prompt({
        type: "input",
        name: "articleIndex",
        message: `Enter article number to save (1-${articles.length}):`,
        validate: (val) =>
          /^\d+$/.test(val) &&
          parseInt(val) >= 1 &&
          parseInt(val) <= articles.length ||
          `Enter a number between 1 and ${articles.length}`,
      });

      const selectedArticle = articles[parseInt(articleIndex) - 1];
      try {
        await axios.post(`${BASE_URL}/saved-articles`, {
          email: userEmail,
          articleID: selectedArticle.articleID,
        });
        console.log("✅ Article saved.");
      } catch (err: any) {
        console.error("Save failed:", err.response?.data?.message || err.message);
      }

      // 🔁 Go back to the action menu, not date prompts
      return;
    } else if (action === "2") {
      return;
    } else {
      console.log("Logging out...");
      process.exit(0);
    }
  } catch (err: any) {
    console.error('Error fetching headlines:', err.response?.data?.message || err.message);
  }
}


async function postHeadlinesMenu(userEmail: string) {
  const { choice } = await inquirer.prompt({
    type: "input",
    name: "choice",
    message: "1. Back\n2. Logout\n3. Save Article\nEnter your choice:",
    validate: (input) =>
      ["1", "2", "3"].includes(input) || "Enter a valid number (1-3)",
  });

  switch (choice) {
    case "1":
      return;
    case "2":
      console.log("Logging out...");
      process.exit(0);
    case "3":
      const { articleID } = await inquirer.prompt({
        type: "input",
        name: "articleID",
        message: "Enter Article ID to save:",
        validate: (val) =>
          /^\d+$/.test(val) || "Enter a valid numeric Article ID",
      });

      try {
        await axios.post(`${BASE_URL}/saved-articles`, {
          email: userEmail,
          articleID: parseInt(articleID),
        });
        console.log("Article bookmarked successfully!");
      } catch (err: any) {
        console.error(
          "Failed to bookmark article:",
          err.response?.data?.message || err.message
        );
      }

      await postHeadlinesMenu(userEmail); // Loop again
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
      savedArticles.forEach((entry: any, index: number) => {
        const a = entry.article;
        console.log(`${index + 1}. ${a.articleTitle}`);
        console.log(`   Content: ${a.articleContent}`);
        console.log(`   Source: ${a.source}`);
        console.log(`   URL: ${a.URL}\n`);
      });
    }
  } catch (error: any) {
    console.error(
      "Error fetching saved articles:",
      error.response?.data?.message || error.message
    );
  }
}

async function showArticleDetails(article: any, userEmail: string) {
  const currentDate = dayjs().format("DD-MMM-YYYY");
  const currentTime = dayjs().format("h:mmA");

  console.log(
    `\nWelcome to the News Application, ${userEmail}! Date: ${currentDate} Time: ${currentTime}`
  );
  console.log(`H E A D L I N E S`);
  console.log(`1. Back`);
  console.log(`2. Logout`);
  console.log(`3. Save Article`);
  console.log(`Article Id: ${article.articleID}`);
  console.log(`${article.articleTitle}`);
  console.log(`${article.articleContent}`);
  console.log(`source: ${article.source}`);
  console.log(`URL:\n${article.URL}`);
  console.log(
    `${
      article.category.categoryName
    }: ${article.category.categoryName.toLowerCase()}`
  );

  const { choice } = await inquirer.prompt({
    type: "input",
    name: "choice",
    message: "Enter your choice:",
    validate: (val) =>
      ["1", "2", "3"].includes(val) || "Enter a valid number (1-3)",
  });

  switch (choice) {
    case "3":
      try {
        await axios.post(`${BASE_URL}/saved-articles`, {
          email: userEmail,
          articleID: article.articleID,
        });
        console.log("✅ Article bookmarked!");
      } catch (err: any) {
        console.error(
          "Bookmark failed:",
          err.response?.data?.message || err.message
        );
      }
      await showArticleDetails(article, userEmail);
      break;
    case "2":
      console.log("Logging out...");
      process.exit(0);
    case "1":
      return;
  }
}
