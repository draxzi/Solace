# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-07-01

### Added
- Initial public release of Solace
- AI-powered mental health companion using Groq's Llama 3 70B
- Real-time AI chat with crisis detection (3-tier system)
- Daily mood check-ins with time-gating
- Soul Space with 5 healing modules:
  - Letter to Yourself
  - Thought Reframing
  - Grief & Loss Space
  - Heartbreak & Lonely Souls
  - For Someone You Miss
- Breathing exercises (Box Breathing, Wave Breathing, Butterfly Hug)
- Grounding exercises (5-4-3-2-1 method)
- 7-day mood history with chart visualization
- Private mode (unsaved conversations)
- Listen mode (receive only acknowledgments)
- Silence mode (just presence, no responses)
- Responsive mobile-first design
- Privacy-first approach (all data in localStorage)

### Fixed
- Complete truncated string in `getMicroCelebrationContext`
- Enhanced error handling with HTTP status details in API responses
- Added missing dependencies to useEffect hooks for proper React behavior

### Security
- All user data stored locally in browser
- No sensitive data sent to external servers except AI messages to Groq
- CORS properly configured

---

## Version History

| Version | Date | Status |
|---------|------|--------|
| 1.0.0 | 2026-07-01 | Released |
