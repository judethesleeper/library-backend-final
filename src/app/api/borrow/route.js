import corsHeaders from "@/lib/cors";
import { getClientPromise } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { requireAuth } from "@/lib/auth";
import { NextResponse } from "next/server";

const DB_NAME = "library_exam";
const BORROW_COLLECTION = "borrow_requests";
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

    const client = await getClientPromise();
    const db = client.db(DB_NAME);

    const query = user.role === "ADMIN" ? {} : { userId: user.id };

    const requests = await db
      .collection(BORROW_COLLECTION)
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(requests, {
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
    const user = requireAuth(req);

    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401, headers: corsHeaders }
      );
    }

    const body = await req.json();
    const { bookId, targetDate } = body;

    if (!bookId || !targetDate) {
      return NextResponse.json(
        { message: "Missing bookId or targetDate" },
        { status: 400, headers: corsHeaders }
      );
    }

    const client = await getClientPromise();
    const db = client.db(DB_NAME);

    const book = await db.collection(BOOK_COLLECTION).findOne({
      _id: new ObjectId(bookId),
      status: { $ne: "DELETED" },
    });

    if (!book) {
      return NextResponse.json(
        { message: "Book not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    const requestStatus =
      Number(book.quantity) > 0 ? "INIT" : "CLOSE-NO-AVAILABLE-BOOK";

    const borrowRequest = {
      userId: user.id,
      bookId,
      createdAt: new Date(),
      targetDate,
      requestStatus,
    };

    const result = await db
      .collection(BORROW_COLLECTION)
      .insertOne(borrowRequest);

    return NextResponse.json(
      {
        message: "Borrow request created successfully",
        _id: result.insertedId,
        userId: borrowRequest.userId,
        bookId: borrowRequest.bookId,
        createdAt: borrowRequest.createdAt,
        targetDate: borrowRequest.targetDate,
        requestStatus: borrowRequest.requestStatus,
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