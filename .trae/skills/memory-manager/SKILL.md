---
name: "memory-manager"
description: "Manages persistent memory across sessions. Invoke when user asks to remember something, recall previous context, or manage knowledge base."
---

# Memory Manager

This skill manages persistent memory for cross-session continuity, allowing the AI to remember important information across conversations.

## When to Use

- When user says "remember this", "don't forget", or "as you know"
- When starting a new session and user asks "do you remember..."
- When working on long-term projects that span multiple sessions
- When user provides preferences or requirements that should persist

## Memory Types

### 1. Core Memory (Long-term)
Persists indefinitely, used for:
- User identity and background
- Coding style preferences
- Project architecture and conventions
- Repeatedly used commands or patterns
- Important user facts

### 2. Working Memory (Session)
Lasts for current session, used for:
- Current task details
- Active file being edited
- Recent decisions made
- Pending issues and next steps

### 3. Knowledge Base (Structured)
Organized information, used for:
- Project-specific terminology
- API documentation references
- Troubleshooting patterns
- Known solutions to recurring problems

## Memory Operations

### Save Memory
```markdown
Key: [unique identifier]
Category: [core|working|knowledge]
Content: [what to remember]
Context: [when this applies]
Updated: [timestamp]
```

### Retrieve Memory
- Search by key
- Search by category
- Search by time range
- Semantic search (find related concepts)

### Update Memory
- Append to existing memory
- Replace outdated information
- Merge similar memories
- Delete obsolete entries

## Usage Examples

**User says**: "Remember that I prefer Chinese comments in code"
**AI action**: Save to core memory with category "user-preference"

**User says**: "What do you know about my project?"
**AI action**: Retrieve all memories with project context

**User says**: "As we discussed before..."
**AI action**: Search memory for previous conversation context

## Memory Storage

The memory is stored in structured files:
```
.trae/memory/
├── core/           # Long-term memories
│   ├── user.json    # User preferences and facts
│   └── projects.json # Project knowledge
├── working/        # Session memories
│   └── current.json # Current session context
└── knowledge/      # Structured knowledge
    ├── apis.json    # API documentation
    └── patterns.json # Common patterns
```

## Best Practices

1. **Confirm before saving**: "Should I remember that for future sessions?"
2. **Be specific**: Use clear, searchable keys
3. **Include context**: Note when information applies
4. **Update regularly**: Refresh memories when context changes
5. **Respect privacy**: Don't store sensitive information

## Example Memory Entries

```json
{
  "key": "user-preference-chinese-comments",
  "category": "core",
  "content": "User prefers Chinese comments in code",
  "context": "All coding tasks",
  "created": "2026-04-05",
  "updated": "2026-04-05"
}
```

```json
{
  "key": "project-clawpanel-architecture",
  "category": "knowledge",
  "content": "ClawPanel uses Tauri v2, Vanilla JS frontend, Rust backend",
  "context": "ClawPanel project tasks",
  "created": "2026-04-05",
  "updated": "2026-04-05"
}
```

## Integration with Core Memory

Use the `manage_core_memory` tool to:
- ADD new memory entries
- UPDATE existing memories
- DELETE obsolete information
- SEARCH across all memory types
