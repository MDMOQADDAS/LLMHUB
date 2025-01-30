# LLMHUB

LLMHUB is a Next.js project that allows users to interact with various open-source large language models (LLMs) such as DeepSeek-R1, QWEM2.5, and Llama3. This project provides a user-friendly interface to explore and utilize these models for various applications.

## Getting Started

First, clone the repository and navigate to the project directory:

```bash
git clone https://github.com/yourusername/llmhub.git
cd llmhub
```

Install the dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Features

- **Suggestions Mode**: Provides prompt suggestions to help users generate better inputs.
- **Kid Mode**: Offers child-friendly responses with simple and safe content.
- **Expert Mode**: Delivers detailed and advanced explanations for professional use.
- **InShort Mode**: Generates concise and to-the-point responses.

## Usage

### Enabling Modes

You can enable different modes by checking the corresponding checkboxes in the UI:

- **Suggestions**: Enable prompt suggestions.
- **Kid Mode**: Enable child-friendly responses.
- **Expert Mode**: Enable expert-level responses.
- **InShort Mode**: Enable concise responses.

### Exporting Chat History

You can export the chat history by clicking the "Export Chat" button in the sidebar. The chat history will be downloaded as a JSON file.

## Keyboard Shortcuts

- **Ctrl + Enter**: Submit the input.
- **Esc**: Close the settings.

## API Integration

The project integrates with various LLM APIs to provide responses. You can configure the API endpoints and settings in the project.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.


## Contact

For any inquiries or support, please contact [mdmoqaddas@gmail.com](mailto:mdmoqaddas@gmail.com).
