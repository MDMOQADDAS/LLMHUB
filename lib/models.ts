// lib/models.ts
export interface LLMModel {
    name: string;
    versions: string[];
    description: string;
    defaultVersion: string;
}

export const MODELS: LLMModel[] = [
    {
        name: "Deepseek-R1",
        versions: ["7b", "13b", "70b"],
        description: "General purpose AI model for various tasks",
        defaultVersion: "7b",
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
    // ... keep your existing models array
];