import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    await prisma.notification.updateMany({
      where: { userId: "system", isRead: false },
      data: { isRead: true, readAt: new Date(), status: 'read' }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to mark all as read:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
