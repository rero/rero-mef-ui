# Claude Code skills

## angular-developer

Official Angular skill from https://github.com/angular/skills (see
https://angular.dev/ai/agent-skills), MIT license.

Installed with the [skills](https://github.com/vercel-labs/skills) CLI, as a copy for Claude Code
(no symbolic link, so that it works for everyone after a clone):

```sh
pnpm dlx skills add https://github.com/angular/skills --skill angular-developer -a claude-code --copy -y
```

The source and hash of the installed version are recorded in `skills-lock.json` (project root).
To update it:

```sh
pnpm dlx skills update
```

The `angular-new-app` skill of the same repository is not installed: it creates new applications.
