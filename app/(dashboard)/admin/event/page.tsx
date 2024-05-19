import React from 'react'
import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { DataTable } from "./_components/data-table";
import { columns } from "./_components/columns";
import crypto from 'crypto';

const algorithm = 'aes-256-cbc';

// Use environment variables for key in production
const key = Buffer.from(process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex'), 'hex');

interface EncryptedData {
  iv: string;
  encryptedData: string;
}

function decrypt(encryptedData: EncryptedData): string {
  const ivBuffer = Buffer.from(encryptedData.iv, 'hex');
  const encryptedText = Buffer.from(encryptedData.encryptedData, 'hex');
  const decipher = crypto.createDecipheriv(algorithm, key, ivBuffer);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

const EventPage = async () => {
  const { userId } = auth();

  if (!userId) {
    return redirect("/");
  }
  
  try {
    const events = await prisma.event.findMany();

    // Decrypt event names
    const decryptedEvents = events.map(event => ({
      ...event,
      event_name: decrypt({ iv: event.iv, encryptedData: event.event_name })
    }));

    return (
      <div className="p-6">
        <DataTable columns={columns} data={decryptedEvents} />
      </div>
    );
  } catch (error) {
    console.error("Error fetching data:", error);
    return <div>Error fetching data. Please try again later.</div>;
  }
}

export default EventPage;
