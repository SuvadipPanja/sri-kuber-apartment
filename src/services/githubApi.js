/**
 * GitHub API service for Super Admin data writes.
 * Uses GitHub REST API to commit updated JSON files to the repository.
 * The Personal Access Token is stored in Vercel environment variables.
 */

const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN;
const GITHUB_OWNER = import.meta.env.VITE_GITHUB_OWNER;
const GITHUB_REPO  = import.meta.env.VITE_GITHUB_REPO;
const GITHUB_BRANCH = import.meta.env.VITE_GITHUB_BRANCH || 'main';

const BASE_URL = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}`;

async function getFileSha(filePath) {
  const res = await fetch(`${BASE_URL}/contents/${filePath}?ref=${GITHUB_BRANCH}`, {
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
    },
  });
  if (!res.ok) throw new Error(`Cannot get file SHA for ${filePath}`);
  const data = await res.json();
  return data.sha;
}

async function commitFile(filePath, content, commitMessage) {
  if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
    throw new Error('GitHub environment variables are not configured. Please contact the admin.');
  }

  const sha = await getFileSha(filePath);
  const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(content, null, 2))));

  const res = await fetch(`${BASE_URL}/contents/${filePath}`, {
    method: 'PUT',
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: commitMessage,
      content: encoded,
      sha,
      branch: GITHUB_BRANCH,
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'GitHub commit failed');
  }

  return res.json();
}

export const githubApi = {
  savePayments: (payments) =>
    commitFile('src/data/payments.json', payments, `Update payments data — ${new Date().toISOString()}`),

  saveExpenses: (expenses) =>
    commitFile('src/data/expenses.json', expenses, `Update expenses data — ${new Date().toISOString()}`),

  saveOwners: (owners) =>
    commitFile('src/data/owners.json', owners, `Update owners data — ${new Date().toISOString()}`),

  saveIncome: (income) =>
    commitFile('src/data/income.json', income, `Update other income — ${new Date().toISOString()}`),

  saveConfig: (config) =>
    commitFile('src/data/config.json', config, `Update society config — ${new Date().toISOString()}`),

  saveAuth: (auth) =>
    commitFile('src/data/auth.json', auth, `Update auth data — ${new Date().toISOString()}`),
};

export const isGithubConfigured = () =>
  !!(GITHUB_TOKEN && GITHUB_OWNER && GITHUB_REPO);
