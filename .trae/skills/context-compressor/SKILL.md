---
name: "context-compressor"
description: "Compresses long conversation contexts to save tokens. Invoke when conversation exceeds 20 messages or user asks to compress/summarize context."
---

# Context Compressor

This skill helps compress long conversation contexts to optimize token usage while preserving key information.

## When to Use

- When conversation exceeds 20+ messages
- When user asks "compress context", "save tokens", or "summarize so far"
- When response quality degrades due to context length
- Before complex tasks that need fresh context

## Compression Strategies

### 1. Topic Extraction
Extract main topics and subtopics from conversation:
- Identify key decisions made
- Note unresolved questions
- Track user preferences and requirements

### 2. Key Information Preservation
Keep these critical elements:
- Active task goals and progress
- Important code snippets or file paths referenced
- User preferences expressed
- Error states and solutions found
- Configuration details

### 3. Discardable Information
Remove or summarize:
- Greetings and pleasantries
- Failed attempts that led to correct solution
- Repeated explanations
- Intermediate debugging steps (keep only final working solution)

## Output Format

When compressing, output a structured summary:

```markdown
## Conversation Summary

### Project: [name]
### Current Task: [what we're working on]
### Progress: [percentage/completion status]

### Key Decisions
- [decision 1]
- [decision 2]

### Important Context
- [file paths, code patterns, config values]

### User Preferences
- [language preference, coding style, etc.]

### Active Issues
- [unresolved problems]

### Next Steps
1. [next action]
2. [subsequent action]
```

## Usage Examples

**User says**: "context is getting long"
**AI responds**: "Let me compress our conversation to optimize context..." [uses this skill]

**User says**: "summarize what we've done"
**AI responds**: "Here's a summary of our session..." [uses this skill]

## Token Budget Guidelines

- Target: Keep context under 8000 tokens for optimal performance
- Warning threshold: Alert user at 12000 tokens
- Compression ratio: Aim for 3:1 compression (3 old messages -> 1 summary paragraph)

## Technical Notes

- Use core memory for cross-session persistence
- Preserve exact code snippets, compress discussions about them
- Mark compressed information with [compressed] tag for future reference
