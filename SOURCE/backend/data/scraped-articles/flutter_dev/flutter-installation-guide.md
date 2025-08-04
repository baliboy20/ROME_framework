---
title: "Flutter Installation Guide"
author: "Flutter Team"
date: "2025-01-20"
source: "https://flutter.dev/docs/get-started/install"
scraped_at: "2025-01-30T09:15:00.000Z"
---

# Flutter Installation Guide

_By Flutter Team • January 20, 2025_

Get started with Flutter by installing it on your development machine.

## System Requirements

Before installing Flutter, make sure your system meets the minimum requirements:

### Windows
- Operating Systems: Windows 10 or later (64-bit)
- Disk Space: 2.8 GB (does not include disk space for IDE/tools)
- Tools: Git for Windows 2.x

### macOS
- Operating Systems: macOS 10.14 (Mojave) or later
- Disk Space: 2.8 GB (does not include disk space for IDE/tools)
- Tools: bash, curl, git 2.x, mkdir, rm, unzip, which

### Linux
- Operating Systems: Linux (64-bit)
- Disk Space: 600 MB (does not include disk space for IDE/tools)
- Tools: bash, curl, file, git 2.x, mkdir, rm, unzip, which, xz-utils

## Installation Steps

### 1. Download Flutter SDK

Visit the Flutter website and download the latest stable release for your operating system.

### 2. Extract the SDK

Extract the downloaded archive to a location on your machine where you want to install Flutter.

### 3. Update PATH

Add the Flutter bin directory to your system PATH:

```bash
export PATH="$PATH:`pwd`/flutter/bin"
```

### 4. Verify Installation

Run the following command to verify your installation:

```bash
flutter doctor
```

This command will check your environment and display a report of the status of your Flutter installation.

## IDE Setup

Flutter supports several IDEs:

- **Android Studio**: Full-featured IDE with Flutter and Dart plugins
- **VS Code**: Lightweight editor with Flutter and Dart extensions
- **IntelliJ IDEA**: Professional IDE with Flutter and Dart plugins

## Next Steps

Once Flutter is installed:

1. Set up an editor
2. Create your first Flutter app
3. Run the app on a device or simulator

Congratulations! You're ready to start building beautiful Flutter applications.

---

_Source: [flutter.dev](https://flutter.dev/docs/get-started/install)_