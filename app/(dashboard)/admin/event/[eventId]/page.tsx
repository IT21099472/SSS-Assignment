import React from "react";
import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import {
  CircleDollarSign,
  File,
  LayoutDashboard,
  ListChecks,
} from "lucide-react";

import { prisma } from "@/lib/db";
import { IconBadge } from "@/components/icon-badge";
import { Banner } from "@/components/banner";

import { Actions } from "./_components/actions";
import { EventForm } from "./_components/event_name";
import { EventStatus } from "./_components/event_status";
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

const EventId = async ({
  params,
}: {
  params: { eventId: string }; // Change eventId to string
}) => {
  const { userId } = auth();

  if (!userId) {
    return redirect("/");
  }

  const eventId = parseInt(params.eventId, 10); // Convert eventId to number
  if (isNaN(eventId)) {
    return redirect("/"); // Handle invalid eventId
  }

  const Event = await prisma.event.findUnique({
    where: {
      event_id: eventId, // Use the converted eventId
    },
  });

  if (!Event) {
    return redirect("/");
  }

  // Decrypt the event_name
  const decryptedEventName = decrypt({ iv: Event.iv, encryptedData: Event.event_name });

  const requiredFields = [decryptedEventName, Event.event_status];

  const totalFields = requiredFields.length;
  const completedFields = requiredFields.filter(Boolean).length;

  const completionText = `(${completedFields}/${totalFields})`;

  const isComplete = requiredFields.every(Boolean);

  return (
    <>
      {!Event.event_status && (
        <Banner label="This event is inactive. It will not be visible to vote." />
      )}
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-y-2">
            <h1 className="text-2xl font-medium">{decryptedEventName}</h1>
            <span className="text-sm text-slate-700">
              Complete all fields {completionText}
            </span>
          </div>
          <Actions
            disabled={!isComplete}
            eventId={eventId} // Use the converted eventId
            isEvent={Event.event_status}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-5">
          <div>
            <EventForm initialData={{ ...Event, event_name: decryptedEventName }} event_id={Event.event_id} />
          </div>
          <div>
            <EventStatus initialData={Event} event_id={Event.event_id} />
          </div>
        </div>
        <div />
      </div>
    </>
  );
};

export default EventId;
