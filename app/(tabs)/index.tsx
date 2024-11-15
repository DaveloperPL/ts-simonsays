import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Vibration, Animated } from 'react-native';
import { Accelerometer } from 'expo-sensors';
import * as Speech from 'expo-speech';

type AccelerometerData = {
  x?: number;
  y?: number;
  z?: number;
};

type Direction = 'up' | 'down' | 'left' | 'right' | null;

export default function SimonSaysGame() {
  const [accelerometerData, setAccelerometerData] = useState<AccelerometerData>({});
  const [sequence, setSequence] = useState<Direction[]>([]);
  const [playerMoves, setPlayerMoves] = useState<Direction[]>([]);
  const [isPlayerTurn, setIsPlayerTurn] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("Press Start to Play");
  const [score, setScore] = useState<number>(0);
  const [record, setRecord] = useState<number>(0);
  const [memoryMode, setMemoryMode] = useState<boolean>(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [timer, setTimer] = useState<number | null>(null);
  const [lastTilt, setLastTilt] = useState<Direction | null>(null);

  const TILT_THRESHOLD = 0.5;

  useEffect(() => {
    Accelerometer.setUpdateInterval(200);
    const subscription = Accelerometer.addListener((data) => setAccelerometerData(data));
    return () => subscription && subscription.remove();
  }, []);

  const detectTilt = (): Direction => {
    const { x = 0, y = 0 } = accelerometerData;
    let tilt: Direction = null;

    if (x > TILT_THRESHOLD) tilt = "left";
    else if (x < -TILT_THRESHOLD) tilt = "right";
    else if (y > TILT_THRESHOLD) tilt = "down";
    else if (y < -TILT_THRESHOLD) tilt = "up";

    return tilt;
  };

  useEffect(() => {
    if (isPlayerTurn && playerMoves.length < sequence.length) {
      const tilt = detectTilt();
      if (tilt && tilt !== playerMoves[playerMoves.length - 1]) {
        setPlayerMoves((prevMoves) => {
          Vibration.vibrate(50); // Vibrate when a move is added
          return [...prevMoves, tilt];
        });
      }
    }
  }, [accelerometerData]);

  useEffect(() => {
    if (isPlayerTurn) {
      setTimer(10); // Initialize the timer with 10 seconds

      const interval = setInterval(() => {
        setTimer((prev) => (prev !== null ? prev - 1 : null));
      }, 1000);

      return () => clearInterval(interval); // Clear timer when turn ends or component unmounts
    } else {
      setTimer(null); // Reset timer when it's not the player's turn
    }
  }, [isPlayerTurn]);

  useEffect(() => {
    if (timer === 0) {
      setMessage(`Game Over! Final Score: ${score}`);
      if (score > record) setRecord(score);
      setScore(0);
      Vibration.vibrate(500);
      resetGame();
    }
  }, [timer]);

  useEffect(() => {
    if (isPlayerTurn && playerMoves.length > 0) {
      const lastMoveIndex = playerMoves.length - 1;
      if (playerMoves[lastMoveIndex] !== sequence[lastMoveIndex]) {
        setMessage(`Game Over! Final Score: ${score}`);
        if (score > record) setRecord(score);
        setScore(0);
        Vibration.vibrate(500);
        resetGame();
      } else if (playerMoves.length === sequence.length) {
        setMessage("Correct! Next round...");
        setScore(score + 1);
        Vibration.vibrate([0, 100, 100, 100]);
        nextRound();
      }
    }
  }, [playerMoves]);

  const resetGame = () => {
    setSequence([]);
    setPlayerMoves([]);
    setIsPlayerTurn(false);
    Animated.timing(fadeAnim, { toValue: 0, duration: 500, useNativeDriver: true }).start();
  };

  const nextRound = () => {
    const newSequence = generateSequence();
    setSequence(newSequence);
    setPlayerMoves([]);
    setIsPlayerTurn(false);
    narrateSequence(newSequence);
    setTimeout(() => {
      setMessage("Your turn!");
      setIsPlayerTurn(true);
    }, 1000 * (newSequence.length + 1));
  };

  const generateSequence = (): Direction[] => {
    const directions: Direction[] = ["up", "down", "left", "right"];
    let newDirection: Direction;
    do {
      newDirection = directions[Math.floor(Math.random() * 4)];
    } while (sequence.length > 0 && newDirection === sequence[sequence.length - 1]);
    return [...sequence, newDirection];
  };

  const startGame = () => {
    setScore(0);
    setMessage("Watch the sequence...");
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    nextRound();
  };

  const narrateSequence = (seq: Direction[]) => {
    seq.forEach((direction, index) => {
      setTimeout(() => Speech.speak(direction || ""), index * 1000);
    });
  };

  const getDirectionEmoji = (direction: Direction): string => {
    switch (direction) {
      case "up": return "⬆️";
      case "down": return "⬇️";
      case "left": return "⬅️";
      case "right": return "➡️";
      default: return "";
    }
  };

  return (
    <View style={styles.container}>
      <Animated.Text style={[styles.header, { opacity: fadeAnim }]}>Simon Says</Animated.Text>
      <Text style={styles.timer}>
        {isPlayerTurn ? `Time Left: ${timer}s` : ''}
      </Text>
      <Text style={styles.message}>{message}</Text>
      <Text style={styles.sequence}>
        {(!isPlayerTurn || !memoryMode) ? sequence.map(getDirectionEmoji).join(" ") : "🔒"}
      </Text>
      <TouchableOpacity
        style={[styles.button, (isPlayerTurn || sequence.length > 0) && styles.buttonDisabled]}
        onPress={startGame}
        disabled={isPlayerTurn || sequence.length > 0}
      >
        <Text style={styles.buttonText}>Start Game</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.memoryModeButton} onPress={() => setMemoryMode(!memoryMode)}>
        <Text style={styles.memoryButtonText}>
          {memoryMode ? "Memory Mode: ON" : "Memory Mode: OFF"}
        </Text>
      </TouchableOpacity>
      <View style={styles.scoreBoard}>
        <Text style={styles.score}>Score: {score}</Text>
        <Text style={styles.record}>Record: {record}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
    padding: 20,
  },
  header: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 20,
  },
  timer: {
    fontSize: 20,
    color: '#ffca28',
    marginBottom: 10,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  message: {
    fontSize: 20,
    color: '#b0bec5',
    textAlign: 'center',
    marginBottom: 10,
  },
  sequence: {
    fontSize: 24,
    color: '#80cbc4',
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#1e88e5',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 5,
    marginVertical: 10,
    width: '60%',
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#455a64',
  },
  buttonText: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  memoryModeButton: {
    backgroundColor: '#26a69a',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    width: '60%',
    alignItems: 'center',
    marginBottom: 20,
  },
  memoryButtonText: {
    fontSize: 16,
    color: '#ffffff',
  },
  scoreBoard: {
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#263238',
    borderRadius: 10,
    marginTop: 20,
    width: '80%',
  },
  score: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#80cbc4',
  },
  record: {
    fontSize: 18,
    color: '#ffca28',
    marginTop: 5,
  },
});
