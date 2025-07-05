// user-menu.ts
import axios from "axios";
import inquirer from "inquirer";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import minMax from "dayjs/plugin/minMax";

// Enable plugins for dayjs
dayjs.extend(relativeTime);
dayjs.extend(minMax);

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
      type: "list",
      name: "choice",
      message: "Select an option:",
      choices: [
        { name: "Headlines", value: "1" },
        { name: "Saved Articles", value: "2" },
        { name: "Search", value: "3" },
        { name: "Notifications", value: "4" },
        { name: "Logout", value: "5" }
      ]
    });

    switch (choice) {
      case "1":
        await fetchHeadlinesToday(userEmail);
        break;
      case "2":
        await fetchSavedArticles(userEmail, userData.userID);
        break;
      case "3":
        await handleSearch(userEmail);
        break;
      case "4":
        await showNotificationsMenu(userEmail, userData.userID);
        break;
      case "5":
        console.log("Goodbye! Thank you for using the News Application.");
        return;
      default:
        console.log("This feature is coming soon.");
    }
  }
}

async function handleSearch(userEmail: string) {
  while (true) {
    const currentDate = dayjs().format("DD-MMM-YYYY");
    const currentTime = dayjs().format("h:mmA");

    console.log(`\nWelcome to the News Application, ${userEmail}! Date: ${currentDate} Time:${currentTime}`);
    console.log("\nS E A R C H\n");

    const { keyword } = await inquirer.prompt({
      type: "input",
      name: "keyword",
      message: "Enter a keyword to search:",
      validate: (val) => val.trim() !== "" || "Keyword cannot be empty",
    });

    // Ask for search options
    const searchOptions = await getSearchOptions();

    try {
      // Build search parameters
      const searchParams: any = { keyword };
      
      if (searchOptions.dateFilter) {
        searchParams.start = searchOptions.startDate;
        searchParams.end = searchOptions.endDate;
      }

      const res = await axios.get(`${BASE_URL}/articles/search`, {
        params: searchParams,
      });

      const articles = res.data;

      if (!articles.length) {
        console.log(`\nNo articles found matching "${keyword}"`);
        if (searchOptions.dateFilter) {
          console.log(`Date range: ${searchOptions.startDate} to ${searchOptions.endDate}`);
        }
        console.log();
        
        const { tryAgain } = await inquirer.prompt({
          type: 'confirm',
          name: 'tryAgain',
          message: 'Would you like to search again?',
          default: true
        });
        
        if (!tryAgain) break;
        continue;
      }

      await displaySearchResults(keyword, articles, searchOptions);
      break;

    } catch (error: any) {
      console.error("Search failed:", error.response?.data?.message || error.message);
      
      const { tryAgain } = await inquirer.prompt({
        type: 'confirm',
        name: 'tryAgain',
        message: 'Would you like to try searching again?',
        default: true
      });
      
      if (!tryAgain) break;
    }
  }
}

async function getSearchOptions() {
  const options: any = {};

  // Ask about date filtering
  const { useDateFilter } = await inquirer.prompt({
    type: 'confirm',
    name: 'useDateFilter',
    message: 'Do you want to filter by date range?',
    default: false
  });

  options.dateFilter = useDateFilter;

  if (useDateFilter) {
    const dateRange = await inquirer.prompt([
      {
        type: "input",
        name: "startDate",
        message: "Enter start date (YYYY-MM-DD):",
        validate: (val) => dayjs(val, "YYYY-MM-DD", true).isValid() || "Enter a valid date (YYYY-MM-DD)",
        default: dayjs().subtract(30, 'days').format('YYYY-MM-DD')
      },
      {
        type: "input",
        name: "endDate",
        message: "Enter end date (YYYY-MM-DD):",
        validate: (val) => dayjs(val, "YYYY-MM-DD", true).isValid() || "Enter a valid date (YYYY-MM-DD)",
        default: dayjs().format('YYYY-MM-DD')
      },
    ]);
    options.startDate = dateRange.startDate;
    options.endDate = dateRange.endDate;
  }

  return options;
}

async function displaySearchResults(keyword: string, articles: any[], searchOptions: any) {
  console.log(`\nResults for "${keyword}"`);
  
  // Display search filters used
  if (searchOptions.dateFilter) {
    console.log(`Date range: ${searchOptions.startDate} to ${searchOptions.endDate}`);
  }
  console.log(` Found ${articles.length} result(s) (sorted by date)\n`);

  // Display articles with better formatting
  articles.forEach((article: any, index: number) => {
    console.log(`${index + 1}. ${article.articleTitle}`);
    
    // Truncate content for better display
    const truncatedContent = article.articleContent.length > 150 
      ? article.articleContent.substring(0, 150) + '...'
      : article.articleContent;
    
    console.log(`   ${truncatedContent}`);
    console.log(`   Source: ${article.source}`);
    console.log(`   Published: ${dayjs(article.publishDate).format('DD-MMM-YYYY HH:mm')}`);
    console.log(`   Category: ${article.category?.categoryName || 'Unknown'}`);
    console.log(`   URL: ${article.URL}`);
    console.log(`   ID: ${article.articleID}\n`);
  });

  // Post-search actions
  await postSearchActions(articles);
}

async function postSearchActions(articles: any[]) {
  const { action } = await inquirer.prompt({
    type: 'list',
    name: 'action',
    message: 'What would you like to do?',
    choices: [
      { name: 'Save an Article', value: 'save' },
      { name: 'New Search', value: 'search' },
      { name: 'Back to Main Menu', value: 'back' },
      { name: 'Logout', value: 'logout' }
    ]
  });

  switch (action) {
    case 'save':
      await handleSaveArticle(articles);
      break;
    case 'search':
      // Will return to search function
      break;
    case 'back':
      return;
    case 'logout':
      console.log("Logging out...");
      process.exit(0);
  }
}

async function handleSaveArticle(articles: any[]) {
  if (articles.length === 0) {
    console.log("No articles available to save.");
    return;
  }

  console.log("\nSave Article to Your Collection");
  console.log("=".repeat(35));
  
  const { articleIndex } = await inquirer.prompt({
    type: 'list',
    name: 'articleIndex',
    message: 'Select an article to save:',
    choices: articles.map((article, index) => {
      const title = article.articleTitle.length > 60 
        ? article.articleTitle.substring(0, 57) + '...'
        : article.articleTitle;
      const source = article.source ? ` (${article.source})` : '';
      return {
        name: `${index + 1}. ${title}${source}`,
        value: index
      };
    }).concat([
      { name: "Cancel and go back", value: -1 }
    ])
  });

  if (articleIndex === -1) {
    console.log("Save cancelled.");
    return;
  }

  const selectedArticle = articles[articleIndex];

  try {
    console.log(`\nSaving "${selectedArticle.articleTitle}"...`);
    
    await axios.post(`${BASE_URL}/saved-articles`, {
      userId: userData.userID,
      articleId: selectedArticle.articleID,
    });
    
    console.log(`Article saved successfully!`);
    console.log(`"${selectedArticle.articleTitle}" has been added to your collection.`);
    console.log(`You can view your saved articles from the main menu.\n`);
    
  } catch (err: any) {
    if (err.response?.status === 409) {
      console.log(`Article already saved!`);
      console.log(`"${selectedArticle.articleTitle}" is already in your collection.\n`);
    } else if (err.response?.status === 404) {
      console.log(`Save failed: Article not found.`);
      console.log(`The article might have been removed. Please try again.\n`);
    } else {
      console.error("Save failed:", err.response?.data?.message || err.message);
      console.log("Please try again or contact support if the issue persists.\n");
    }
  }
}

async function fetchUserInfo(email: string) {
  const res = await axios.get(`${BASE_URL}/users/by-email`, {
    params: { email },
  });
  return res.data;
}

async function fetchHeadlinesToday(userEmail: string) {
  const today = dayjs().format("YYYY-MM-DD");
  const todayFormatted = dayjs().format("DD-MMM-YYYY");
  
  try {
    console.log(`\nLoading today's headlines for ${todayFormatted}...`);
    
    const res = await axios.get(`${BASE_URL}/articles`, {
      params: { start: today, end: today },
    });

    const articles = res.data;
    
    if (!articles.length) {
      console.log(`\nNo headlines found for ${todayFormatted}`);
      console.log("This could mean:");
      console.log("   • No new articles were published today");
      console.log("   • Articles are still being fetched from news sources");
      console.log("   • Try checking again later\n");
      return;
    }

    await displayHeadlines(`Today's Headlines (${todayFormatted})`, articles);
    
  } catch (err: any) {
    console.error("Error fetching today's headlines:", err.response?.data?.message || err.message);
    console.log("Possible issues:");
    console.log("   • Server might be down or starting up");
    console.log("   • Network connectivity problems");
    console.log("   • Database connection issues\n");
  }
}

async function displayHeadlines(title: string, articles: any[]) {
  console.log(`\n${title}`);
  console.log("=".repeat(title.length + 10));
  console.log(`Found ${articles.length} article(s) • Sorted by publication date (newest first)\n`);

  // Group articles by category for better overview
  const categoryCounts = articles.reduce((acc: any, article: any) => {
    const cat = article.category?.categoryName || 'Unknown';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  console.log("Articles by Category:");
  Object.entries(categoryCounts).forEach(([category, count]) => {
    console.log(`   ${category}: ${count} article(s)`);
  });
  console.log();

  // Display articles with enhanced formatting
  articles.forEach((article: any, index: number) => {
    const articleNum = `${index + 1}`.padStart(2, '0');
    const publishDate = dayjs(article.publishDate);
    
    console.log(`${articleNum}. ${article.articleTitle}`);
    
    // Truncate content intelligently - stop at sentence boundary if possible
    let truncatedContent = article.articleContent;
    if (truncatedContent.length > 180) {
      const truncated = truncatedContent.substring(0, 180);
      const lastSentence = truncated.lastIndexOf('. ');
      if (lastSentence > 120) {
        truncatedContent = truncated.substring(0, lastSentence + 1);
      } else {
        truncatedContent = truncated + '...';
      }
    }
    
    console.log(`     � ${truncatedContent}`);
    console.log(`     Source: ${article.source || 'Unknown'}`);
    
    // Enhanced date display
    const timeAgo = publishDate.fromNow();
    const fullDate = publishDate.format('DD-MMM-YYYY HH:mm');
    console.log(`     Published: ${fullDate} (${timeAgo})`);
    
    console.log(`     Category: ${article.category?.categoryName || 'Uncategorized'}`);
    
    // URL display with length check
    const url = article.URL || 'No URL available';
    const displayUrl = url.length > 60 ? url.substring(0, 57) + '...' : url;
    console.log(`     URL: ${displayUrl}`);
    
    console.log(`     ID: ${article.articleID}`);
    console.log(); // Add spacing between articles
  });

  // Post-headlines actions
  await postHeadlinesActions(articles);
}

async function postHeadlinesActions(articles: any[]) {
  console.log("─".repeat(50));
  const { action } = await inquirer.prompt({
    type: 'list',
    name: 'action',
    message: 'What would you like to do next?',
    choices: [
      { name: 'Save an Article to Your Collection', value: 'save' },
      { name: 'Search for Specific Articles', value: 'search' },
      { name: 'View Article Statistics', value: 'stats' },
      { name: 'Back to Headlines Menu', value: 'back' },
      { name: 'Return to Main Menu', value: 'main' },
      { name: 'Logout', value: 'logout' }
    ]
  });

  switch (action) {
    case 'save':
      await handleSaveArticle(articles);
      // After saving, show actions again
      await postHeadlinesActions(articles);
      break;
    case 'search':
      console.log("Redirecting to search functionality...\n");
      // This will exit the headlines flow and return to main menu where user can select search
      return;
    case 'stats':
      await showArticleStats(articles);
      await postHeadlinesActions(articles);
      break;
    case 'back':
      // Returns to headlines submenu
      return;
    case 'main':
      // Exit completely to main menu
      return;
    case 'logout':
      console.log("Thank you for using the News Application. Goodbye!");
      process.exit(0);
  }
}

async function showArticleStats(articles: any[]) {
  console.log("\nArticle Statistics");
  console.log("=".repeat(25));
  
  // Basic stats
  console.log(`Total Articles: ${articles.length}`);
  
  // Category breakdown
  const categories = articles.reduce((acc: any, article: any) => {
    const cat = article.category?.categoryName || 'Uncategorized';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});
  
  console.log("\nCategories:");
  Object.entries(categories)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .forEach(([category, count]) => {
      const percentage = ((count as number) / articles.length * 100).toFixed(1);
      console.log(`   ${category}: ${count} articles (${percentage}%)`);
    });
  
  // Source breakdown
  const sources = articles.reduce((acc: any, article: any) => {
    const source = article.source || 'Unknown';
    acc[source] = (acc[source] || 0) + 1;
    return acc;
  }, {});
  
  console.log("\nTop Sources:");
  Object.entries(sources)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 5)
    .forEach(([source, count]) => {
      console.log(`   ${source}: ${count} articles`);
    });
  
  // Date range analysis
  const dates = articles.map(article => dayjs(article.publishDate));
  const earliest = dayjs.min(dates);
  const latest = dayjs.max(dates);
  
  console.log(`\nDate Range: ${earliest?.format('DD-MMM-YYYY')} to ${latest?.format('DD-MMM-YYYY')}`);
  
  // Recent articles
  const recentCount = articles.filter(article => 
    dayjs(article.publishDate).isAfter(dayjs().subtract(24, 'hours'))
  ).length;
  
  if (recentCount > 0) {
    console.log(`⏰ Recent (last 24h): ${recentCount} articles`);
  }
  
  console.log();
}

async function fetchSavedArticles(userName: string, userId: number) {
  try {
    console.log(`\nLoading saved articles for ${userName}...`);
    
    const res = await axios.get(`${BASE_URL}/saved-articles/${userId}`);
    const savedArticles = res.data;

    if (savedArticles.length === 0) {
      console.log(`\nNo saved articles found for ${userName}`);
      console.log("Start saving articles from headlines or search results!\n");
      return;
    }

    console.log(`\nSaved Articles for ${userName}`);
    console.log(`Found ${savedArticles.length} saved article(s)\n`);
    
    savedArticles.forEach((entry: any, index: number) => {
      const article = entry.article;
      console.log(`${index + 1}. ${article.articleTitle}`);
      
      // Truncate content for better display
      const truncatedContent = article.articleContent.length > 150 
        ? article.articleContent.substring(0, 150) + '...'
        : article.articleContent;
      
      console.log(`   Content: ${truncatedContent}`);
      console.log(`   Source: ${article.source}`);
      console.log(`   Published: ${dayjs(article.publishDate).format('DD-MMM-YYYY HH:mm')}`);
      console.log(`   Category: ${article.category?.categoryName || 'Unknown'}`);
      console.log(`   URL: ${article.URL}`);
      console.log(`   ID: ${article.articleID}\n`);
    });
    
  } catch (error: any) {
    console.error("Error fetching saved articles:", error.response?.data?.message || error.message);
  }
}

async function showNotificationsMenu(userEmail: string, userID: number) {
  while (true) {
    console.log("\n=== Notifications Center ===");
    
    // Show quick notification summary
    try {
      const res = await axios.get(`${BASE_URL}/notifications`, {
        params: { userId: userID },
      });
      const notifications = res.data;
      const unreadCount = notifications.filter((n: any) => !n.isRead).length;
      
      if (unreadCount > 0) {
        console.log(`You have ${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}`);
      } else {
        console.log("All notifications read");
      }
    } catch (error) {
      // Silently continue if we can't fetch notification count
    }

    const { choice } = await inquirer.prompt({
      type: "list",
      name: "choice",
      message: "What would you like to do?",
      choices: [
        "View Notifications",
        "Configure Notification Preferences", 
        "Back to Main Menu",
        "Logout"
      ]
    });

    switch (choice) {
      case "View Notifications":
        await viewNotifications(userID);
        break;
      case "Configure Notification Preferences":
        await configureNotifications(userID);
        break;
      case "Back to Main Menu":
        return; // Go back to main menu
      case "Logout":
        console.log("Logged out.");
        process.exit(0);
    }
  }
}

async function viewNotifications(userID: number) {
  try {
    const res = await axios.get(`${BASE_URL}/notifications`, {
      params: { userId: userID },
    });

    const notifications = res.data;

    if (!notifications.length) {
      console.log("\nNo notifications found.");
      console.log("Tip: Configure your notification preferences to start receiving alerts about topics you care about!");
      return;
    }

    console.log("\n=== Your Notifications ===");
    
    // Separate read and unread notifications
    const unreadNotifications = notifications.filter((n: any) => !n.isRead);
    const readNotifications = notifications.filter((n: any) => n.isRead);

    // Automatically mark all unread notifications as read when viewing
    if (unreadNotifications.length > 0) {
      console.log(`\nNew Notifications (${unreadNotifications.length}):`);
      unreadNotifications.forEach((notification: any, index: number) => {
        const date = new Date(notification.createdAt).toLocaleDateString();
        const time = new Date(notification.createdAt).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
        console.log(`\n${index + 1}. ${notification.message}`);
        console.log(`   ${date} at ${time}`);
      });

      // Automatically mark all unread notifications as read
      console.log(`\nMarking all ${unreadNotifications.length} notifications as read...`);
      try {
        for (const notification of unreadNotifications) {
          await axios.post(`${BASE_URL}/notifications/${notification.id}/read`, null, {
            params: { userId: userID },
          });
        }
        console.log("All notifications marked as read!");
      } catch (markError: any) {
        console.error("Failed to mark some notifications as read:", markError.response?.data?.message || markError.message);
      }
    }

    if (readNotifications.length > 0) {
      console.log(`\nPreviously Read (${readNotifications.length}):`);
      readNotifications.slice(0, 5).forEach((notification: any, index: number) => {
        const date = new Date(notification.createdAt).toLocaleDateString();
        console.log(`\n${index + 1}. ${notification.message}`);
        console.log(`   ${date}`);
      });
      
      if (readNotifications.length > 5) {
        console.log(`\n   ... and ${readNotifications.length - 5} more read notifications`);
      }
    }

    // Simple continuation prompt
    await inquirer.prompt({
      type: "input",
      name: "continue",
      message: "Press Enter to continue..."
    });

  } catch (error: any) {
    console.error("Failed to fetch notifications:", error.response?.data?.message || error.message);
  }
}

async function markSpecificNotificationAsRead(userID: number, unreadNotifications: any[]) {
  const choices = unreadNotifications.map((notification: any, index: number) => ({
    name: `${index + 1}. ${notification.message.substring(0, 60)}${notification.message.length > 60 ? '...' : ''}`,
    value: notification.id
  }));

  const { notificationId } = await inquirer.prompt({
    type: "list",
    name: "notificationId",
    message: "Select notification to mark as read:",
    choices: choices
  });

  try {
    await axios.post(`${BASE_URL}/notifications/${notificationId}/read`, null, {
      params: { userId: userID },
    });
    console.log("Notification marked as read!");
  } catch (err: any) {
    console.error("Failed to mark notification as read:", err.response?.data?.message || err.message);
  }
}

async function markAllNotificationsAsRead(userID: number, unreadNotifications: any[]) {
  const { confirm } = await inquirer.prompt({
    type: "confirm",
    name: "confirm",
    message: `Mark all ${unreadNotifications.length} notifications as read?`,
    default: false
  });

  if (!confirm) {
    console.log("Cancelled.");
    return;
  }

  try {
    for (const notification of unreadNotifications) {
      await axios.post(`${BASE_URL}/notifications/${notification.id}/read`, null, {
        params: { userId: userID },
      });
    }
    console.log(`All ${unreadNotifications.length} notifications marked as read!`);
  } catch (err: any) {
    console.error("Failed to mark notifications as read:", err.response?.data?.message || err.message);
  }
}

async function configureNotifications(userID: number) {
  try {
    // Get current config and available categories
    const res = await axios.get(`${BASE_URL}/notifications/config`, {
      params: { userId: userID },
    });

    const { config, availableCategories } = res.data;
    const currentEnabledIds = config?.enabledCategoryIds || [];
    const currentKeywords = config?.keywords || [];

    console.log("\n=== Notification Preferences ===");
    
    // Show current configuration in a friendly way
    console.log("\nYour Current Subscriptions:");
    if (currentEnabledIds.length > 0) {
      const enabledCategories = availableCategories.filter((cat: any) => 
        currentEnabledIds.includes(cat.categoryID)
      );
      console.log("Categories: " + enabledCategories.map((cat: any) => `"${cat.categoryName}"`).join(", "));
    } else {
      console.log("Categories: Not subscribed to any categories");
    }
    
    if (currentKeywords.length > 0) {
      console.log("Keywords: " + currentKeywords.map((k: string) => `"${k}"`).join(", "));
    } else {
      console.log("Keywords: No keywords set");
    }

    // Main configuration menu
    while (true) {
      console.log("\n--- What would you like to do? ---");
      const { mainChoice } = await inquirer.prompt({
        type: "list",
        name: "mainChoice",
        message: "Choose an option:",
        choices: [
          "Manage Category Subscriptions",
          "Manage Keyword Alerts", 
          "Email Notification Settings",
          "Save & Exit",
          "Cancel Changes"
        ]
      });

      if (mainChoice === "Manage Category Subscriptions") {
        await manageCategorySubscriptions(userID, availableCategories, currentEnabledIds);
      } else if (mainChoice === "Manage Keyword Alerts") {
        await manageKeywordAlerts(userID, currentKeywords);
      } else if (mainChoice === "Email Notification Settings") {
        await manageEmailSettings(userID, config);
      } else if (mainChoice === "Save & Exit") {
        console.log("\nAll changes saved! You'll receive notifications based on your preferences.");
        break;
      } else if (mainChoice === "Cancel Changes") {
        console.log("\nChanges cancelled.");
        break;
      } 
    }

  } catch (error: any) {
    console.error("Failed to configure notifications:", error.response?.data?.message || error.message);
  }
}

async function manageCategorySubscriptions(userID: number, availableCategories: any[], currentEnabledIds: number[]) {
  console.log("\n=== Category Subscriptions ===");
  console.log("Select categories to receive notifications about:");
  
  // Use checkbox prompt for multiple selections
  const categoryChoices = availableCategories.map(cat => ({
    name: cat.categoryName,
    value: cat.categoryID,
    checked: currentEnabledIds.includes(cat.categoryID)
  }));

  const { selectedCategories } = await inquirer.prompt({
    type: "checkbox",
    name: "selectedCategories",
    message: "Choose categories (use space to select/deselect, enter to confirm):",
    choices: categoryChoices
  });

  // Update the configuration
  try {
    await axios.post(`${BASE_URL}/notifications/config`, {
      userId: userID,
      enabledCategoryIds: selectedCategories,
      keywords: [] // Keep existing keywords, just update categories
    });

    const selectedNames = availableCategories
      .filter(cat => selectedCategories.includes(cat.categoryID))
      .map(cat => cat.categoryName);

    if (selectedNames.length > 0) {
      console.log(`\nSubscribed to: ${selectedNames.join(", ")}`);
    } else {
      console.log("\nUnsubscribed from all categories");
    }
  } catch (error: any) {
    console.error("Failed to update categories:", error.response?.data?.message || error.message);
  }
}

async function manageKeywordAlerts(userID: number, currentKeywords: string[]) {
  console.log("\n=== Keyword Alerts ===");
  console.log("Set up keyword alerts to get notified when articles contain specific terms:");
  
  if (currentKeywords.length > 0) {
    console.log("\nYour current keywords:");
    currentKeywords.forEach((keyword, index) => {
      console.log(`   ${index + 1}. "${keyword}"`);
    });
  }

  while (true) {
    const { keywordAction } = await inquirer.prompt({
      type: "list",
      name: "keywordAction",
      message: "What would you like to do?",
      choices: [
        "Add new keywords",
        "Remove keywords",
        "Replace all keywords",
        "Back to main menu"
      ]
    });

    if (keywordAction === "Add new keywords") {
      await addKeywords(userID, currentKeywords);
    } else if (keywordAction === "Remove keywords") {
      await removeKeywords(userID, currentKeywords);
    } else if (keywordAction === "Replace all keywords") {
      await replaceAllKeywords(userID);
    } else {
      break;
    }
  }
}

async function addKeywords(userID: number, currentKeywords: string[]) {
  const { newKeywords } = await inquirer.prompt({
    type: "input",
    name: "newKeywords",
    message: "Enter keywords to add (comma-separated):",
    validate: (input) => input.trim() !== "" || "Please enter at least one keyword"
  });

  const keywordsToAdd = newKeywords.split(",")
    .map((s: string) => s.trim())
    .filter((s: string) => s !== "" && !currentKeywords.includes(s));

  if (keywordsToAdd.length === 0) {
    console.log("No new keywords to add (duplicates ignored)");
    return;
  }

  const updatedKeywords = [...currentKeywords, ...keywordsToAdd];

  try {
    await axios.post(`${BASE_URL}/notifications/config`, {
      userId: userID,
      keywords: updatedKeywords
    });

    console.log(`\nAdded keywords: ${keywordsToAdd.map((k: string) => `"${k}"`).join(", ")}`);
    currentKeywords.push(...keywordsToAdd);
  } catch (error: any) {
    console.error("Failed to add keywords:", error.response?.data?.message || error.message);
  }
}

async function removeKeywords(userID: number, currentKeywords: string[]) {
  if (currentKeywords.length === 0) {
    console.log(" No keywords to remove");
    return;
  }

  const { keywordsToRemove } = await inquirer.prompt({
    type: "checkbox",
    name: "keywordsToRemove",
    message: "Select keywords to remove:",
    choices: currentKeywords.map(keyword => ({
      name: keyword,
      value: keyword
    }))
  });

  if (keywordsToRemove.length === 0) {
    console.log(" No keywords selected for removal");
    return;
  }

  const updatedKeywords = currentKeywords.filter(k => !keywordsToRemove.includes(k));

  try {
    await axios.post(`${BASE_URL}/notifications/config`, {
      userId: userID,
      keywords: updatedKeywords
    });

    console.log(`\n Removed keywords: ${keywordsToRemove.map((k: string) => `"${k}"`).join(", ")}`);
    currentKeywords.splice(0, currentKeywords.length, ...updatedKeywords);
  } catch (error: any) {
    console.error(" Failed to remove keywords:", error.response?.data?.message || error.message);
  }
}

async function replaceAllKeywords(userID: number) {
  const { newKeywords } = await inquirer.prompt({
    type: "input",
    name: "newKeywords",
    message: "Enter all keywords (comma-separated, will replace current ones):",
  });

  const keywords = newKeywords.split(",")
    .map((s: string) => s.trim())
    .filter((s: string) => s !== "");

  try {
    await axios.post(`${BASE_URL}/notifications/config`, {
      userId: userID,
      keywords: keywords
    });

    if (keywords.length > 0) {
      console.log(`\n Keywords updated to: ${keywords.map((k: string) => `"${k}"`).join(", ")}`);
    } else {
      console.log("\n All keywords removed");
    }
  } catch (error: any) {
    console.error(" Failed to update keywords:", error.response?.data?.message || error.message);
  }
}

async function manageEmailSettings(userID: number, config: any) {
  console.log("\n === Email Notification Settings === ");
  
  const currentSetting = config?.emailNotificationsEnabled ?? true;
  console.log(`Current setting: ${currentSetting ? " Enabled" : " Disabled"}`);

  const { emailEnabled } = await inquirer.prompt({
    type: "confirm",
    name: "emailEnabled",
    message: "Enable email notifications?",
    default: currentSetting
  });

  try {
    await axios.post(`${BASE_URL}/notifications/config`, {
      userId: userID,
      emailNotificationsEnabled: emailEnabled
    });

    console.log(`\n Email notifications ${emailEnabled ? "enabled" : "disabled"}`);
  } catch (error: any) {
    console.error(" Failed to update email settings:", error.response?.data?.message || error.message);
  }
}
