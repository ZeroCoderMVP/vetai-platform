import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    
    const dataToUpdate: any = {};
    
    if (body.isRead !== undefined) {
      dataToUpdate.isRead = body.isRead;
      dataToUpdate.readAt = body.isRead ? new Date() : null;
      if (body.isRead && !body.status) dataToUpdate.status = 'read';
    }
    
    if (body.status !== undefined) {
      dataToUpdate.status = body.status;
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: dataToUpdate
    });
    
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update notification:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    await prisma.notification.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
