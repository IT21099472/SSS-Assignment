import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import crypto from 'crypto';

const algorithm = 'aes-256-cbc';

// Use environment variables for key in production
const key = Buffer.from(process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex'), 'hex');

interface EncryptedData {
  iv: string;
  encryptedData: string;
}

function encrypt(text: string): EncryptedData {
  const iv = crypto.randomBytes(16); // Generate a new IV for each encryption
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return { iv: iv.toString('hex'), encryptedData: encrypted };
}

function decrypt(encryptedData: EncryptedData): string {
  const ivBuffer = Buffer.from(encryptedData.iv, 'hex');
  const encryptedText = Buffer.from(encryptedData.encryptedData, 'hex');
  const decipher = crypto.createDecipheriv(algorithm, key, ivBuffer);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export async function GET() {
  try {
    const events = await prisma.event.findMany();
    
    // Add logging to verify data being decrypted
    console.log("Fetched events:", events);

    // Decrypt event names
    const decryptedEvents = events.map(event => {
      const { iv, event_name } = event;
      // Ensure iv and event_name are strings
      if (typeof iv === 'string' && typeof event_name === 'string') {
        return {
          ...event,
          event_name: decrypt({ iv, encryptedData: event_name })
        };
      } else {
        console.error("Invalid data for decryption:", { iv, event_name });
        return event;
      }
    });

    return NextResponse.json(decryptedEvents);
  } catch (error) {
    console.error("[Get Events]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { event_id, event_name, event_status } = await req.json();

    // Encrypt event_name
    const encryptedEventName = encrypt(event_name);

    // Check if there are any active events
    const activeEvents = await prisma.event.findMany({
      where: {
        event_status: true
      }
    });

    let newEvent;
    if (activeEvents.length > 0 && event_status === true) {
      // If there are active events and the new event status is true, set event_status of new event to false
      newEvent = await prisma.event.create({
        data: {
          event_id,
          event_name: encryptedEventName.encryptedData,
          iv: encryptedEventName.iv,
          event_status: false, // Set event_status to false
        },
      });
    } else {
      // Insert data
      newEvent = await prisma.event.create({
        data: {
          event_id,
          event_name: encryptedEventName.encryptedData,
          iv: encryptedEventName.iv,
          event_status,
        },
      });
    }

    // Return new event
    return NextResponse.json(newEvent);
  } catch (error) {
    console.error("[Create Event]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
