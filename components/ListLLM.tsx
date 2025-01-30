"use client"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface LLMModel {
  name: string;
  versions: string[];
  description: string;
  defaultVersion: string;
}

const MODELS: LLMModel[] = [
  {
    name: "Deepseek-R1",
    versions: ["7b", "13b", "70b"],
    description: "General purpose AI model for various tasks",
    defaultVersion: "7b"
  },
  {
    name: "qwen2.5",
    versions: ["7b", "13b", "70b"],
    description: "General purpose AI model for various tasks",
    defaultVersion: "7b"
  },
  {
    name: "Llama-3",
    versions: ["8b", "70b"],
    description: "Meta's latest open-source LLM",
    defaultVersion: "8b"
  },
  {
    name: "Mistral",
    versions: ["7b", "mixtral-8x7b"],
    description: "High-quality text generation model",
    defaultVersion: "7b"
  },
  {
    name: "Phi-3",
    versions: ["mini", "small", "medium"],
    description: "Microsoft's lightweight AI model",
    defaultVersion: "mini"
  },
  {
    name: "Gemma",
    versions: ["2b", "7b"],
    description: "Google's open lightweight models",
    defaultVersion: "2b"
  },
];

export default function ListLLM() {
    const router = useRouter();
  const [selectedVersions, setSelectedVersions] = useState<{ [key: string]: string }>({});

  const handleVersionChange = (modelName: string, version: string) => {
    setSelectedVersions(prev => ({
      ...prev,
      [modelName]: version
    }));
  };

  const handleRunModel = (model: LLMModel) => {
    const version = selectedVersions[model.name] || model.defaultVersion;
    console.log(`Running ${model.name} (${version})`);
    router.push(`/models/${model.name}?version=${version}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-12 text-gray-800">LLMHUB</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MODELS.map((model) => (
            <Card key={model.name} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-800">
                  {model.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">{model.description}</p>
                <div className="space-y-2">
                  <Select
                    value={selectedVersions[model.name] || model.defaultVersion}
                    onValueChange={(value) => handleVersionChange(model.name, value)}
                  >
                    <SelectTrigger className="w-full">
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
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button 
                  onClick={() => handleRunModel(model)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Run Model
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

