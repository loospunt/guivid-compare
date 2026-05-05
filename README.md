# guivid-compare v1.0.0

An sleek Electron frontend for [video-compare](https://github.com/pixop/video-compare). It features MediaInfo integration, precise automatic stream statistics, and detailed background deep-scan extraction.

## Prerequisites
- **Node.js** (v18 or newer recommended)
- **MediaInfo CLI** (Must be the CLI version. Add to your system PATH or specify the path in the app settings)
- **video-compare** (Must be the executable binary)

## How to Build from Source

1. **Clone the repository:**
   ```bash
   git clone <your-repository-url>
   cd guivid-compare
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the app in development mode:**
   ```bash
   npm start
   ```

4. **Package for Windows:**
   If you are on a Windows machine, you can generate a portable standalone folder using:
   ```bash
   npm run package-win
   ```
   *(Note: If you are on macOS/Linux and wish to package for Windows with specific app icons and executable metadata, you will need Wine installed (`brew install --cask wine-stable`), otherwise you can build the portable package without metadata modification directly from your current OS.)*

## License

This project is dual-licensed:

- **Open Source**: Available under the [GNU Affero General Public License v3.0 (AGPL-3.0)](./LICENSE). You can use, modify, and distribute this software for free, provided that any improvements and larger combined works are also open-sourced under the AGPL.
- **Commercial License**: If you wish to use this software without the restrictions of the AGPL (e.g. to embed it in a proprietary closed-source product), please contact the author to acquire a Commercial License.

## Disclaimer

> [!WARNING]
> **Use at your own risk.** This application was developed with the assistance of Artificial Intelligence (AI). While efforts have been made to ensure stability, accuracy, and security, it is provided strictly "as-is." The author is not responsible for any data loss, system instability, or unexpected behavior resulting from the use of this software.
