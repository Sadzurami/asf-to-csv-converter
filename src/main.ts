import fs from 'fs';
import path from 'path';

import { Account } from './account.interface';

const farmsDirectoryPath = path.resolve(process.cwd(), './farms');
if (!fs.existsSync(farmsDirectoryPath)) fs.mkdirSync(farmsDirectoryPath, { recursive: true });

const resultsFilePath = path.resolve(process.cwd(), './accounts.csv');
if (!fs.existsSync(resultsFilePath)) fs.writeFileSync(resultsFilePath, '');

main();

function main() {
  const accounts = readAccounts();

  const accountsMap = new Map<string, Account>();
  for (const account of accounts) accountsMap.set(account.username, account);

  exportAccounts([...accountsMap.values()]);
}

function readAccounts() {
  const filePaths = readDirectory(farmsDirectoryPath).filter((f) => f.endsWith('.json'));

  const accounts: Account[] = [];

  for (const jsonPath of filePaths) {
    const fileContent = fs.readFileSync(jsonPath, 'utf-8');
    const json = JSON.parse(fileContent);

    if (!json || !json.SteamLogin || !json.SteamPassword) continue;

    const account: Account = {
      id: jsonPath.replace('.json', ''),
      username: json.SteamLogin,
      password: json.SteamPassword,
      secret: null,
    };

    if (fs.existsSync(account.id + '.db')) {
      const fileContent = fs.readFileSync(account.id + '.db', 'utf-8');
      const db = JSON.parse(fileContent);

      if (db?._MobileAuthenticator?.shared_secret) account.secret = db._MobileAuthenticator.shared_secret;
    }

    if (!account.secret && fs.existsSync(account.id + '.mafile')) {
      const fileContent = fs
        .readFileSync(account.id + '.mafile', 'utf-8')
        .trim()
        .replace(/},\s*}/g, '}}')
        .replace(/'/, '"');
      const mafile = JSON.parse(fileContent);

      if (mafile?.shared_secret) account.secret = mafile.shared_secret;
    }

    if (!account.secret && fs.existsSync(account.id + '.maFile')) {
      const fileContent = fs
        .readFileSync(account.id + '.maFile', 'utf-8')
        .trim()
        .replace(/},\s*}/g, '}}')
        .replace(/'/, '"');
      const mafile = JSON.parse(fileContent);

      if (mafile?.shared_secret) account.secret = mafile.shared_secret;
    }

    accounts.push(account);
  }

  return accounts;
}

function readDirectory(entityPath: string): string[] {
  if (!entityPath || !fs.existsSync(entityPath)) return [];

  const entities = fs.readdirSync(entityPath).map((entity) => path.join(entityPath, entity));
  const filePaths: string[] = [];

  for (const entity of entities) {
    if (fs.statSync(entity).isDirectory()) filePaths.push(...readDirectory(entity));
    else filePaths.push(entity);
  }

  return filePaths;
}

function exportAccounts(accounts: Account[]) {
  const result = accounts.map((a) => `${a.username}:${a.password}${a.secret ? `:${a.secret}` : ''}`);
  fs.writeFileSync(resultsFilePath, result.join('\n'));
}
