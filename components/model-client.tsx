// // app/models/[model]/model-client.tsx
// "use client";

// import { Button } from "@/components/ui/button";
// import { useRouter } from "next/navigation";
// import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { useState } from "react";
// import { type LLMModel } from "@/lib/models";

// export default function ModelClient({
//   model,
//   initialVersion
// }: {
//   model: LLMModel;
//   initialVersion: string;
// }) {
//   const router = useRouter();
//   const [selectedVersion, setSelectedVersion] = useState(initialVersion);
//   const [isStarting, setIsStarting] = useState(false);

//   const handleStartChat = () => {
//     setIsStarting(true);
//     // Navigate to chat interface
//     router.push(`/models/${model.name}/chat?version=${selectedVersion}`);
//   };

//   return (
//     <div className="min-h-screen bg-gray-50 p-8">
//       <div className="max-w-4xl mx-auto">
//         <Card className="shadow-lg">
//           <CardHeader>
//             <CardTitle className="text-3xl font-bold text-center">
//               Welcome to {model.name}!
//             </CardTitle>
//           </CardHeader>

//   <CardContent className="space-y-6">
//     <div className="text-center text-gray-600">
//       <p className="mb-4">{model.description}</p>
//       <p className="text-sm">Select your preferred version to begin</p>
//     </div>

//     <div className="flex flex-col items-center gap-4">
//       <Select value={selectedVersion} onValueChange={setSelectedVersion}>
//         <SelectTrigger className="w-64">
//           <SelectValue placeholder="Select version" />
//         </SelectTrigger>
//         <SelectContent>
//           {model.versions.map((version) => (
//             <SelectItem key={version} value={version}>
//               {version}
//             </SelectItem>
//           ))}
//         </SelectContent>
//       </Select>

//       <Button 
//         onClick={handleStartChat}
//         className="w-64 bg-green-600 hover:bg-green-700"
//         size="lg"
//         disabled={isStarting}
//       >
//         {isStarting ? "Starting..." : "Start Chat →"}
//       </Button>
//     </div>
//   </CardContent>

//   <CardFooter className="flex justify-center text-sm text-gray-500 mt-4">
//     <p>Model size: {model.versions.includes('70b') ? 'Large' : 'Medium'} | Recommended for: General use</p>
//   </CardFooter>
//         </Card>
//       </div>
//     </div>
//   );
// }


// app/models/[model]/model-client.tsx
"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { type LLMModel } from "@/lib/models";

export default function ModelClient({
    model,
    initialVersion
}: {
    model: LLMModel;
    initialVersion: string;
}) {
    const router = useRouter();
    const [selectedVersion, setSelectedVersion] = useState(initialVersion);
    const [isStarting, setIsStarting] = useState(false);

    // Sync with URL param changes
    useEffect(() => {
        setSelectedVersion(initialVersion);
    }, [initialVersion]);

    const handleStartChat = () => {
        setIsStarting(true);
        router.push(`/models/${model.name}/chat?version=${selectedVersion}`);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-3xl font-bold text-center">
                            Welcome to {model.name}!
                        </CardTitle>
                    </CardHeader>


                    <CardContent className="space-y-6">
                        <div className="text-center text-gray-600">
                            <p className="mb-4">{model.description}</p>
                            <p className="text-sm">Select your preferred version to begin</p>
                        </div>

                        <div className="flex flex-col items-center gap-4">
                            <Select value={selectedVersion} onValueChange={setSelectedVersion}>
                                <SelectTrigger className="w-64">
                                    <SelectValue placeholder="Select version" />
                                </SelectTrigger>
                                <SelectContent>
                                    {model.versions.map((version) => (
                                        <SelectItem key={version} value={version}>
                                            {version}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Button
                                onClick={handleStartChat}
                                className="w-64 bg-green-600 hover:bg-green-700"
                                size="lg"
                                disabled={isStarting}
                            >
                                {isStarting ? "Starting..." : "Start Chat →"}
                            </Button>
                        </div>
                    </CardContent>

                    <CardFooter className="flex justify-center text-sm text-gray-500 mt-4">
                        <p>Model size: {model.versions.includes('70b') ? 'Large' : 'Medium'} | Recommended for: General use</p>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}