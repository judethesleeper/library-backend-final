import corsHeaders from "@/lib/cors";
import { getClientPromise } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { requireAuth, requireRole } from "@/lib/auth";
import { NextResponse } from "next/server";

const DB_NAME = "library_exam";
const BOOK_COLLECTION = "books";

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: corsHeaders });
}

export async function GET(req, context) {
  try {
    const user = requireAuth(req);

    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401, headers: corsHeaders }
      );
    }

    const { id } = await context.params;

    const client = await getClientPromise();
    const db = client.db(DB_NAME);

    const book = await db.collection(BOOK_COLLECTION).findOne({
      _id: new ObjectId(id),
    });

    if (!book) {
      return NextResponse.json(
        { message: "Book not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    if (user.role !== "ADMIN" && book.status === "DELETED") {
      return NextResponse.json(
        { message: "Forbidden" },
        { status: 403, headers: corsHeaders }
      );
    }

    return NextResponse.json(book, {
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

export async function PATCH(req, context) {
  try {
    const admin = requireRole(req, "ADMIN");

    if (!admin) {
      return NextResponse.json(
        { message: "Forbidden" },
        { status: 403, headers: corsHeaders }
      );
    }

    const { id } = await context.params;
    const body = await req.json();
    const { title, author, quantity, location, status } = body;

    const updateData = {
      updatedAt: new Date(),
    };

    if (title !== undefined) updateData.title = title;
    if (author !== undefined) updateData.author = author;
    if (quantity !== undefined) updateData.quantity = Number(quantity);
    if (location !== undefined) updateData.location = location;
    if (status !== undefined) updateData.status = status;

    const client = await getClientPromise();
    const db = client.db(DB_NAME);

    const result = await db.collection(BOOK_COLLECTION).findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: "after" }
    );

    if (!result) {
      return NextResponse.json(
        { message: "Book not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json(result, {
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

export async function DELETE(req, context) {
  try {
    const admin = requireRole(req, "ADMIN");

    if (!admin) {
      return NextResponse.json(
        { message: "Forbidden" },
        { status: 403, headers: corsHeaders }
      );
    }

    const { id } = await context.params;

    const client = await getClientPromise();
    const db = client.db(DB_NAME);

    const result = await db.collection(BOOK_COLLECTION).findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: {
          status: "DELETED",
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" }
    );

    if (!result) {
      return NextResponse.json(
        { message: "Book not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { message: "Book deleted successfully" },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}