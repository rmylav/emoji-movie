# Emoji Movie

A small Node.js command-line game powered by the Claude API. Claude shows a movie as emojis, you guess, and Claude replies with feedback and hints. Correct guesses make the next puzzle harder; wrong guesses make it easier.

Built as a hands-on experiment with **multi-turn conversation**: keeping chat history in code, because the API itself remembers nothing between calls.

## How it works

1. The app sends an opening "Start the game." message, since Claude can only reply and can't speak first.
2. Claude replies with an emoji puzzle.
3. Each guess is added to a `messages` array, and the **entire array** is sent with every API call.
4. Claude's reply is printed and added to the array too, so it can see its earlier puzzles and hints on the next turn.
5. Type `quit` to end the game.

Example round:

```
🦁👑
Your guess: no idea
Hint: It's an animated classic 🎬
Your guess: tangled?
One more chance! 🎬
Hint: It's set in Africa 🌍
Your guess: lion king
Correct! 🎉
```

## Setup

Requires Node.js 20.12 or later (uses `process.loadEnvFile`).

```bash
npm install
```

Create a `.env` file in the project folder:

```
ANTHROPIC_API_KEY=your-key-here
```

## Run

```bash
node movie.js
```

## What I learned

- **The API is stateless.** Claude only knows what is in the `messages` array sent with each call. Leaving out its earlier replies makes it lose track of its own hints and the movie it picked.
- **History grows by two messages per turn** (the guess and the reply), and the whole history is resent every call. Input tokens, and so cost, rise with every turn.
- **The model can't wait or act on its own.** It only responds when my code calls it; the game loop in my code does the waiting.
- **Shared code belongs in one place.** The API call and its error handling live in a single `askClaude()` function used for both the opening turn and every guess.
- **The model is tracking game state by reading history.** Chances left, difficulty, and score all live in the conversation, which works for a game but isn't reliable for anything that matters.

## Phase 2 improvements

- [ ] **Handle empty guesses without calling the API.** An empty message currently causes an API error and exits. An earlier attempt at a guard (`if (!guess) continue;`) looped endlessly with no input; investigate why before re-adding it.
- [ ] **Keep game state in code.** Track score and remaining chances in variables and pass the facts to the model each turn, instead of relying on it to count.
- [ ] **Control token cost for long games.** Trim or summarize older turns, or start a fresh history for each new movie.
- [ ] **Tighten the system prompt.** Scope "emojis only" to the puzzle itself so hints and feedback can use text, and remove the instruction to "wait," which the model can't do.
- [ ] **Show a running score** and a summary when the player quits.
