# Listening Room languages

The same room supports Korean and English. `?lang=en` and `?lang=ko` take priority over a saved preference; first visits otherwise follow the browser language (Korean for ko, English for other languages). The language control remembers explicit choices, updates the shareable URL and carries the choice through room links.

`i18n.js` loads before the interface scripts. Its local dictionary translates text nodes and accessible labels, preserving their Korean source for reversible switching. A scoped mutation observer covers late-loaded hall interfaces and dynamic messages; regex templates cover seats, visitors, live stations, breathing timers and recommendation cards. New copy should be added to this dictionary. No external translation service is used.

Switching language does not reload the page, rejoin multiplayer, recreate audio, move the avatar or change the current seat. Names remain user-authored content. Generated names have paired Korean/English suggestions, with English suggestions kept within the existing 12-character limit. Edited or joined names stay unchanged. Participant list name spans are explicitly excluded from translation.

Validation: JavaScript syntax; locale precedence and browser defaults; dynamic seats/counts/timers/recommendations with Korean names preserved; nickname length limits; browser checks for the room picker and all three spaces; a 390px mobile preview; Korean-English round trips; custom nickname preservation; live Christmas radio continuing across language changes with the same seat and stream; translated programme, help, recommendations and stargazing. Chamber and vineyard audio files are unchanged; preview does not include their recordings.
