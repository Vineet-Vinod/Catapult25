import os
import pytest
from executor import execute_output


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


def test_executor():
    test_one()
    test_two()
    test_three()
    test_four()
    test_five()
    test_six()


if __name__ == "__main__":
    test_executor()
