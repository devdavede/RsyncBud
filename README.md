<div align="center">
  <h1>RsyncBud 🚀</h1>
  <p>A sleek, context-aware graphical interface for <code>rsync</code> on macOS.</p>
</div>

> [!NOTE]
> 🌊 **Vibe Coded & Quick-Win:** This tool was rapidly put together as a quick-win to solve a very specific workflow annoyance. It works beautifully for its intended purpose. Feel free to fork and bend it to your own needs!

RsyncBud is a modern Electron application designed to act as a **native macOS Finder Quick Action**. It bridges the gap between the raw power of the terminal and the convenience of a beautiful graphical interface, allowing you to seamlessly sync files directly from your right-click menu.

## ✨ Features

- **Finder Integration**: Trigger RsyncBud directly from macOS Finder via Quick Actions. Select your files, right-click, and launch!
- **Beautiful UI**: Frameless window design featuring native macOS traffic lights, deep glassmorphism aesthetics, and smooth CSS animations (powered by TailwindCSS).
- **Smart History**: Automatically tracks your recently used target directories and lets you save your most frequent destinations as Favorites.
- **Visual Options**: Toggle essential `rsync` flags without remembering syntax:
  - **Compress** (`-z`)
  - **Move / Delete Source** (`--remove-source-files`)
  - **Exact Mirror** (`--delete`)
  - **Skip Newer** (`-u`)
  - **Dry Run** (`-n`)
  - **Progress** (`-P`)
- **Real-Time Output**: View the live terminal output seamlessly as `rsync` executes your command.

## 🛠 Initialization

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/rsyncbud.git
   cd rsyncbud
   ```
2. Install the necessary dependencies:
   ```bash
   npm install
   ```

## 🍎 macOS Quick Action Setup

RsyncBud is designed to be deeply integrated into your Mac. To hook it up to Finder:

1. Open the **Automator** application on your Mac.
2. Create a new **Quick Action** (or *Service* on older versions).
3. At the top, set **Workflow receives current** to `files or folders` in `Finder`.
4. Search for the **Run Shell Script** action on the left and drag it into the right panel.
5. Set the "Pass input" dropdown to **as arguments**.
6. Paste the following script (ensuring `APP_DIR` points to your cloned repository):

```bash
#!/bin/bash
export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"

# Auto-detect npm if already installed via nvm or custom profile
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

if [ -f "$HOME/.zshrc" ]; then
    source "$HOME/.zshrc" 2>/dev/null
elif [ -f "$HOME/.bash_profile" ]; then
    source "$HOME/.bash_profile" 2>/dev/null
fi

if ! command -v npm >/dev/null 2>&1; then
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    nvm install --lts
fi

# Path to your RsyncBud app directory
APP_DIR="/Path/To/Your/RsyncBud"
cd "$APP_DIR"

# Install project dependencies if missing
if [ ! -d "node_modules" ]; then
    npm install
fi

# Launch the app and pass the files
npm start -- "$@"
```
7. Save the action (e.g., as **Start Rsync**).
8. **Usage:** Go to Finder, select files, Right-Click -> **Quick Actions** -> **Start Rsync**. 

*(Note: If the menu item is missing, ensure it is enabled in `System Settings > Privacy & Security > Extensions > Finder`).*

## 💻 Development

If you want to test the UI standalone or with mock arguments:
```bash
npm start -- "/dummy/file1.txt" "/dummy/file2.txt"
```
`npm start` rebuilds the Tailwind CSS bundle automatically before launching. While iterating on styles, run `npm run watch:css` in a separate terminal to rebuild on save.

### Project Structure

```
src/
  main/        # Electron main process (window, IPC handlers, rsync execution)
  preload/     # contextBridge API exposed to the renderer
  renderer/    # UI (HTML, Tailwind source, browser-side JS modules)
assets/        # App icon and the bundled Automator Quick Action
```

## 📄 License
This project is licensed under the MIT License.
