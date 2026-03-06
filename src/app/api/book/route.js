import corsHeaders from "@/lib/cors";
import { ensureIndexes } from "@/lib/ensureIndexes";
import { getClientPromise } from "@/lib/mongodb";
import { requireAuth, requireAdmin } from "@/lib/auth";
import { NextResponse } from "next/server";

const DB_NAME = "library_exam";
const BOOK_COLLECTION = "books";

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: corsHeaders });
}

export async function GET(req) {
  try {
    const user = requireAuth(req);

    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401, headers: corsHeaders }
      );
    }

    await ensureIndexes();
    const client = await getClientPromise();
    const db = client.db(DB_NAME);

    const { searchParams } = new URL(req.url);
    const title = searchParams.get("title") || "";
    const author = searchParams.get("author") || "";
    const includeDeleted = searchParams.get("includeDeleted") === "true";

    const query = {};

    if (title) {
      query.title = { $regex: title, $options: "i" };
    }

    if (author) {
      query.author = { $regex: author, $options: "i" };
    }

    if (user.role === "ADMIN") {
      if (!includeDeleted) {
        query.status = { $ne: "DELETED" };
      }
    } else {
      query.status = { $ne: "DELETED" };
    }

    const books = await db.collection(BOOK_COLLECTION).find(query).toArray();

    return NextResponse.json(books, {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function POST(req) {
  try {
    const user = requireAdmin(req);

    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401, headers: corsHeaders }
      );
    }

    const body = await req.json();
    const { title, author, quantity, location } = body;

    if (!title || !author || quantity === undefined || !location) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400, headers: corsHeaders }
      );
    }

    await ensureIndexes();
    const client = await getClientPromise();
    const db = client.db(DB_NAME);

    const newBook = {
      title,
      author,
      quantity: Number(quantity),
      location,
      status: "ACTIVE",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection(BOOK_COLLECTION).insertOne(newBook);

    return NextResponse.json(
      {
        message: "Book created successfully",
        insertedId: result.insertedId,
      },
      { status: 201, headers: corsHeaders }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}