# Dev Launcher Framework  
## Or: The Big Red Button For Your Entire Development Life

---

**DOCUMENT CLASSIFICATION:** README / TOOL FOR PEOPLE TIRED OF OPENING 14 TERMINALS  
**DATE RECORDED:** Thursday. Somehow already too late.  
**LOCATION:** A garage full of blinking lights and poor decisions  
**BEVERAGE:** Coffee that tastes faintly of solder and regret  
**CURRENT SYSTEM STATE:** Surprisingly operational  

---

## What Is This Thing?  
(Or: Why Did We Build A Launcher Instead Of Learning Self-Control)

You know that moment where you have:

- one frontend  
- two APIs  
- three scripts  
- a database container  
- a random Python thing you forgot existed  
- sixteen browser tabs explaining why port 3000 exploded again  

…and suddenly your desktop looks like the command center of a submarine operated entirely by raccoons?

Yeah. This fixes that.

The Dev Launcher Framework is basically a giant control panel for your development life. You tell it where your projects live once. After that, you click buttons and your entire stack wakes up like some caffeinated robot orchestra.

No spreadsheets.  
No “wait what terminal was running Redis?”  
No archaeological expedition through shell history.

Just:  
**launch the thing.**

---

## What It Actually Does  
(Or: The Useful Part Hidden Beneath The Chaos)

### One-Click Launching
Hit a button. App starts.

That’s it. That’s the feature. Somehow this still feels revolutionary in modern software.

---

### Smart Port Management
It automatically handles ports because apparently humanity collectively decided that “address already in use” should remain a personality test.

The launcher:
- detects conflicts
- finds open ports
- avoids collisions
- cleans up zombie processes like a tiny digital exterminator

No more hunting mysterious Node processes at 2:47 AM while whispering “who are you.”

---

### Supports Basically Everything
If it runs on your machine, this thing will probably wrangle it.

- Next.js apps
- Vite apps
- Python services
- CLI tools
- Docker containers
- weird side projects you swore were temporary in 2022

The launcher does not judge your stack choices.

Bella the cat does, though.

---

### Click-To-Open Paths
You click the project path.

A terminal opens there instantly.

Because copying paths around like it’s 2006 should have been illegal years ago.

---

### Real-Time Status Monitoring
You can actually see:
- what’s running
- what exploded
- what port something landed on
- which app is currently pretending everything is fine

Like mission control.  
Except the astronauts are JavaScript processes held together by caffeine.

---

## What It ALSO Does  
### Or: How We Finally Put An End To The “AI Can’t Use The Terminal” Nonsense

Here’s where this thing accidentally wandered into the future.

Most AI tools today can *talk* about terminal workflows.  
They can suggest commands.  
They can hallucinate commands with the confidence of a raccoon holding a flamethrower.

But actually letting AI agents operate CLI workflows inside a browser environment?

Historically speaking: absolute nonsense.

So we fixed it.

The Dev Launcher Framework quietly became the bridge that lets AI agents actually interact with real CLI applications through a browser-based environment.

Not fake toy terminals.  
Not “simulated shell experiences.”  
Not sanitized sandbox nonsense wrapped in corporate optimism.

Real processes.  
Real output.  
Real applications.  
Real runtime visibility.

Which means agents can:
- launch services
- monitor workflows
- inspect outputs
- coordinate processes
- manage multi-app environments
- stop things before they become tomorrow’s debugging session

All from the browser.

Which is where things start getting mildly dangerous in the fun way.

Because once agents can actually SEE the environment they’re operating in instead of blindly roleplaying Linux tutorials…

everything changes.

The wall between:
- terminal
- browser
- automation
- and AI coordination

starts collapsing into one giant operational workspace.

And honestly?  
It rules.

---

## Coming Soon From Floyd’s Labs  
### Or: Douglas Definitely Started Another Project Again

This launcher is only the beginning.

We’re also building a dedicated Floyd’s Labs platform focused entirely on:

> **Agentic CLI operation directly in the browser.**

Not “AI chat with terminal aesthetics.”

We mean:
- real browser-native terminal orchestration
- persistent AI workspaces
- multi-agent coordination
- live runtime awareness
- terminals that actually remember things
- operational systems that feel alive instead of disposable

Because terminals deserve better than being treated like ancient forbidden wizard text from 1978.

---

## The Smart Terminal  
### Or: Johnny Five Is Alive And Apparently Knows Bash

Somewhere in the garage, another project is forming.

A smart terminal.

Not just a terminal emulator.  
Not another blinking rectangle pretending to be innovative because it added transparency effects.

We mean a terminal that:
- understands context
- remembers workflows
- coordinates with AI agents
- monitors running systems intelligently
- adapts to how you actually work
- occasionally feels suspiciously sentient

Like if mission control, UNIX philosophy, and a caffeinated robot all merged into one thing.

Honestly the current internal description is basically:

> “Johnny Five, but he learned shell scripting and developed opinions.”

Bella is skeptical.  
Bowser appears deeply interested.  
Douglas keeps muttering “this is gonna be cool” at deeply concerning hours of the night.

---

## Quick Start  
(Or: Summon The Machine)

### 1. Install Everything
```bash
npm install
npm run setup
```

The setup wizard walks you through configuration without making you read a 14-page enterprise PDF written by someone named “Solutions Architect Chad.”

---

### 2. Add Your Apps

Edit:

```bash
backend/apps.local.js
```

Example:

```javascript
export const USER_APPS = [
  {
    id: 'my-app',
    name: 'Cool Thing I Built Instead Of Sleeping',
    path: '~/projects/my-app',
    command: 'npm',
    args: ['run', 'dev'],
    preferredPort: 10010,
    type: 'nextjs'
  }
];
```

That’s basically it.

No YAML labyrinth.  
No “service mesh orchestration strategy.”  
No ceremonial Kubernetes rituals under a full moon.

---

### 3. Launch The Whole Circus

```bash
./start.sh
```

Then the launcher:
- starts backend services
- starts frontend services
- cleans old ports
- opens your browser automatically
- pretends your workflow is organized

Honestly? Kinda magical.

---

## Why This Exists  
(Or: Douglas Got Annoyed Again)

This project was born from the ancient developer ritual of:

1. Open terminal  
2. cd somewhere  
3. npm run dev  
4. Repeat 11 times  
5. Forget which terminal matters  
6. Accidentally kill the database  
7. Experience ego death  

So naturally the response was:
> “I could build something better.”

Which, historically speaking, is how most garage software disasters begin.

Now there’s a dashboard.  
Now there’s process management.  
Now there’s a launcher that behaves like your operating system actually respects your time.

Dangerous evolution.

---

## Configuration  
(Or: Tell The Machine Where Your Weird Stuff Lives)

Supports:
- `~/paths`
- environment variables
- relative paths
- absolute paths
- probably the abandoned project buried in `/Desktop/final-final-REAL/`

Example:

```env
DEV_ROOT=~/projects
BROWSER_APP=Google Chrome
TERMINAL_APP=Terminal.app
```

Simple. Human. Slightly rebellious.

---

## Supported App Types  
(Or: The Creature Collection)

| Type | What It Means |
|---|---|
| `nextjs` | React wizardry |
| `vite` | Fast little gremlin apps |
| `python` | Data science or chaos |
| `python-cli` | Scripts that scare normal people |
| `docker` | Tiny infrastructure boxes |
| `static` | The classics |
| `cli` | Terminal goblin energy |

---

## Features We’re Weirdly Proud Of

### Automatic Cleanup
The launcher kills stale processes automatically.

Because some apps refuse to die with dignity.

---

### Configuration Reloading
Change config. Refresh. Done.

No restart rituals.  
No chanting.  
No enterprise middleware summoning circle.

---

### Mixed Project Support
Frontend. Backend. Scripts. Containers.

One dashboard.

Like a universal remote for your development problems.

---

## The Philosophy  
(Or: Software Should Feel Alive)

Most developer tooling now feels like it was designed inside a glass conference room by people who say things like:
> “Let’s revisit stakeholder alignment.”

This is not that.

This is garage software.

Fast. Useful. Opinionated. Slightly chaotic. Built by people who actually use the thing every day and get angry when it wastes ten seconds.

The launcher exists because repetitive setup work is boring and life is short.

Also because opening twelve terminals every morning slowly turns your soul into drywall dust.

---

## Contributing  
(Or: Join The Problem)

You can:
- fork it
- improve it
- break it
- make it stranger
- add support for your cursed setup

Just don’t turn it into enterprise software.

If someone suggests adding a quarterly roadmap presentation, Bowser will unplug the router again.

---

## Final Notes From The Garage

This thing is not trying to become a “platform.”

It’s trying to make development feel less annoying.

That’s the mission.

A button that launches your entire workflow should not feel like advanced science. It should feel obvious. Like electricity. Or duct tape.

Anyway.

The apps launch.  
The ports work.  
The dashboard lives.  
The AI agents are coordinating again.  
The coffee is terrible.  
The cats are supervising.

Ship something.

---

**DOCUMENT ENDS**

*— Floyd’s Labs*  
*Department of Questionable Productivity Engineering*  
*“If your workflow requires twelve terminals, the workflow is the bug.”*
