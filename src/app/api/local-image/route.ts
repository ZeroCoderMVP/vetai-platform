import { NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filePath = searchParams.get("path");

  if (!filePath) {
    return new NextResponse("Missing path parameter", { status: 400 });
  }

  try {
    const p = resolve(filePath);
    if (!existsSync(p)) {
      return new NextResponse("File not found", { status: 404 });
    }

    const fileBuffer = readFileSync(p);
    
    // Determine content type
    let contentType = "application/octet-stream";
    if (p.endsWith(".png")) contentType = "image/png";
    if (p.endsWith(".jpg") || p.endsWith(".jpeg")) contentType = "image/jpeg";
    if (p.endsWith(".gif")) contentType = "image/gif";
    if (p.endsWith(".svg")) contentType = "image/svg+xml";
    if (p.endsWith(".webp")) contentType = "image/webp";

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    return new NextResponse("Internal server error", { status: 500 });
  }
}
