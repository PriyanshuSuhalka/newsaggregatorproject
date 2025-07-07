import inquirer from 'inquirer';
import axios from 'axios';

const BASE_URL = 'http://localhost:8000';
let adminData: { userEmail: string; userID: number };

export async function showAdminMenu(userEmail: string) {
  // Fetch admin user data
  try {
    console.log('Fetching admin user data...');
    const res = await axios.get(`${BASE_URL}/auth/user`, { params: { email: userEmail } });
    adminData = { userEmail, userID: res.data.userID };
    console.log('Admin data loaded successfully.');
  } catch (error: any) {
    console.error('Failed to fetch admin data:');
    console.error('Error details:', error.response?.data || error.message);
    
    // Fallback: try to continue without user ID (some functions won't work)
    console.log('Continuing with limited functionality...');
    adminData = { userEmail, userID: 0 };
  }

  while (true) {
    console.log('\n--- Admin Menu ---');
    console.log('1. View external servers and status');
    console.log('2. View server details');
    console.log('3. Edit server');
    console.log('4. Add news category');
    console.log('5. Content Moderation');
    console.log('6. Logout');
    
    const { choice } = await inquirer.prompt({
      type: 'input',
      name: 'choice',
      message: 'Enter your choice (1-6):',
      validate: (input) =>
        ['1', '2', '3', '4', '5', '6'].includes(input) || 'Enter a valid number (1-6)',
    });

    switch (choice) {
      case '1':
        await viewExternalServers();
        break;
      case '2':
        await viewServerDetails();
        break;
      case '3':
        await updateServer();
        break;
      case '4':
        await addCategory();
        break;
      case '5':
        await contentModerationMenu();
        break;
      case '6':
        console.log('Logged out.');
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
    console.error('Error:', error.response?.data?.message || error.message);
  }
}

async function viewServerDetails() {
  try {
    const res = await axios.get(`${BASE_URL}/external-servers`);
    const servers = res.data;

    console.log('\nList of external server details:');
    console.log('=====================================');
    
    if (servers.length === 0) {
      console.log('No external servers configured.');
      return;
    }

    servers.forEach((server: any, index: number) => {
      const keyDisplay = server.key || '<not set>';
      const statusIcon = server.status === 'Active' ? '🟢' : '🔴';
      
      console.log(`${index + 1}. ${server.name}`);
      console.log(`   ${statusIcon} Status: ${server.status}`);
      console.log(`   🔑 API Key: ${keyDisplay}`);
      console.log(`   📅 Last Accessed: ${server.lastAccessed}`);
      
      if (index < servers.length - 1) {
        console.log('   ---');
      }
    });
    
    console.log('=====================================');
  } catch (error: any) {
    console.error('Error:', error.response?.data?.message || error.message);
  }
}

async function updateServer() {
  try {
    // First, get the list of servers
    const res = await axios.get(`${BASE_URL}/external-servers`);
    const servers = res.data;

    if (servers.length === 0) {
      console.log('No external servers available to update.');
      return;
    }

    console.log('\nAvailable servers:');
    servers.forEach((server: any, index: number) => {
      console.log(`${server.id}. ${server.name} - Key: ${server.key || '<not set>'}`);
    });

    const { id, key } = await inquirer.prompt([
      { 
        type: 'input', 
        name: 'id', 
        message: 'Enter external server ID:', 
        validate: (input) => {
          const serverId = parseInt(input);
          const serverExists = servers.find((s: any) => s.id === serverId);
          return serverExists ? true : 'Invalid server ID. Please choose from the list above.';
        }
      },
      { 
        type: 'input', 
        name: 'key', 
        message: 'Enter the new API key:',
        validate: (input) => input.trim().length > 0 ? true : 'API key cannot be empty.'
      },
    ]);

    const updateRes = await axios.put(`${BASE_URL}/external-servers/${id}`, { key });
    console.log('✅ API key updated successfully:', updateRes.data);
    
    // Show updated server details
    const selectedServer = servers.find((s: any) => s.id === parseInt(id));
    if (selectedServer) {
      console.log(`🔑 ${selectedServer.name} API key has been updated.`);
    }
    
  } catch (error: any) {
    console.error('❌ Update failed:', error.response?.data?.message || error.message);
  }
}

async function addCategory() {
  const { categoryName } = await inquirer.prompt({
    type: 'input',
    name: 'categoryName',
    message: 'Enter new category name:',
  });

  try {
    const res = await axios.post(`${BASE_URL}/categories`, { categoryName });
    console.log('Category added:', res.data);
  } catch (error: any) {
    console.error('Failed to add category:', error.response?.data?.message || error.message);
  }
}

async function contentModerationMenu() {
  while (true) {
    console.log('\n=== Content Moderation ===');
    console.log('1. View Article Reports');
    console.log('2. Hide/Unhide Articles');
    console.log('3. Hide/Unhide Categories');
    console.log('4. Manage Blocked Keywords');
    console.log('5. Back to Main Menu');
    
    const { choice } = await inquirer.prompt({
      type: 'input',
      name: 'choice',
      message: 'Enter your choice (1-5):',
      validate: (input) =>
        ['1', '2', '3', '4', '5'].includes(input) || 'Enter a valid number (1-5)',
    });

    switch (choice) {
      case '1':
        await viewArticleReports();
        break;
      case '2':
        await manageArticles();
        break;
      case '3':
        await manageCategories();
        break;
      case '4':
        await manageBlockedKeywords();
        break;
      case '5':
        return;
    }
  }
}

async function viewArticleReports() {
  try {
    const res = await axios.get(`${BASE_URL}/admin/reports`);
    const reports = res.data;

    if (reports.length === 0) {
      console.log('\nNo article reports found.');
      return;
    }

    console.log('\n=== Article Reports ===');
    reports.forEach((report: any, index: number) => {
      console.log(`\n${index + 1}. Article: "${report.article.articleTitle}"`);
      console.log(`   Reported by: ${report.user.name} (${report.user.email})`);
      console.log(`   Report date: ${new Date(report.createdAt).toLocaleDateString()}`);
      console.log(`   Article ID: ${report.article.articleID}`);
    });

    console.log('\nActions:');
    console.log('1. Hide an article');
    console.log('2. Back to moderation menu');
    
    const { action } = await inquirer.prompt({
      type: 'input',
      name: 'action',
      message: 'Enter your choice (1-2):',
      validate: (input) => ['1', '2'].includes(input) || 'Enter 1 or 2',
    });

    if (action === '1') {
      const { articleId } = await inquirer.prompt({
        type: 'input',
        name: 'articleId',
        message: 'Enter Article ID to hide:',
        validate: (input) => !isNaN(parseInt(input)) || 'Enter a valid article ID',
      });

      await hideArticle(parseInt(articleId));
    }
  } catch (error: any) {
    console.error('Error fetching reports:', error.response?.data?.message || error.message);
  }
}

async function manageArticles() {
  console.log('\n=== Article Management ===');
  console.log('1. Hide an article');
  console.log('2. Unhide an article');
  console.log('3. Back');
  
  const { choice } = await inquirer.prompt({
    type: 'input',
    name: 'choice',
    message: 'Enter your choice (1-3):',
    validate: (input) => ['1', '2', '3'].includes(input) || 'Enter 1, 2, or 3',
  });

  if (choice === '1') {
    const { articleId } = await inquirer.prompt({
      type: 'input',
      name: 'articleId',
      message: 'Enter Article ID to hide:',
      validate: (input) => !isNaN(parseInt(input)) || 'Enter a valid article ID',
    });
    await hideArticle(parseInt(articleId));
  } else if (choice === '2') {
    const { articleId } = await inquirer.prompt({
      type: 'input',
      name: 'articleId',
      message: 'Enter Article ID to unhide:',
      validate: (input) => !isNaN(parseInt(input)) || 'Enter a valid article ID',
    });
    await unhideArticle(parseInt(articleId));
  }
}

async function hideArticle(articleId: number) {
  try {
    const res = await axios.post(`${BASE_URL}/admin/articles/${articleId}/hide`, {
      adminId: adminData.userID
    });
    
    if (res.data.success) {
      console.log('\n✓ Article hidden successfully');
    } else {
      console.log('\n✗ Failed to hide article:', res.data.message);
    }
  } catch (error: any) {
    console.error('Error hiding article:', error.response?.data?.message || error.message);
  }
}

async function unhideArticle(articleId: number) {
  try {
    const res = await axios.post(`${BASE_URL}/admin/articles/${articleId}/unhide`, {
      adminId: adminData.userID
    });
    
    if (res.data.success) {
      console.log('\n✓ Article unhidden successfully');
    } else {
      console.log('\n✗ Failed to unhide article:', res.data.message);
    }
  } catch (error: any) {
    console.error('Error unhiding article:', error.response?.data?.message || error.message);
  }
}

async function manageCategories() {
  try {
    const res = await axios.get(`${BASE_URL}/admin/categories`);
    const categories = res.data;

    console.log('\n=== Categories ===');
    categories.forEach((cat: any, index: number) => {
      const status = cat.isHidden ? '[HIDDEN]' : '[VISIBLE]';
      console.log(`${index + 1}. ${cat.categoryName} ${status} (ID: ${cat.categoryID})`);
    });

    console.log('\nActions:');
    console.log('1. Hide a category');
    console.log('2. Unhide a category');
    console.log('3. Back');
    
    const { action } = await inquirer.prompt({
      type: 'input',
      name: 'action',
      message: 'Enter your choice (1-3):',
      validate: (input) => ['1', '2', '3'].includes(input) || 'Enter 1, 2, or 3',
    });

    if (action === '1') {
      const { categoryId } = await inquirer.prompt({
        type: 'input',
        name: 'categoryId',
        message: 'Enter Category ID to hide:',
        validate: (input) => !isNaN(parseInt(input)) || 'Enter a valid category ID',
      });
      await hideCategory(parseInt(categoryId));
    } else if (action === '2') {
      const { categoryId } = await inquirer.prompt({
        type: 'input',
        name: 'categoryId',
        message: 'Enter Category ID to unhide:',
        validate: (input) => !isNaN(parseInt(input)) || 'Enter a valid category ID',
      });
      await unhideCategory(parseInt(categoryId));
    }
  } catch (error: any) {
    console.error('Error managing categories:', error.response?.data?.message || error.message);
  }
}

async function hideCategory(categoryId: number) {
  try {
    const res = await axios.post(`${BASE_URL}/admin/categories/${categoryId}/hide`, {
      adminId: adminData.userID
    });
    
    if (res.data.success) {
      console.log('\n✓ Category hidden successfully');
    } else {
      console.log('\n✗ Failed to hide category:', res.data.message);
    }
  } catch (error: any) {
    console.error('Error hiding category:', error.response?.data?.message || error.message);
  }
}

async function unhideCategory(categoryId: number) {
  try {
    const res = await axios.post(`${BASE_URL}/admin/categories/${categoryId}/unhide`, {
      adminId: adminData.userID
    });
    
    if (res.data.success) {
      console.log('\n✓ Category unhidden successfully');
    } else {
      console.log('\n✗ Failed to unhide category:', res.data.message);
    }
  } catch (error: any) {
    console.error('Error unhiding category:', error.response?.data?.message || error.message);
  }
}

async function manageBlockedKeywords() {
  try {
    const res = await axios.get(`${BASE_URL}/admin/blocked-keywords`);
    const keywords = res.data;

    console.log('\n=== Blocked Keywords ===');
    if (keywords.length === 0) {
      console.log('No blocked keywords found.');
    } else {
      keywords.forEach((kw: any, index: number) => {
        console.log(`${index + 1}. "${kw.keyword}" (ID: ${kw.id})`);
      });
    }

    console.log('\nActions:');
    console.log('1. Add blocked keyword');
    console.log('2. Remove blocked keyword');
    console.log('3. Back');
    
    const { action } = await inquirer.prompt({
      type: 'input',
      name: 'action',
      message: 'Enter your choice (1-3):',
      validate: (input) => ['1', '2', '3'].includes(input) || 'Enter 1, 2, or 3',
    });

    if (action === '1') {
      const { keyword } = await inquirer.prompt({
        type: 'input',
        name: 'keyword',
        message: 'Enter keyword to block:',
        validate: (input) => input.trim().length > 0 || 'Enter a valid keyword',
      });
      await addBlockedKeyword(keyword.trim());
    } else if (action === '2' && keywords.length > 0) {
      const { keywordId } = await inquirer.prompt({
        type: 'input',
        name: 'keywordId',
        message: 'Enter Keyword ID to remove:',
        validate: (input) => !isNaN(parseInt(input)) || 'Enter a valid keyword ID',
      });
      await removeBlockedKeyword(parseInt(keywordId));
    }
  } catch (error: any) {
    console.error('Error managing keywords:', error.response?.data?.message || error.message);
  }
}

async function addBlockedKeyword(keyword: string) {
  try {
    const res = await axios.post(`${BASE_URL}/admin/blocked-keywords`, {
      keyword,
      adminId: adminData.userID
    });
    
    if (res.data.success) {
      console.log('\n✓ Keyword blocked successfully');
    } else {
      console.log('\n✗ Failed to block keyword:', res.data.message);
    }
  } catch (error: any) {
    console.error('Error blocking keyword:', error.response?.data?.message || error.message);
  }
}

async function removeBlockedKeyword(keywordId: number) {
  try {
    const res = await axios.delete(`${BASE_URL}/admin/blocked-keywords/${keywordId}`);
    
    if (res.data.success) {
      console.log('\n✓ Keyword removed successfully');
    } else {
      console.log('\n✗ Failed to remove keyword:', res.data.message);
    }
  } catch (error: any) {
    console.error('Error removing keyword:', error.response?.data?.message || error.message);
  }
}
