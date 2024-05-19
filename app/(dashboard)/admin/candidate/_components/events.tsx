"use client";
import { useEffect, useState } from 'react';
import { Event } from "@prisma/client";
import { EventItem } from "./event_item";
import {
  FcEngineering,
  FcFilmReel,
  FcMultipleDevices,
  FcMusic,
  FcOldTimeCamera,
  FcSalesPerformance,
  FcSportsMode
} from "react-icons/fc";
import { IconType } from "react-icons";
import decrypt from '@/lib/decrypt'; // Adjust the import path as necessary

interface EventsProps {
  items: Event[];
}

const iconMap: Record<string, IconType> = {
  "Music": FcMusic,
  "Photography": FcOldTimeCamera,
  "Fitness": FcSportsMode,
  "Accounting": FcSalesPerformance,
  "Computer Science": FcMultipleDevices,
  "Filming": FcFilmReel,
  "Engineering": FcEngineering,
};

export const Events = ({ items }: EventsProps) => {
  const [decryptedItems, setDecryptedItems] = useState<Event[]>(items);

  useEffect(() => {
    const decryptEventNames = async () => {
      const decrypted = items.map((item) => {
        try {
          const decryptedEventName = decrypt({ iv: item.iv, encryptedData: item.event_name });
          return { ...item, event_name: decryptedEventName };
        } catch (error) {
          console.error("Failed to decrypt event_name for event_id:", item.event_id);
          return item;
        }
      });
      setDecryptedItems(decrypted);
    };

    decryptEventNames();
  }, [items]);

  return (
    <div className="flex items-center gap-x-2 overflow-x-auto pb-2">
      {decryptedItems.map((item) => (
        <EventItem
          key={item.event_id}
          label={item.event_name}
          value={item.event_id.toString()} // Convert to string
        />
      ))}
    </div>
  );
};

export default Events;
