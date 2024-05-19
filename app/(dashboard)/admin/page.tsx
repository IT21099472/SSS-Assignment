import { auth } from "@clerk/nextjs"

import { redirect } from "next/navigation";
import { CheckCircle, Clock } from "lucide-react";
import { InfoCard } from "./_components/info-card";





export default async function Dashboard() {
  const { userId } = auth();

  if (!userId) {
    return redirect("/");
  }



  return (
    <div className="p-6 space-y-4">
      admin home
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
       <InfoCard
          icon={Clock}
          label="In Progress"
          numberOfItems={1}
       />
       <InfoCard
          icon={CheckCircle}
          label="Completed"
          numberOfItems={1}
          variant="success"
       />
       <InfoCard
          icon={CheckCircle}
          label="omer"
          numberOfItems={1}
          variant="success"
       />
      </div>

      
    </div>
  );
  
}
