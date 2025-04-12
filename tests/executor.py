import os
import pytest
from src.services.executor import execute_output


creed = """
This is my rifle. There are many like it, but this one is mine.

My rifle is my best friend. It is my life. I must master it as I must master my life.

Without me, my rifle is useless. Without my rifle, I am useless. I must fire my rifle true. I must shoot straighter than my enemy who is trying to kill me. I must shoot him before he shoots me. I will ...

My rifle and I know that what counts in war is not the rounds we fire, the noise of our burst, nor the smoke we make. We know that it is the hits that count. We will hit ...

My rifle is human, even as I [am human], because it is my life. Thus, I will learn it as a brother. I will learn its weaknesses, its strength, its parts, its accessories, its sights and its barrel. I will keep my rifle clean and ready, even as I am clean and ready. We will become part of each other. We will ...

Before God, I swear this creed. My rifle and I are the defenders of my country. We are the masters of our enemy. We are the saviors of my life.

So be it, until victory is America's and there is no enemy, but peace!
"""


def test_one():
    output = {
        "commands": [
            "echo 'Hello, World!'",
            "touch .junk.tmp.txt",
        ],
        "files": [],
    }
    results = execute_output(output)

    assert results[0].stdout == "Hello, World!\n"
    assert os.path.exists(".junk.tmp.txt")


def test_two():
    output = {
        "commands": [],
        "files": [
            {
                "path": "/.junk.tmp.txt",
                "content": creed,
            },
        ]
    }
    results = execute_output(output)

    assert len(results) == 0
    assert os.path.exists(".junk.tmp.txt")


def test_three():
    output = {
        "commands": [
            "cat .junk.tmp.txt",
        ],
        "files": [],
    }
    results = execute_output(output)

    assert os.path.exists(".junk.tmp.txt")


def test_four():
    output = {
        "commands": [
            "rm .junk.tmp.txt",    
        ],
        "files": []
    }
    results = execute_output(output)

    assert not os.path.exists(".junk.tmp.txt")


def test_five():
    output = {
        "commands": [],
        "files": [
            {
                "path": "/.junk/red/orange/yellow/green/blue/purple/rainbow.txt",
                "content": creed,
            }
        ],
    }
    results = execute_output(output)

    assert os.path.exists(".junk/red/orange/yellow/green/blue/purple/rainbow.txt")


def test_six():
    output = {
        "commands": [
            "cat .junk/red/orange/yellow/green/blue/purple/rainbow.txt",
            "rm -r .junk/red/orange/yellow/green/blue/purple/rainbow.txt",
        ],
        "files": [],
    }
    results = execute_output(output)

    assert len(results) == 2
    assert results[0].stdout == creed
    assert not os.path.exists(".junk/red/orange/yellow/green/blue/purple/rainbow.txt")


def test_seven():
    output = {
  "files": [
    {
      "path": "/tic_tac_toe.py",
      "content": "import random\n\n\ndef print_board(board):\n    for row in board:\n        print(' | '.join(row))\n        print('-' * 9)\n\n\ndef get_valid_move(board, player symbol) -> tuple[int, int]:\n    valid_moves = [(i, j) for i in range(3) for j in range(3) if board[i][j] == ' ']\n    random.shuffle(valid_moves)\n    return valid_moves[0]\n\n\ndef check_winner(board):\n    # Check rows\n    for row in board:\n        if all(cell == 'X' for cell in row) or all(cell == 'O' for cell in row):\n            return 'X' if all(cell == 'X' else 'O')\n    # Check columns\n    for col in range(3): \n        if all(board[row][col] == 'X' for row in range(3)) or all(board[row][col] == 'O' for row in range(3)):\n            return 'X' if all(cell == 'X' else 'O')\n    # Check diagonals\n    if (board[0][0] == board[1][1] == board[2][2]) or (board[0][2] == board[1][1] == board[2][0]):\n        return 'X' if all(cell == 'X' else 'O')\n    # Check for tie\n    if all(board[i][j] != ' ' for i in range(3) for j in range(3)):\n        return None\n    return None\n\n\nif __name__ == '__main__':\n    board = [[' ', ' ', ' '],\n             [' ', ' ', ' '],\n             [' ', ' ', ' ']]\n    game_over = False\n    current_player = 'X'\n\n    print(\"Welcome to Tic Tac Toe!\\nYou are X and O takes turns, starting with X\")\n    while True:\n        if not game_over:\n            print_board(board)\n            move = input(f\"Player {current_player}, enter your move (row column): \").split()\n            i, j = int(move[0]), int(move[1])\n\n            if board[i][j] != ' ' or current_player not in ('X', 'O'):\n                print \"Invalid move! Try again\"\n                continue\n            board[i][j] = current_player\n            game_over = check_winner(board)\n            if game_over:\n                winner = check_winner(board)\n                if winner:\n                    print_board(board)\n                    if winner == 'X':\n                        print(f\"Player X wins!\\nGame over!\\nYou lose :(\")\n                    else:\n                        print(f\"Player O wins!\\nGame over!\\nYou win!!!\")\n                    break\n                else:\n                    print_board(board)\n                    print(f\"It's a tie! All spots filled.\\nGame over!\\nEnjoy the game!!!\")\n                    break\n            current_player = 'O' if current_player == 'X' else 'X'\n\n"}
  ],
  "commands": [],
  "notes": "This is a simple Tic Tac Toe game implemented in Python with command line interface. The game includes:\n- Board display\n- Player input validation\n- Win/lose detection\n- Tie detection\n- Game reset\nThe game alternates between players X and O, starting with X.\nWhen the board is full (all spots filled) it results in a tie."
}

    results = execute_output(output)


def test_executor():
    # test_one()
    # test_two()
    # test_three()
    # test_four()
    # test_five()
    # test_six()
    test_seven()


if __name__ == "__main__":
    test_executor()
