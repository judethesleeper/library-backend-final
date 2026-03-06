import bcrypt from "bcrypt";
import { getClientPromise } from "@/lib/mongodb";

const DB_NAME = "library_final";
const USER_COLLECTION = "users";
const BOOK_COLLECTION = "books";
const BORROW_COLLECTION = "borrows";

export async function ensureIndexes() {
  const client = await getClientPromise();
  const db = client.db(DB_NAME);

  const users = db.collection(USER_COLLECTION);
  const books = db.collection(BOOK_COLLECTION);
  const borrows = db.collection(BORROW_COLLECTION);

  await users.createIndex({ email: 1 }, { unique: true });
  await books.createIndex({ title: 1 });
  await books.createIndex({ author: 1 });
  await borrows.createIndex({ userId: 1, createdAt: -1 });
  await borrows.createIndex({ bookId: 1, createdAt: -1 });

  const seedUsers = [
    { email: "admin@test.com", password: "admin123", role: "ADMIN", name: "Admin" },
    { email: "user@test.com", password: "user123", role: "USER", name: "User" },
  ];

  for (const seed of seedUsers) {
    const exists = await users.findOne({ email: seed.email });
    if (!exists) {
      await users.insertOne({
        name: seed.name,
        email: seed.email,
        password: await bcrypt.hash(seed.password, 10),
        role: seed.role,
        status: "ACTIVE",
        createdAt: new Date(),
      });
    }
  }
}
