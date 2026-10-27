# Input and scene contract

Source files are separate:

| File | Responsibility |
|---|---|
| story.txt | English narration, original word order |
| job.json | voice source, target duration, config file selection |
| events.json | narrative purpose, semantic beat type, actors, objects, event actions |
| characters.json | stable identity IDs and rig appearance tokens |
| actions.json | supported reusable methods, default durations, motion kind, SFX |
| cameras.json | shared shot composition, staging, push/pan targets |
| backgrounds.json | layered sources and depth motion, provenance |
| policy.json | pacing, caption safety, render/resources limits |

A beat example (values are data, no code):

```json
{
 "id":"b01","purpose":"A tangible discovery changes the protagonist's goal",
 "kind":"action","setting":"apartment","actors":["eli"],
 "props":[{"id":"letter","type":"document","text":"DO NOT LEAVE"}],
 "actions":[{"actor":"eli","verb":"read","target":"letter","phase":0.1},{"actor":"eli","verb":"startle","phase":0.65}]
}
```

kind is action/reaction/insert/rule/diagram/compare/relationship/travel/ending. SVG explanation beats require 2–4 values and zero actors. Others select B assets. Automatic camera selection avoids consecutive identical story presets. Two actors and seven prop categories are the current supported staging scope.

Action phase is a fraction of the measured unit audio duration. Alternatively `cue:"opened", occurrence:0` locks to a forced-aligned word start. The planner records actual local seconds, enforces chronological nonoverlap and rejects out-of-shot actions. Reactions/micro head poses fill unused intervals, but never replace the declared story action.

Recording mode accepts either a local audio file and the exact transcript, or an optional sidecar:

```json
{"method":"verified external/local alignment","words":[{"word":"the","start":0.1,"end":0.25}]}
```

The normalized word list must exactly equal the story and the times must be monotonic and inside the recording. Supplied timing is validated structurally, not presumed acoustically perfect. Without a sidecar, the installed local known-transcript aligner runs. Narration is sliced at inter-beat word gaps; the source voice order is preserved.

Door state continuity: a door prop may specify state="open"/"closed", text for the initial visible date, and revealText for the date after the next opening. Only put an actor next to a reachable handle; the planner stages interactions and runtime QA measures actual screen-space hand/target error. Door motion is a stylized flat hinge composition; it does not simulate 3D contact while the panel swings.
