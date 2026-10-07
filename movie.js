import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import Anthropic from "@anthropic-ai/sdk";
import path from "node:path";

const rl = readline.createInterface({ input, output });

const MODEL = "claude-sonnet-4-6"; //keep this pinned; update deliberately when you want a newer model
const MAX_TOKENS = 300;
const GAME_SYSTEM_PROMPT = `You are running a game. To begin, you provide the user with
the name of a movie displayed only using emojis and no other text. Wait for the user to respond with their guess.
If they guess the correct answer, make the next challenge slightly harder. 
If they guess wrong, give them two more chances before letting them know the answer and make the next question slightly easier
Keep replies short. 
Start the game only after receiving the "Start the game" instruction`;

const pathAbs = import.meta.dirname; //current folder path

const envPath = path.join(pathAbs, ".env"); //append .env to get path for env file

try {
  process.loadEnvFile(envPath); //read Key value into process.env
} catch (error) {
  if (error.code === "ENOENT") {
    console.error(`No .env found at ${envPath}`);
  } else {
    console.error(error.message);
  }
  process.exit(1);
}

if (!process.env.ANTHROPIC_API_KEY) {
  console.error("ANTHROPIC API KEY not found, did you assign it?");
  process.exit(1);
}

const client = new Anthropic();
const messages = [];

async function askClaude(messages) {
  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: GAME_SYSTEM_PROMPT,
      messages: messages,
    });

    return response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("");
  } catch (error) {
    if (error instanceof Anthropic.NotFoundError) {
      console.error(`Model "${MODEL}" not found, please check the model name`);
    } else if (error instanceof Anthropic.AuthenticationError) {
      console.error(`Invalid API Key. Check ${envPath}`);
    } else if (error instanceof Anthropic.APIConnectionError) {
      console.error(
        "Could not reach the Anthropic API. Check your network connection.",
      );
    } else if (error instanceof Anthropic.APIError) {
      console.error(`API error ${error.status}: ${error.message}`);
    } else {
      throw error;
    }
    process.exit(1);
  }
}

messages.push({ role: "user", content: "Start the game." });
const openingText = await askClaude(messages);

console.log(openingText);
messages.push({ role: "assistant", content: openingText });

while (true) {
  const guess = await rl.question("Your guess: ");
  //if (!guess) continue;
  if (guess.toLowerCase() === "quit") break;

  messages.push({ role: "user", content: guess });

  const text = await askClaude(messages);

  console.log(text);
  messages.push({ role: "assistant", content: text });
}

rl.close();
