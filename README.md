# Simon Says Tilt Game 🎮

This is a simple React Native game inspired by the classic "Simon Says" — but instead of pressing buttons, players must tilt their phone in the correct sequence. Built with Expo and React Native, the game uses motion sensors to create an engaging and active experience.

## Features

- 🕹️ **Single-Player Mode**: Watch a countdown, then repeat a random sequence of phone tilts (left, right, forward, back).
- 👥 **Pass-and-Play Mode**: Two players take turns trying to match their own sequences — great for head-to-head challenges.
- ⏱️ **Countdown Timer**: Adds intensity by limiting time to react and perform each tilt.
- 📈 **Streak Tracking**: Tracks how many sequences you’ve completed in a row.

## How to Run

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the development server:

   ```bash
   npx expo start
   ```

You can test on your own device using the Expo Go app or on an emulator/simulator.

## Project Structure

The core logic and screens are located in the `app/` directory. File-based routing is used to organize screens and navigation.

## Technologies Used

- React Native
- Expo
- Expo Sensors (for motion detection)
- React Navigation
