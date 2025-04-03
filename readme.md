# Tab Modifier <img src="https://github.com/calinux-py/TabModifier/blob/main/icons/icon128.png?raw=true" alt="Tab Modifier Icon" width="64" />


A Chrome & Microsoft extension that lets you modify your active tab's title and favicon color and prevent tabs from closing on accident.  
I made it because ConnectWise didn't.

![Tab Modifier Icon](https://github.com/calinux-py/TabModifier/blob/main/icons/yeet.png?raw=true)

## Features

- **Change Tab Title:** Update the title of your current tab.
- **Customize Favicon:** Choose a custom color for the tab's favicon.
- **Protection Mode:** Optionally prevent the tab from closing accidentally.

## Installation

1. Download or clone this repository.
2. Open Chrome and navigate to `chrome://extensions`.
3. Enable **Developer Mode**.
4. Click **Load unpacked** and select the extension's folder.

## Usage

- **Open Popup:** Click the extension icon, right-click and choose "Modify Tab," or press `Alt+T`.
- **Apply Changes:** Enter your desired tab title, select a favicon color, and toggle the protection option.
- **Reset:** Click the "Reset" button to revert the changes.

## Permissions Explained

- **contextMenus:** Adds a custom option in the right-click menu.
- **activeTab:** Grants permission to modify only the tab you’re using.
- **scripting:** Allows the extension to inject and run code on the webpage.
- **storage:** Saves your tab settings like title, favicon color, and protection mode.
