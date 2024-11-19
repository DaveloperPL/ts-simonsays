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

export default function SimonSaysTwoPlayer() {
  const [accelerometerData, setAccelerometerData] = useState<AccelerometerData>({});
  const [sequence, setSequence] = useState<Direction[]>([]);
  const [playerMoves, setPlayerMoves] = useState<Direction[]>([]);
  const [isPlayerTurn, setIsPlayerTurn] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("Press Start to Play");
  const [currentPlayer, setCurrentPlayer] = useState<number>(1);
  const [player1Score, setPlayer1Score] = useState<number>(0);
  const [player2Score, setPlayer2Score] = useState<number>(0);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [timer, setTimer] = useState<number | null>(null);

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
        Vibration.vibrate(50); // Vibrate when a tilt is registered
        setPlayerMoves((prevMoves) => [...prevMoves, tilt]);
      }
    }
  }, [accelerometerData]);

  useEffect(() => {
    if (isPlayerTurn) {
      setTimer(10);

      const interval = setInterval(() => {
        setTimer((prev) => (prev !== null ? prev - 1 : null));
      }, 1000);

      return () => clearInterval(interval);
    } else {
      setTimer(null);
    }
  }, [isPlayerTurn]);

  useEffect(() => {
    if (timer === 0) {
      handlePlayerLoss();
    }
  }, [timer]);

  useEffect(() => {
    if (isPlayerTurn && playerMoves.length > 0) {
      const lastMoveIndex = playerMoves.length - 1;
      if (playerMoves[lastMoveIndex] !== sequence[lastMoveIndex]) {
        handlePlayerLoss();
      } else if (playerMoves.length === sequence.length) {
        setMessage("Correct! Next round...");
        updateScore();
        Vibration.vibrate([0, 100, 100, 100]); // Vibrate for successful completion
        nextRound();
      }
    }
  }, [playerMoves]);

  const updateScore = () => {
    if (currentPlayer === 1) {
      setPlayer1Score(player1Score + 1);
    } else {
      setPlayer2Score(player2Score + 1);
    }
  };

  const handlePlayerLoss = () => {
    Vibration.vibrate(500); // Long vibration for loss
    if (currentPlayer === 1) {
      setMessage("Player 1's turn is over! Player 2, get ready!");
      setCurrentPlayer(2);
      resetGameForNextPlayer();
    } else {
      setMessage(determineWinner());
      resetGame();
    }
  };

  const determineWinner = (): string => {
    if (player1Score > player2Score) {
      return `Player 1 Wins! Final Scores - Player 1: ${player1Score}, Player 2: ${player2Score}`;
    } else if (player2Score > player1Score) {
      return `Player 2 Wins! Final Scores - Player 1: ${player1Score}, Player 2: ${player2Score}`;
    } else {
      return `It's a Tie! Final Scores - Player 1: ${player1Score}, Player 2: ${player2Score}`;
    }
  };

  const resetGameForNextPlayer = () => {
    setSequence(generateSequence(1)); // Start fresh with one movement
    setPlayerMoves([]);
    setIsPlayerTurn(false);
    setTimeout(() => {
      setMessage(`Player 2: Watch the sequence!`);
      narrateSequence(sequence);
      setTimeout(() => {
        setMessage("Your turn!");
        setIsPlayerTurn(true);
      }, 1000 * sequence.length);
    }, 2000);
  };

  const resetGame = () => {
    setSequence([]);
    setPlayerMoves([]);
    setIsPlayerTurn(false);
    setPlayer1Score(0);
    setPlayer2Score(0);
    setCurrentPlayer(1);
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
    }, 1000 * newSequence.length);
  };

  const generateSequence = (length = sequence.length + 1): Direction[] => {
    const directions: Direction[] = ["up", "down", "left", "right"];
    const newSequence = [...Array(length)].map(
      () => directions[Math.floor(Math.random() * 4)]
    );
    return newSequence;
  };

  const startGame = () => {
    resetGame();
    setMessage("Player 1: Watch the sequence!");
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
      <Animated.Text style={[styles.header, { opacity: fadeAnim }]}>
        {`Player ${currentPlayer}'s Turn`}
      </Animated.Text>
      <Text style={styles.timer}>
        {isPlayerTurn ? `Time Left: ${timer}s` : ''}
      </Text>
      <Text style={styles.message}>{message}</Text>
      <Text style={styles.sequence}>
        {sequence.map(getDirectionEmoji).join(" ")}
      </Text>
      <TouchableOpacity
        style={styles.button}
        onPress={startGame}
      >
        <Text style={styles.buttonText}>Start Game</Text>
      </TouchableOpacity>
      <View style={styles.scoreBoard}>
        <Text style={styles.score}>Player 1 Score: {player1Score}</Text>
        <Text style={styles.score}>Player 2 Score: {player2Score}</Text>
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
  buttonText: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: 'bold',
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
});
