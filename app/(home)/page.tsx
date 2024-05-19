import React from "react";
import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import decrypt from "@/lib/decrypt"; // Adjust the import path as necessary
import { CandidateList } from "@/components/candidate_list copy";

interface CandidatesPageProps {
  searchParams: {
    candidate_name: string;
    event_id: string;
  };
}

const CandidatesPage: React.FC<CandidatesPageProps> = async ({ searchParams }) => {
  const { userId } = auth();

  if (!userId) {
    redirect("/"); // Assuming this function properly handles redirection
    return null; // Make sure to return something
  }

  const candidates = await prisma.candidate.findMany({
    where: {
      candidatus_status: true, // Filter candidates with candidatus_status as active
      event: {
        event_status: true // Filter events with event_status as active
      }
    },
    include: { event: true }, // Include related event data
    orderBy: {
      candidate_name: "asc" // Order candidates by candidate_name in ascending order
    }
  });

  // Decrypt event names
  const decryptedCandidates = candidates.map((candidate) => {
    try {
      const decryptedEventName = decrypt({ iv: candidate.event.iv, encryptedData: candidate.event.event_name });
      return {
        ...candidate,
        event: {
          ...candidate.event,
          event_name: decryptedEventName,
        },
      };
    } catch (error) {
      console.error("Failed to decrypt event_name for event_id:", candidate.event.event_id);
      return candidate; // Return the candidate with encrypted event_name if decryption fails
    }
  });

  const eventTitle = decryptedCandidates.length > 0 ? `Candidates for Event: ${decryptedCandidates[0]?.event?.event_name}` : "No event's available";

  return (
    <>
      <div className="flex items-center bg-green-200 flex-col col-span-12 md:col-span-6 lg:col-span-3 mt-5 p-5 rounded-lg mr-4">
        <div className="w-[90%] text-gray-600 mt-5">
          <p className="bg-color text-center font-semibold text-5xl">Secure Voting System</p>
        </div>
        <div className="w-[90%] mt-1">
          <p className="text-red-800 font-semibold text-lg">Attention Voters:</p>
          <p className="text-justify font-semibold text-base">
            Once you've submitted your vote, it cannot be changed. You have only one opportunity
            to cast your vote, so please consider your decision carefully before submitting.
          </p>
        </div>
      </div>

      <div className="h-10 mt-4 mr-5">
        <p className="text-center font-semibold text-2xl text-gray-800 mt-3">{eventTitle}</p>
      </div>

      <div className="grid grid-cols-12 gap-4 p-4 items-center justify-center">
        <CandidateList items={decryptedCandidates} />
      </div>
    </>
  );
};

export default CandidatesPage;
