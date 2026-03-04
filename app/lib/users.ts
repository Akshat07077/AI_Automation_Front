import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

export interface User {
  username: string;
  password: string; // In production, this should be hashed
  createdAt: string;
}

const USERS_FILE = join(process.cwd(), "data", "users.json");

function ensureDataDir() {
  const dataDir = join(process.cwd(), "data");
  if (!existsSync(dataDir)) {
    try {
      mkdirSync(dataDir, { recursive: true });
    } catch (error) {
      console.error("Failed to create data directory:", error);
    }
  }
}

export function getUsers(): User[] {
  try {
    ensureDataDir();
    if (!existsSync(USERS_FILE)) {
      return [];
    }
    const content = readFileSync(USERS_FILE, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    console.error("Error reading users file:", error);
    return [];
  }
}

export function saveUsers(users: User[]): void {
  try {
    ensureDataDir();
    writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing users file:", error);
    throw new Error("Failed to save users");
  }
}

export function addUser(username: string, password: string): void {
  const users = getUsers();
  
  // Check if user already exists
  if (users.some(u => u.username === username)) {
    throw new Error("User already exists");
  }
  
  users.push({
    username,
    password, // In production, hash this with bcrypt
    createdAt: new Date().toISOString(),
  });
  
  saveUsers(users);
}

export function validateUser(username: string, password: string): boolean {
  const users = getUsers();
  const user = users.find(u => u.username === username);
  
  if (!user) {
    return false;
  }
  
  // In production, compare hashed passwords
  return user.password === password;
}
