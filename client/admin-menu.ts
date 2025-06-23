import inquirer from 'inquirer';
import axios from 'axios';

const BASE_URL = 'http://localhost:8000';

export async function showAdminMenu() {
  while (true) {
    const { choice } = await inquirer.prompt({
      type: 'input',
      name: 'choice',
      message: `\n--- Admin Menu ---\n1. View external servers and status\n2. View server details\n3. Edit server\n4. Add news category\n5. Logout\nEnter your choice:`,
      validate: (input) =>
        ['1', '2', '3', '4', '5'].includes(input) || 'Enter a valid number',
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
    servers.forEach((server: any, index: number) => {
      console.log(
        `${index + 1}. ${server.name} - ${server.key || server.APIKey || '<missing>'}`
      );
    });
  } catch (error: any) {
    console.error('Error:', error.response?.data?.message || error.message);
  }
}

async function updateServer() {
  const { id, key } = await inquirer.prompt([
    { type: 'input', name: 'id', message: 'Enter external server ID:' },
    { type: 'input', name: 'key', message: 'Enter the updated API key:' },
  ]);

  try {
    const res = await axios.put(`${BASE_URL}/external-servers/${id}`, { key });
    console.log('API key updated successfully:', res.data);
  } catch (error: any) {
    console.error('Update failed:', error.response?.data?.message || error.message);
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
