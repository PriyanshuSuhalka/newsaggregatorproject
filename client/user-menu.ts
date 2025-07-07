import axios from "axios";
import inquirer from "inquirer";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import minMax from "dayjs/plugin/minMax";

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
    console.log("1. Headlines");
    console.log("2. Saved Articles");
    console.log("3. Search");
    console.log("4. Notifications");
    console.log("5. Logout");

    const { choice } = await inquirer.prompt({
      type: "input",
      name: "choice",
      message: "Enter your choice (1-5):",
      validate: (input) => {
        const num = parseInt(input);
        if (isNaN(num) || num < 1 || num > 5) {
          return 'Please enter a number between 1 and 5.';
        }
        return true;
      }
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

    const searchOptions = await getSearchOptions();

    try {
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
        
        console.log("Would you like to search again?");
        console.log("1. Yes");
        console.log("2. No");
        
        const { tryAgain } = await inquirer.prompt({
          type: 'input',
          name: 'tryAgain',
          message: 'Enter your choice (1-2):',
          validate: (input) => {
            const num = parseInt(input);
            if (isNaN(num) || num < 1 || num > 2) {
              return 'Please enter 1 or 2.';
            }
            return true;
          }
        });
        
        if (tryAgain === '2') break;
        continue;
      }

      const result = await displaySearchResults(keyword, articles, searchOptions);
      if (result === 'newSearch') {
        continue;
      }
      break;

    } catch (error: any) {
      console.error("Search failed:", error.response?.data?.message || error.message);
      
      console.log("Would you like to try searching again?");
      console.log("1. Yes");
      console.log("2. No");
      
      const { tryAgain } = await inquirer.prompt({
        type: 'input',
        name: 'tryAgain',
        message: 'Enter your choice (1-2):',
        validate: (input) => {
          const num = parseInt(input);
          if (isNaN(num) || num < 1 || num > 2) {
            return 'Please enter 1 or 2.';
          }
          return true;
        }
      });
      
      if (tryAgain === '2') break;
    }
  }
}

async function getSearchOptions() {
  const options: any = {};

  // Ask about date filtering
  console.log("\nDo you want to filter by date range?");
  console.log("1. Yes");
  console.log("2. No");
  
  const { useDateFilter } = await inquirer.prompt({
    type: 'input',
    name: 'useDateFilter',
    message: 'Enter your choice (1-2):',
    validate: (input) => {
      const num = parseInt(input);
      if (isNaN(num) || num < 1 || num > 2) {
        return 'Please enter 1 or 2.';
      }
      return true;
    }
  });

  options.dateFilter = useDateFilter === '1';

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
  let currentPage = 1;
  const articlesPerPage = 10;
  const totalPages = Math.ceil(articles.length / articlesPerPage);

  while (true) {
    console.clear();
    console.log(`\nSearch Results for "${keyword}"`);
    
    // Display search filters used
    if (searchOptions.dateFilter) {
      console.log(`Date range: ${searchOptions.startDate} to ${searchOptions.endDate}`);
    }
    console.log(`🔍 ${articles.length} results found • Page ${currentPage} of ${totalPages} (showing 10 per page)\n`);

    // Get articles for current page
    const startIndex = (currentPage - 1) * articlesPerPage;
    const endIndex = Math.min(startIndex + articlesPerPage, articles.length);
    const pageArticles = articles.slice(startIndex, endIndex);

    // Display articles with better formatting including like/dislike counts
    for (let index = 0; index < pageArticles.length; index++) {
      const article = pageArticles[index];
      const articleNum = `${index + 1}`.padStart(2, '0');
      
      console.log(`${articleNum}. ${article.articleTitle}`);
      
      // Track that user viewed this article for personalization
      await trackArticleView(article.articleID, userData.userID);
      
      // Truncate content for better display
      const truncatedContent = article.articleContent.length > 150 
        ? article.articleContent.substring(0, 150) + '...'
        : article.articleContent;
      
      console.log(`       ${truncatedContent}`);
      console.log(`     Source: ${article.source}`);
      console.log(`     Published: ${dayjs(article.publishDate).format('DD-MMM-YYYY HH:mm')}`);
      console.log(`     Category: ${article.category?.categoryName || 'General'}`);
      
      // Fetch and display like/dislike counts
      const likeStats = await fetchArticleLikeStats(article.articleID);
      let voteStatus = '';
      if (likeStats.userVote === 'LIKE') {
        voteStatus = ' (You liked this)';
      } else if (likeStats.userVote === 'DISLIKE') {
        voteStatus = ' (You disliked this)';
      }
      console.log(`     Likes: ${likeStats.likesCount} | Dislikes: ${likeStats.dislikesCount}${voteStatus}`);
      
      console.log(`     URL: ${article.URL}`);
      console.log(`     ID: ${article.articleID}\n`);
    }

    // Show article selection menu for search results
    const action = await showSearchResultsMenu(articles, currentPage, totalPages, pageArticles);
    
    if (action.type === 'read' && action.articleId) {
      await handleReadArticleById(action.articleId, articles);
    } else if (action.type === 'nextPage' && currentPage < totalPages) {
      currentPage++;
    } else if (action.type === 'prevPage' && currentPage > 1) {
      currentPage--;
    } else if (action.type === 'back') {
      break;
    } else if (action.type === 'actions') {
      await postSearchActions(pageArticles);
      break;
    } else if (action.type === 'newSearch') {
      return 'newSearch';
    }
  }
}

async function showSearchResultsMenu(articles: any[], currentPage: number, totalPages: number, pageArticles: any[]): Promise<{type: string, articleId?: number}> {
  console.log("─".repeat(50));
  console.log("What would you like to do?");
  console.log("1. Read an article (enter 1-10)");
  
  if (currentPage < totalPages) {
    console.log("2. Next page");
  }
  if (currentPage > 1) {
    console.log("3. Previous page");
  }
  
  console.log("4. More actions (save, like, report, etc.)");
  console.log("5. New search");
  console.log("6. Back to main menu");

  const { action } = await inquirer.prompt({
    type: 'input',
    name: 'action',
    message: 'Enter your choice (1-6):',
    validate: (input) => {
      const num = parseInt(input);
      if (isNaN(num) || num < 1 || num > 6) {
        return 'Please enter a number between 1 and 6.';
      }
      return true;
    }
  });

  switch (action) {
    case '1':
      const { articleNum } = await inquirer.prompt({
        type: 'input',
        name: 'articleNum',
        message: `Enter article number (1-${pageArticles.length}):`,
        validate: (input) => {
          const num = parseInt(input);
          if (isNaN(num) || num < 1 || num > pageArticles.length) {
            return `Please enter a number between 1 and ${pageArticles.length}.`;
          }
          return true;
        }
      });
      const selectedArticle = pageArticles[parseInt(articleNum) - 1];
      return { type: 'read', articleId: selectedArticle.articleID };
    case '2':
      if (currentPage < totalPages) {
        return { type: 'nextPage' };
      }
      return { type: 'invalid' };
    case '3':
      if (currentPage > 1) {
        return { type: 'prevPage' };
      }
      return { type: 'invalid' };
    case '4':
      return { type: 'actions' };
    case '5':
      return { type: 'newSearch' };
    case '6':
      return { type: 'back' };
    default:
      return { type: 'invalid' };
  }
}

async function postSearchActions(articles: any[]) {
  console.log("\nWhat would you like to do?");
  console.log("1. Save an Article");
  console.log("2. Like/Dislike an Article");
  console.log("3. Report an Article");
  console.log("4. New Search");
  console.log("5. Back to Main Menu");
  console.log("6. Logout");

  const { action } = await inquirer.prompt({
    type: 'input',
    name: 'action',
    message: 'Enter your choice (1-6):',
    validate: (input) => {
      const num = parseInt(input);
      if (isNaN(num) || num < 1 || num > 6) {
        return 'Please enter a number between 1 and 6.';
      }
      return true;
    }
  });

  switch (action) {
    case '1':
      await handleSaveArticle(articles);
      break;
    case '2':
      await handleLikeDislikeArticle(articles);
      break;
    case '3':
      await handleReportArticle(articles);
      break;
    case '4':
      // Will return to search function
      break;
    case '5':
      return;
    case '6':
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
  console.log("Select an article to save:");
  
  articles.forEach((article, index) => {
    const title = article.articleTitle.length > 60 
      ? article.articleTitle.substring(0, 57) + '...'
      : article.articleTitle;
    const source = article.source ? ` (${article.source})` : '';
    console.log(`${index + 1}. ${title}${source}`);
  });
  console.log(`${articles.length + 1}. Cancel and go back`);
  
  const { articleChoice } = await inquirer.prompt({
    type: 'input',
    name: 'articleChoice',
    message: `Enter your choice (1-${articles.length + 1}):`,
    validate: (input) => {
      const num = parseInt(input);
      if (isNaN(num) || num < 1 || num > articles.length + 1) {
        return `Please enter a number between 1 and ${articles.length + 1}.`;
      }
      return true;
    }
  });

  const articleIndex = parseInt(articleChoice) - 1;

  if (articleIndex === articles.length) {
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
  let currentPage = 1;
  const articlesPerPage = 10;
  const totalPages = Math.ceil(articles.length / articlesPerPage);

  while (true) {
    console.clear();
    console.log(`\n${title}`);
    console.log("=".repeat(title.length + 10));
    console.log(`📰 ${articles.length} articles found • Page ${currentPage} of ${totalPages} (showing 10 per page)\n`);

    // Get articles for current page
    const startIndex = (currentPage - 1) * articlesPerPage;
    const endIndex = Math.min(startIndex + articlesPerPage, articles.length);
    const pageArticles = articles.slice(startIndex, endIndex);

    // Display articles with enhanced formatting including like/dislike counts
    for (let index = 0; index < pageArticles.length; index++) {
      const article = pageArticles[index];
      const articleNum = `${index + 1}`.padStart(2, '0');
      const publishDate = dayjs(article.publishDate);
      
      console.log(`${articleNum}. ${article.articleTitle}`);
      
      // Track that user viewed this article for personalization
      await trackArticleView(article.articleID, userData.userID);
      
      // Truncate content, stop at sentence boundary if possible
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
      
      console.log(`       ${truncatedContent}`);
      console.log(`     Source: ${article.source || 'General'}`);
      
      // Enhanced date display without time ago
      const fullDate = publishDate.format('DD-MMM-YYYY HH:mm');
      console.log(`     Published: ${fullDate}`);
      
      console.log(`     Category: ${article.category?.categoryName || 'General'}`);
      
      // Fetch and display like/dislike counts
      const likeStats = await fetchArticleLikeStats(article.articleID);
      let voteStatus = '';
      if (likeStats.userVote === 'LIKE') {
        voteStatus = ' (You liked this)';
      } else if (likeStats.userVote === 'DISLIKE') {
        voteStatus = ' (You disliked this)';
      }
      console.log(`     Likes: ${likeStats.likesCount} | Dislikes: ${likeStats.dislikesCount}${voteStatus}`);
      
      // URL display with length check
      const url = article.URL || 'No URL available';
      const displayUrl = url.length > 60 ? url.substring(0, 57) + '...' : url;
      console.log(`     URL: ${displayUrl}`);
      
      console.log(`     ID: ${article.articleID}`);
      console.log(); // Add spacing between articles
    }

    // Show article selection menu
    const action = await showArticleSelectionMenu(articles, currentPage, totalPages, pageArticles);
    
    if (action.type === 'read' && action.articleId) {
      await handleReadArticleById(action.articleId, articles);
    } else if (action.type === 'nextPage' && currentPage < totalPages) {
      currentPage++;
    } else if (action.type === 'prevPage' && currentPage > 1) {
      currentPage--;
    } else if (action.type === 'back') {
      break;
    } else if (action.type === 'actions') {
      await postHeadlinesActions(pageArticles);
      break;
    }
  }
}

async function postHeadlinesActions(articles: any[]) {
  console.log("─".repeat(50));
  console.log("What would you like to do next?");
  console.log("1. Read Full Article");
  console.log("2. Save an Article to Your Collection");
  console.log("3. Like/Dislike an Article");
  console.log("4. Report an Article");
  console.log("5. Back to Headlines Menu");
  console.log("6. Return to Main Menu");
  console.log("7. Logout");

  const { action } = await inquirer.prompt({
    type: 'input',
    name: 'action',
    message: 'Enter your choice (1-7):',
    validate: (input) => {
      const num = parseInt(input);
      if (isNaN(num) || num < 1 || num > 7) {
        return 'Please enter a number between 1 and 7.';
      }
      return true;
    }
  });

  switch (action) {
    case '1':
      await handleReadArticle(articles);
      // After reading, show actions again
      await postHeadlinesActions(articles);
      break;
    case '2':
      await handleSaveArticle(articles);
      // After saving, show actions again
      await postHeadlinesActions(articles);
      break;
    case '3':
      await handleLikeDislikeArticle(articles);
      // After liking/disliking, show actions again
      await postHeadlinesActions(articles);
      break;
    case '4':
      await handleReportArticle(articles);
      // After reporting, show actions again
      await postHeadlinesActions(articles);
      break;
    case '5':
      // Returns to headlines submenu
      return;
    case '6':
      // Exit completely to main menu
      return;
    case '7':
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
    const cat = article.category?.categoryName || 'General';
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
    const source = article.source || 'General';
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
    console.log(` Recent (last 24h): ${recentCount} articles`);
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

    // Extract articles from saved articles data structure
    const articles = savedArticles.map((entry: any) => entry.article);
    
    await displaySavedArticlesPaginated(`Saved Articles for ${userName}`, articles);
    
  } catch (error: any) {
    console.error("Error fetching saved articles:", error.response?.data?.message || error.message);
  }
}

async function displaySavedArticlesPaginated(title: string, articles: any[]) {
  let currentPage = 1;
  const articlesPerPage = 10;
  const totalPages = Math.ceil(articles.length / articlesPerPage);

  while (true) {
    console.clear();
    console.log(`\n${title}`);
    console.log("=".repeat(title.length + 10));
    console.log(`💾 ${articles.length} saved articles • Page ${currentPage} of ${totalPages} (showing 10 per page)\n`);

    // Get articles for current page
    const startIndex = (currentPage - 1) * articlesPerPage;
    const endIndex = Math.min(startIndex + articlesPerPage, articles.length);
    const pageArticles = articles.slice(startIndex, endIndex);
    
    // Display saved articles with like/dislike counts
    for (let index = 0; index < pageArticles.length; index++) {
      const article = pageArticles[index];
      const articleNum = `${index + 1}`.padStart(2, '0');
      
      console.log(`${articleNum}. ${article.articleTitle}`);
      
      // Track that user viewed this article for personalization
      await trackArticleView(article.articleID, userData.userID);
      
      // Truncate content for better display
      const truncatedContent = article.articleContent.length > 150 
        ? article.articleContent.substring(0, 150) + '...'
        : article.articleContent;
      
      console.log(`       ${truncatedContent}`);
      console.log(`     Source: ${article.source}`);
      console.log(`     Published: ${dayjs(article.publishDate).format('DD-MMM-YYYY HH:mm')}`);
      console.log(`     Category: ${article.category?.categoryName || 'General'}`);
      
      // Fetch and display like/dislike counts
      const likeStats = await fetchArticleLikeStats(article.articleID);
      let voteStatus = '';
      if (likeStats.userVote === 'LIKE') {
        voteStatus = ' (You liked this)';
      } else if (likeStats.userVote === 'DISLIKE') {
        voteStatus = ' (You disliked this)';
      }
      console.log(`     Likes: ${likeStats.likesCount} | Dislikes: ${likeStats.dislikesCount}${voteStatus}`);
      
      console.log(`     URL: ${article.URL}`);
      console.log(`     ID: ${article.articleID}\n`);
    }

    // Show article selection menu for saved articles
    const action = await showArticleSelectionMenu(articles, currentPage, totalPages, pageArticles);
    
    if (action.type === 'read' && action.articleId) {
      await handleReadArticleById(action.articleId, articles);
    } else if (action.type === 'nextPage' && currentPage < totalPages) {
      currentPage++;
    } else if (action.type === 'prevPage' && currentPage > 1) {
      currentPage--;
    } else if (action.type === 'back') {
      break;
    } else if (action.type === 'actions') {
      await postHeadlinesActions(pageArticles);
      break;
    }
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
    } catch (error: any) {
      console.error("Failed to fetch notification count:", error.response?.data?.message || error.message);
      console.log("You can still view and manage your notifications."); 
    }

    console.log("\nWhat would you like to do?");
    console.log("1. View Notifications");
    console.log("2. Configure Notification Preferences");
    console.log("3. Back to Main Menu");
    console.log("4. Logout");

    const { choice } = await inquirer.prompt({
      type: "input",
      name: "choice",
      message: "Enter your choice (1-4):",
      validate: (input) => {
        const num = parseInt(input);
        if (isNaN(num) || num < 1 || num > 4) {
          return 'Please enter a number between 1 and 4.';
        }
        return true;
      }
    });

    switch (choice) {
      case "1":
        await viewNotifications(userID);
        break;
      case "2":
        await configureNotifications(userID);
        break;
      case "3":
        return; // Go back to main menu
      case "4":
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

    // Continuation prompt
    await inquirer.prompt({
      type: "input",
      name: "continue",
      message: "Press Enter to continue..."
    });

  } catch (error: any) {
    console.error("Failed to fetch notifications:", error.response?.data?.message || error.message);
  }
}

async function configureNotifications(userID: number) {
  try {
    // Main configuration menu loop
    while (true) {
      // Get current config and available categories (refresh each time)
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

      console.log("\n--- What would you like to do? ---");
      console.log("1. Manage Category Subscriptions");
      console.log("2. Manage Keyword Alerts");
      console.log("3. Email Notification Settings");
      console.log("4. Save & Exit");
      console.log("5. Cancel Changes");
      
      const { mainChoice } = await inquirer.prompt({
        type: "input",
        name: "mainChoice",
        message: "Enter your choice (1-5):",
        validate: (input) => {
          const num = parseInt(input);
          if (isNaN(num) || num < 1 || num > 5) {
            return 'Please enter a number between 1 and 5.';
          }
          return true;
        }
      });

      if (mainChoice === "1") {
        await manageCategorySubscriptions(userID, availableCategories, currentEnabledIds);
        // Continue loop to refresh the display
      } else if (mainChoice === "2") {
        await manageKeywordAlerts(userID, currentKeywords);
        // Continue loop to refresh the display
      } else if (mainChoice === "3") {
        await manageEmailSettings(userID, config);
        // Continue loop to refresh the display
      } else if (mainChoice === "4") {
        console.log("\nAll changes saved! You'll receive notifications based on your preferences.");
        break;
      } else if (mainChoice === "5") {
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
  console.log("Current category subscriptions:");
  
  // Show current selections
  availableCategories.forEach((cat, index) => {
    const isEnabled = currentEnabledIds.includes(cat.categoryID);
    const status = isEnabled ? "[ENABLED]" : "[DISABLED]";
    console.log(`${index + 1}. ${cat.categoryName} ${status}`);
  });
  
  console.log("\nEnter category numbers to toggle (separate multiple with commas, e.g., 1,3,5):");
  console.log("Or press Enter to keep current selections.");

  const { categoryInput } = await inquirer.prompt({
    type: "input",
    name: "categoryInput",
    message: "Enter category numbers to toggle:",
    validate: (input) => {
      if (input.trim() === '') return true; // Allow empty input
      
      const numbers = input.split(',').map(n => n.trim());
      for (const num of numbers) {
        const parsed = parseInt(num);
        if (isNaN(parsed) || parsed < 1 || parsed > availableCategories.length) {
          return `Please enter valid numbers between 1 and ${availableCategories.length}, separated by commas.`;
        }
      }
      return true;
    }
  });

  if (categoryInput.trim() === '') {
    console.log("\nNo changes made.");
    return;
  }

  let selectedCategories = [...currentEnabledIds]; // Start with current selections

  const toggleNumbers = categoryInput.split(',').map((n: string) => parseInt(n.trim()));
  
  toggleNumbers.forEach((num: number) => {
    const category = availableCategories[num - 1];
    const categoryID = category.categoryID;
    const index = selectedCategories.indexOf(categoryID);
    
    if (index > -1) {
      // Remove if already selected
      selectedCategories.splice(index, 1);
      console.log(`✓ Disabled: ${category.categoryName}`);
    } else {
      // Add if not selected
      selectedCategories.push(categoryID);
      console.log(`✓ Enabled: ${category.categoryName}`);
    }
  });

  // Update the configuration
  try {
    console.log("\nUpdating notification preferences...");
    await axios.post(`${BASE_URL}/notifications/config`, {
      userId: userID,
      enabledCategoryIds: selectedCategories
    });

    const selectedNames = availableCategories
      .filter(cat => selectedCategories.includes(cat.categoryID))
      .map(cat => cat.categoryName);

    if (selectedNames.length > 0) {
      console.log(`\nSubscribed to: ${selectedNames.join(", ")}`);
    } else {
      console.log("\nUnsubscribed from all categories");
    }
    
    console.log("✅ Changes saved successfully!");
  } catch (error: any) {
    console.error("❌ Failed to update categories:", error.response?.data?.message || error.message);
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
    console.log("\nWhat would you like to do?");
    console.log("1. Add new keywords");
    console.log("2. Remove keywords");
    console.log("3. Replace all keywords");
    console.log("4. Back to main menu");
    
    const { keywordAction } = await inquirer.prompt({
      type: "input",
      name: "keywordAction",
      message: "Enter your choice (1-4):",
      validate: (input) => {
        const num = parseInt(input);
        if (isNaN(num) || num < 1 || num > 4) {
          return 'Please enter a number between 1 and 4.';
        }
        return true;
      }
    });

    if (keywordAction === "1") {
      await addKeywords(userID, currentKeywords);
    } else if (keywordAction === "2") {
      await removeKeywords(userID, currentKeywords);
    } else if (keywordAction === "3") {
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

  console.log("\nCurrent keywords:");
  currentKeywords.forEach((keyword, index) => {
    console.log(`${index + 1}. ${keyword}`);
  });
  
  console.log("\nEnter keyword numbers to remove (separate multiple with commas, e.g., 1,3,5):");

  const { keywordInput } = await inquirer.prompt({
    type: "input",
    name: "keywordInput",
    message: "Enter keyword numbers to remove:",
    validate: (input) => {
      if (input.trim() === '') {
        return 'Please enter at least one keyword number to remove.';
      }
      
      const numbers = input.split(',').map((n: string) => n.trim());
      for (const num of numbers) {
        const parsed = parseInt(num);
        if (isNaN(parsed) || parsed < 1 || parsed > currentKeywords.length) {
          return `Please enter valid numbers between 1 and ${currentKeywords.length}, separated by commas.`;
        }
      }
      return true;
    }
  });

  const removeNumbers = keywordInput.split(',').map((n: string) => parseInt(n.trim()));
  const keywordsToRemove = removeNumbers.map((num: number) => currentKeywords[num - 1]);

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

  console.log("\nEnable email notifications?");
  console.log("1. Yes");
  console.log("2. No");

  const { emailEnabled } = await inquirer.prompt({
    type: "input",
    name: "emailEnabled",
    message: "Enter your choice (1-2):",
    validate: (input) => {
      const num = parseInt(input);
      if (isNaN(num) || num < 1 || num > 2) {
        return 'Please enter 1 or 2.';
      }
      return true;
    }
  });

  const enableEmail = emailEnabled === '1';

  try {
    await axios.post(`${BASE_URL}/notifications/config`, {
      userId: userID,
      emailNotificationsEnabled: enableEmail
    });

    console.log(`\n Email notifications ${enableEmail ? "enabled" : "disabled"}`);
  } catch (error: any) {
    console.error(" Failed to update email settings:", error.response?.data?.message || error.message);
  }
}

// Function to fetch like/dislike stats for an article
async function fetchArticleLikeStats(articleId: number): Promise<{ likesCount: number; dislikesCount: number; userVote?: string | null }> {
  try {
    const response = await axios.get(`${BASE_URL}/articles/${articleId}/likes`, {
      params: { userId: userData.userID }
    });
    return response.data;
  } catch (error) {
    // Return default values if fetching fails
    return { likesCount: 0, dislikesCount: 0, userVote: null };
  }
}

// Function to handle like/dislike article interaction
async function handleLikeDislikeArticle(articles: any[]) {
  console.log("\nLike/Dislike an Article");
  console.log("=".repeat(30));

  // Show available articles with current like/dislike status
  console.log("\nAvailable articles:");
  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];
    const likeStats = await fetchArticleLikeStats(article.articleID);
    let voteStatus = '';
    if (likeStats.userVote === 'LIKE') {
      voteStatus = ' (You liked this)';
    } else if (likeStats.userVote === 'DISLIKE') {
      voteStatus = ' (You disliked this)';
    }
    console.log(`${i + 1}. ${article.articleTitle.substring(0, 50)}...`);
    console.log(`   Likes: ${likeStats.likesCount} | Dislikes: ${likeStats.dislikesCount}${voteStatus}`);
  }

  const { articleChoice } = await inquirer.prompt({
    type: 'input',
    name: 'articleChoice',
    message: 'Enter the article number (1-' + articles.length + '):',
    validate: (input) => {
      const num = parseInt(input);
      if (isNaN(num) || num < 1 || num > articles.length) {
        return 'Please enter a valid article number.';
      }
      return true;
    }
  });

  const selectedArticle = articles[parseInt(articleChoice) - 1];
  const currentStats = await fetchArticleLikeStats(selectedArticle.articleID);

  console.log(`\nSelected: ${selectedArticle.articleTitle}`);
  console.log(`Current status: Likes: ${currentStats.likesCount} | Dislikes: ${currentStats.dislikesCount}`);
  if (currentStats.userVote) {
    console.log(`Your current vote: ${currentStats.userVote === 'LIKE' ? 'Liked' : 'Disliked'}`);
  } else {
    console.log('You have not voted on this article yet.');
  }

  console.log("\nWhat would you like to do?");
  console.log("1. Like this article");
  console.log("2. Dislike this article");
  console.log("3. Remove my vote");
  console.log("4. Cancel");

  const { voteAction } = await inquirer.prompt({
    type: 'input',
    name: 'voteAction',
    message: 'Enter your choice (1-4):',
    validate: (input) => {
      const num = parseInt(input);
      if (isNaN(num) || num < 1 || num > 4) {
        return 'Please enter a number between 1 and 4.';
      }
      return true;
    }
  });

  if (voteAction === '4') {
    return;
  }

  try {
    switch (voteAction) {
      case '1':
        await axios.post(`${BASE_URL}/articles/${selectedArticle.articleID}/like`, null, {
          params: { userId: userData.userID }
        });
        console.log('Article liked successfully!');
        break;
      case '2':
        await axios.post(`${BASE_URL}/articles/${selectedArticle.articleID}/dislike`, null, {
          params: { userId: userData.userID }
        });
        console.log('Article disliked successfully!');
        break;
      case '3':
        await axios.delete(`${BASE_URL}/articles/${selectedArticle.articleID}/like`, {
          params: { userId: userData.userID }
        });
        console.log('Vote removed successfully!');
        break;
    }

    // Show updated stats
    const updatedStats = await fetchArticleLikeStats(selectedArticle.articleID);
    console.log(`Updated status: Likes: ${updatedStats.likesCount} | Dislikes: ${updatedStats.dislikesCount}`);
    
  } catch (error: any) {
    if (error.response?.status === 400) {
      console.log('Note:', error.response.data.message);
    } else {
      console.error('Error updating vote:', error.response?.data?.message || error.message);
    }
  }
}

async function handleReportArticle(articles: any[]) {
  if (articles.length === 0) {
    console.log("No articles available to report.");
    return;
  }

  console.log("\nReport an Article");
  console.log("=".repeat(20));
  console.log("Select an article to report:");
  
  articles.forEach((article: any, index: number) => {
    const title = article.articleTitle.length > 60 
      ? article.articleTitle.substring(0, 57) + '...'
      : article.articleTitle;
    console.log(`${index + 1}. ${title}`);
  });

  const { articleChoice } = await inquirer.prompt({
    type: 'input',
    name: 'articleChoice',
    message: `Enter article number (1-${articles.length}):`,
    validate: (input) => {
      const num = parseInt(input);
      if (isNaN(num) || num < 1 || num > articles.length) {
        return `Please enter a number between 1 and ${articles.length}.`;
      }
      return true;
    }
  });

  const selectedArticle = articles[parseInt(articleChoice) - 1];
  
  console.log(`\nReporting: "${selectedArticle.articleTitle}"`);
  console.log("Confirm report:");
  console.log("1. Yes, report this article");
  console.log("2. Cancel");

  const { confirm } = await inquirer.prompt({
    type: 'input',
    name: 'confirm',
    message: 'Enter your choice (1-2):',
    validate: (input) => ['1', '2'].includes(input) || 'Please enter 1 or 2.'
  });

  if (confirm === '1') {
    try {
      const response = await axios.post(`${BASE_URL}/articles/${selectedArticle.articleID}/report`, {
        userId: userData.userID
      });

      if (response.data.success) {
        console.log('\n✓ Article reported successfully. Admin will review it.');
      } else {
        console.log('\n✗ Failed to report article:', response.data.message);
      }
    } catch (error: any) {
      console.error('\n✗ Error reporting article:', error.response?.data?.message || error.message);
    }
  } else {
    console.log('\nReport cancelled.');
  }
}

async function handleReadArticle(articles: any[]) {
  if (articles.length === 0) {
    console.log("No articles available to read.");
    return;
  }

  console.log("\nRead Full Article");
  console.log("=".repeat(20));
  console.log("Select an article to read:");
  
  articles.forEach((article, index) => {
    const title = article.articleTitle.length > 60 
      ? article.articleTitle.substring(0, 57) + '...'
      : article.articleTitle;
    const source = article.source ? ` (${article.source})` : '';
    const category = article.category?.categoryName ? ` [${article.category.categoryName}]` : '';
    console.log(`${index + 1}. ${title}${source}${category}`);
  });
  console.log(`${articles.length + 1}. Cancel and go back`);
  
  const { articleChoice } = await inquirer.prompt({
    type: 'input',
    name: 'articleChoice',
    message: `Enter your choice (1-${articles.length + 1}):`,
    validate: (input) => {
      const num = parseInt(input);
      if (isNaN(num) || num < 1 || num > articles.length + 1) {
        return `Please enter a number between 1 and ${articles.length + 1}.`;
      }
      return true;
    }
  });

  const articleIndex = parseInt(articleChoice) - 1;

  if (articleIndex === articles.length) {
    console.log("Reading cancelled.");
    return;
  }

  const selectedArticle = articles[articleIndex];
  
  try {
    // Display the full article
    await displayFullArticle(selectedArticle);
    
    // Mark article as read and award points
    await markArticleAsRead(selectedArticle.articleID, userData.userID);
    
    // Show post-reading options
    await showPostReadingOptions(selectedArticle);
    
  } catch (err: any) {
    console.error("Error reading article:", err.response?.data?.message || err.message);
    console.log("Please try again or contact support if the issue persists.\n");
  }
}

async function displayFullArticle(article: any) {
  const publishDate = dayjs(article.publishDate);
  const fullDate = publishDate.format('DD-MMM-YYYY HH:mm');
  
  console.clear();
  console.log("┌" + "─".repeat(80) + "┐");
  console.log("│" + " ".repeat(30) + "FULL ARTICLE" + " ".repeat(38) + "│");
  console.log("└" + "─".repeat(80) + "┘");
  
  console.log(`\n📰 ${article.articleTitle}`);
  console.log("=".repeat(article.articleTitle.length + 4));
  
  console.log(`📅 Published: ${fullDate}`);
  console.log(`📂 Category: ${article.category?.categoryName || 'General'}`);
  console.log(`📰 Source: ${article.source || 'General'}`);
  if (article.URL) {
    console.log(`🔗 URL: ${article.URL}`);
  }
  console.log();
  
  // Display content with word wrapping
  const content = article.articleContent || 'No content available.';
  const wrappedContent = wrapText(content, 80);
  console.log(wrappedContent);
  
  console.log("\n" + "─".repeat(80));
}

function wrapText(text: string, maxWidth: number): string {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
  for (const word of words) {
    if ((currentLine + word).length > maxWidth) {
      if (currentLine) {
        lines.push(currentLine.trim());
        currentLine = word + ' ';
      } else {
        // Word is longer than maxWidth, split it
        lines.push(word);
        currentLine = '';
      }
    } else {
      currentLine += word + ' ';
    }
  }
  
  if (currentLine) {
    lines.push(currentLine.trim());
  }
  
  return lines.join('\n');
}

async function markArticleAsRead(articleId: number, userId: number) {
  try {
    // Call the user history endpoint to mark as read
    const response = await axios.post(`${BASE_URL}/user-history/read/${articleId}`, {
      userId: userId
    });
    
  } catch (error: any) {
    if (error.response?.status === 409) {
      // Article already read - silent handling
    } else {
      console.error("❌ Failed to mark article as read:", error.response?.data?.message || error.message);
    }
  }
}

async function showPostReadingOptions(article: any) {
  console.log("\n📋 What would you like to do with this article?");
  console.log("1. Save to My Collection");
  console.log("2. Like this Article");
  console.log("3. Dislike this Article");
  console.log("4. Share Article URL");
  console.log("5. Report Article");
  console.log("6. Read Another Article");
  console.log("7. Back to Headlines");

  const { action } = await inquirer.prompt({
    type: 'input',
    name: 'action',
    message: 'Enter your choice (1-7):',
    validate: (input) => {
      const num = parseInt(input);
      if (isNaN(num) || num < 1 || num > 7) {
        return 'Please enter a number between 1 and 7.';
      }
      return true;
    }
  });

  switch (action) {
    case '1':
      await handleSaveSpecificArticle(article);
      break;
    case '2':
      await handleLikeSpecificArticle(article, true);
      break;
    case '3':
      await handleLikeSpecificArticle(article, false);
      break;
    case '4':
      console.log(`\n🔗 Article URL: ${article.URL || 'No URL available'}`);
      console.log("You can copy and share this URL.");
      break;
    case '5':
      await handleReportSpecificArticle(article);
      break;
    case '6':
    case '7':
      // Return to previous menu
      return;
  }
}

async function handleSaveSpecificArticle(article: any) {
  try {
    console.log(`\nSaving "${article.articleTitle}"...`);
    
    await axios.post(`${BASE_URL}/saved-articles`, {
      userId: userData.userID,
      articleId: article.articleID,
    });
    
    console.log(`✅ Article saved successfully!`);
    console.log(`"${article.articleTitle}" has been added to your collection.`);
    
  } catch (err: any) {
    if (err.response?.status === 409) {
      console.log(`ℹ️  Article already saved!`);
      console.log(`"${article.articleTitle}" is already in your collection.`);
    } else {
      console.error("❌ Save failed:", err.response?.data?.message || err.message);
    }
  }
}

async function handleLikeSpecificArticle(article: any, isLike: boolean) {
  try {
    const action = isLike ? 'like' : 'dislike';
    console.log(`\n${isLike ? '👍' : '👎'} ${isLike ? 'Liking' : 'Disliking'} article...`);
    
    await axios.post(`${BASE_URL}/article-likes`, {
      userId: userData.userID,
      articleId: article.articleID,
      action: action
    });
    
    console.log(`✅ You ${isLike ? 'liked' : 'disliked'} "${article.articleTitle}"`);
    console.log("🎯 This helps improve your personalized recommendations!");
    
  } catch (err: any) {
    console.error(`❌ Failed to ${isLike ? 'like' : 'dislike'} article:`, err.response?.data?.message || err.message);
  }
}

async function handleReportSpecificArticle(article: any) {
  console.log(`\n⚠️  Reporting "${article.articleTitle}"`);
  
  console.log("Confirm report:");
  console.log("1. Yes, report this article");
  console.log("2. Cancel");

  const { confirm } = await inquirer.prompt({
    type: 'input',
    name: 'confirm',
    message: 'Enter your choice (1-2):',
    validate: (input) => ['1', '2'].includes(input) || 'Please enter 1 or 2.'
  });

  if (confirm === '2') {
    console.log("Report cancelled.");
    return;
  }

  try {
    await axios.post(`${BASE_URL}/articles/${article.articleID}/report`, {
      userId: userData.userID
    });

    console.log("✅ Article reported successfully.");
    console.log("🔍 Our team will review this report. Thank you for helping maintain quality content.");

  } catch (err: any) {
    console.error("❌ Failed to report article:", err.response?.data?.message || err.message);
  }
}

// Function to track user article views for personalization
async function trackArticleView(articleId: number, userId: number) {
  try {
    await axios.post(`${BASE_URL}/user-history`, {
      userId: userId,
      articleId: articleId
    });
  } catch (error: any) {
    // Silently fail - don't disrupt user experience for tracking
  }
}

async function showArticleSelectionMenu(articles: any[], currentPage: number, totalPages: number, pageArticles: any[]): Promise<{type: string, articleId?: number, articleIndex?: number}> {
  console.log("─".repeat(50));
  console.log("What would you like to do?");
  console.log("1. Read an article (enter 1-10)");
  
  if (currentPage < totalPages) {
    console.log("2. Next page");
  }
  if (currentPage > 1) {
    console.log("3. Previous page");
  }
  
  console.log("4. More actions (save, like, report, etc.)");
  console.log("5. Back to main menu");

  const { action } = await inquirer.prompt({
    type: 'input',
    name: 'action',
    message: 'Enter your choice (1-5):',
    validate: (input) => {
      const num = parseInt(input);
      if (isNaN(num) || num < 1 || num > 5) {
        return 'Please enter a number between 1 and 5.';
      }
      return true;
    }
  });

  switch (action) {
    case '1':
      const { articleNum } = await inquirer.prompt({
        type: 'input',
        name: 'articleNum',
        message: `Enter article number (1-${pageArticles.length}):`,
        validate: (input) => {
          const num = parseInt(input);
          if (isNaN(num) || num < 1 || num > pageArticles.length) {
            return `Please enter a number between 1 and ${pageArticles.length}.`;
          }
          return true;
        }
      });
      const selectedArticle = pageArticles[parseInt(articleNum) - 1];
      return { type: 'read', articleId: selectedArticle.articleID, articleIndex: parseInt(articleNum) - 1 };
    case '2':
      if (currentPage < totalPages) {
        return { type: 'nextPage' };
      }
      return { type: 'invalid' };
    case '3':
      if (currentPage > 1) {
        return { type: 'prevPage' };
      }
      return { type: 'invalid' };
    case '4':
      return { type: 'actions' };
    case '5':
      return { type: 'back' };
    default:
      return { type: 'invalid' };
  }
}

async function handleReadArticleById(articleId: number, articles: any[]) {
  const article = articles.find(a => a.articleID === articleId);
  
  if (!article) {
    console.log("❌ Article not found.");
    return;
  }

  try {
    // Display the full article
    await displayFullArticle(article);
    
    // Mark article as read and award points (simplified without verbose messages)
    await markArticleAsRead(article.articleID, userData.userID);
    
    // Show post-reading options
    await showPostReadingOptions(article);
    
  } catch (err: any) {
    console.error("Error reading article:", err.response?.data?.message || err.message);
    console.log("Please try again or contact support if the issue persists.\n");
  }
}
