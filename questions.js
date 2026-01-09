// Circuit Questions Database organized by Bloom's Taxonomy levels
const circuitQuestions = {
    // Level 1: Remembering (Recall basic facts)
    1: [
        {
            id: 1,
            question: "What is the unit of electrical resistance?",
            options: ["Volt", "Ampere", "Ohm", "Watt"],
            correct: 2,
            explanation: "The ohm (Ω) is the SI unit of electrical resistance, named after Georg Simon Ohm.",
            difficulty: "Remembering"
        },
        {
            id: 2,
            question: "Which component stores electrical energy in a circuit?",
            options: ["Resistor", "Capacitor", "Transistor", "Inductor"],
            correct: 1,
            explanation: "A capacitor stores electrical energy in an electric field between its plates.",
            difficulty: "Remembering"
        },
        {
            id: 3,
            question: "What does DC stand for in electrical circuits?",
            options: ["Digital Current", "Direct Current", "Dual Circuit", "Dynamic Charge"],
            correct: 1,
            explanation: "DC stands for Direct Current, which flows consistently in one direction.",
            difficulty: "Remembering"
        },
        {
            id: 4,
            question: "Which law relates voltage, current, and resistance?",
            options: ["Kirchhoff's Law", "Faraday's Law", "Ohm's Law", "Coulomb's Law"],
            correct: 2,
            explanation: "Ohm's Law states that V = I × R, where V is voltage, I is current, and R is resistance.",
            difficulty: "Remembering"
        },
        {
            id: 5,
            question: "What is the symbol for a battery in circuit diagrams?",
            options: ["A zigzag line", "Two parallel lines (one long, one short)", "A circle", "A triangle"],
            correct: 1,
            explanation: "A battery is represented by alternating long and short parallel lines.",
            difficulty: "Remembering"
        }
    ],

    // Level 2: Understanding (Explain concepts)
    2: [
        {
            id: 6,
            question: "If resistance increases while voltage stays constant, what happens to current?",
            options: ["Current increases", "Current decreases", "Current stays the same", "Current becomes zero"],
            correct: 1,
            explanation: "According to Ohm's Law (I = V/R), if R increases while V is constant, I decreases.",
            difficulty: "Understanding"
        },
        {
            id: 7,
            question: "Why are house lights typically wired in parallel rather than series?",
            options: ["Parallel uses less wire", "Parallel is safer", "If one fails, others stay on", "Parallel gives more voltage"],
            correct: 2,
            explanation: "In parallel circuits, each device has its own path, so others continue working if one fails.",
            difficulty: "Understanding"
        },
        {
            id: 8,
            question: "What is the purpose of a resistor in a circuit?",
            options: ["Increase current", "Store charge", "Limit current", "Generate voltage"],
            correct: 2,
            explanation: "Resistors limit or control the flow of current in a circuit.",
            difficulty: "Understanding"
        },
        {
            id: 9,
            question: "In a parallel circuit, the voltage across each branch is:",
            options: ["Different", "The same", "Zero", "Increasing"],
            correct: 1,
            explanation: "In parallel circuits, all components have the same voltage across them.",
            difficulty: "Understanding"
        },
        {
            id: 10,
            question: "What happens when you add more bulbs in series to a circuit?",
            options: ["They get brighter", "They get dimmer", "Brightness stays same", "Only last bulb lights"],
            correct: 1,
            explanation: "Adding bulbs in series increases total resistance, reducing current and making each dimmer.",
            difficulty: "Understanding"
        }
    ],

    // Level 3: Applying (Use formulas)
    3: [
        {
            id: 11,
            question: "A circuit has a 12V battery and 4Ω resistor. What is the current?",
            options: ["3A", "48A", "0.33A", "8A"],
            correct: 0,
            explanation: "Using Ohm's Law: I = V/R = 12V/4Ω = 3A",
            difficulty: "Applying"
        },
        {
            id: 12,
            question: "Three resistors (2Ω, 3Ω, 5Ω) are in series. Total resistance?",
            options: ["10Ω", "1.03Ω", "0.97Ω", "30Ω"],
            correct: 0,
            explanation: "Series resistances add: R_total = 2Ω + 3Ω + 5Ω = 10Ω",
            difficulty: "Applying"
        },
        {
            id: 13,
            question: "Two resistors (6Ω and 12Ω) are in parallel. Total resistance?",
            options: ["18Ω", "9Ω", "4Ω", "2Ω"],
            correct: 2,
            explanation: "1/R_total = 1/6 + 1/12 = 3/12 = 1/4, so R_total = 4Ω",
            difficulty: "Applying"
        },
        {
            id: 14,
            question: "A 9V battery produces 0.5A current. What is the resistance?",
            options: ["4.5Ω", "18Ω", "0.056Ω", "9.5Ω"],
            correct: 1,
            explanation: "R = V/I = 9V/0.5A = 18Ω",
            difficulty: "Applying"
        },
        {
            id: 15,
            question: "Three 9Ω resistors in parallel have what total resistance?",
            options: ["27Ω", "9Ω", "3Ω", "1Ω"],
            correct: 2,
            explanation: "For identical resistors in parallel: R_total = R/n = 9Ω/3 = 3Ω",
            difficulty: "Applying"
        }
    ],

    // Level 4: Analyzing (Interpret relationships)
    4: [
        {
            id: 16,
            question: "Two bulbs in series: A is brighter than B. Which has higher resistance?",
            options: ["Bulb A", "Bulb B", "Same resistance", "Cannot determine"],
            correct: 0,
            explanation: "In series, current is same. Brighter bulb dissipates more power (P=I²R), so higher R.",
            difficulty: "Analyzing"
        },
        {
            id: 17,
            question: "In a 12V circuit, a resistor drops 4V. What about other components?",
            options: ["They use 8V total", "Only one resistor", "Battery faulty", "No other components"],
            correct: 0,
            explanation: "Kirchhoff's Voltage Law: Sum of voltage drops equals source voltage (12V - 4V = 8V).",
            difficulty: "Analyzing"
        },
        {
            id: 18,
            question: "Two parallel branches: 10Ω and 20Ω resistors. Which has more current?",
            options: ["10Ω branch", "20Ω branch", "Equal current", "Depends on voltage"],
            correct: 0,
            explanation: "In parallel, voltage is same. I = V/R, so lower resistance (10Ω) has higher current.",
            difficulty: "Analyzing"
        },
        {
            id: 19,
            question: "Adding a resistor in parallel with an existing resistor:",
            options: ["Increases total resistance", "Decreases total resistance", "No change", "Depends on values"],
            correct: 1,
            explanation: "Adding parallel paths decreases total resistance (more paths for current).",
            difficulty: "Analyzing"
        },
        {
            id: 20,
            question: "A 6V battery with 2Ω and 4Ω resistors in series. Voltage across 4Ω?",
            options: ["2V", "4V", "6V", "1.5V"],
            correct: 1,
            explanation: "Total R = 6Ω, I = 1A. V_4Ω = I×R = 1A×4Ω = 4V",
            difficulty: "Analyzing"
        }
    ],

    // Level 5: Evaluating (Make judgments)
    5: [
        {
            id: 21,
            question: "Which configuration gives highest total resistance for 3 identical resistors?",
            options: ["All series", "All parallel", "Two parallel with one series", "Two series with one parallel"],
            correct: 0,
            explanation: "Series gives highest R (3R), parallel gives lowest (R/3), mixed gives intermediate.",
            difficulty: "Evaluating"
        },
        {
            id: 22,
            question: "How should you connect an ammeter to measure current?",
            options: ["In parallel", "In series", "Across power supply", "Doesn't matter"],
            correct: 1,
            explanation: "Ammeters measure current through them, so must be in series with the component.",
            difficulty: "Evaluating"
        },
        {
            id: 23,
            question: "You need a circuit where components work independently. Use:",
            options: ["Series", "Parallel", "Either", "Depends on components"],
            correct: 1,
            explanation: "Parallel allows independent operation; series makes all dependent on each other.",
            difficulty: "Evaluating"
        },
        {
            id: 24,
            question: "To drop voltage from 12V to 6V for a device drawing 0.5A, what resistor needed?",
            options: ["6Ω", "12Ω", "24Ω", "3Ω"],
            correct: 1,
            explanation: "Resistor must drop 6V at 0.5A: R = V/I = 6V/0.5A = 12Ω",
            difficulty: "Evaluating"
        },
        {
            id: 25,
            question: "Adding appliances to a parallel house circuit:",
            options: ["Decreases total current", "Increases total current", "No change", "Increases voltage"],
            correct: 1,
            explanation: "Adding parallel appliances decreases total resistance, increasing total current.",
            difficulty: "Evaluating"
        }
    ]
};

// Get a random question for a specific level
function getRandomQuestion(level) {
    const levelNum = Math.min(5, Math.ceil(level / 5)); // Scale 22 levels to 5 difficulty levels
    const questions = circuitQuestions[levelNum];
    return questions[Math.floor(Math.random() * questions.length)];
}

// Get all questions for a level (for quiz mode)
function getQuestionsForLevel(level) {
    const levelNum = Math.min(5, Math.ceil(level / 5));
    return circuitQuestions[levelNum] || circuitQuestions[1];
}

// Get question by ID (for specific challenges)
function getQuestionById(id) {
    for (const level in circuitQuestions) {
        const question = circuitQuestions[level].find(q => q.id === id);
        if (question) return question;
    }
    return null;
}

// Export for use in game.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        circuitQuestions,
        getRandomQuestion,
        getQuestionsForLevel,
        getQuestionById
    };
}
