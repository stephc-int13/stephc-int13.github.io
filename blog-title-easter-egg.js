(() => {
    const link = document.querySelector("nav .blog-title");
    if (!link) return;

    const label = link.textContent.trim();
    const glyphs = Array.from(label);
    const length = glyphs.length;
    const home = new URL(link.href);
    const directory = new URL("./", home);
    const hostname = label.slice(1, -1);
    const hexBytes = glyphs.map((glyph) => glyph.codePointAt(0).toString(16).padStart(2, "0").toUpperCase());

    function sequence(id, ...steps) {
        return {
            id,
            duration: steps.reduce((total, [milliseconds]) => total + milliseconds, 0),
            render(elapsed) {
                for (const [milliseconds, content] of steps) {
                    if (elapsed < milliseconds) {
                        return typeof content === "string" ? content : content(elapsed / milliseconds);
                    }
                    elapsed -= milliseconds;
                }
                return label;
            }
        };
    }

    function slowSequence(id, ...steps) {
        return sequence(id, ...steps.map(([milliseconds, content]) => [milliseconds * 2, content]));
    }

    function type(text, progress) {
        const characters = Array.from(text);
        const count = Math.floor(progress * (characters.length + 1));
        return characters.slice(0, count).join("") + (count < characters.length ? "_" : "");
    }

    function scrollLine(text, millisecondsPerCell = 150) {
        const padding = " ".repeat(length);
        const strip = padding + text + padding;
        const frames = strip.length - length + 1;
        return [frames * millisecondsPerCell, (progress) => {
            const start = Math.floor(progress * frames);
            return strip.slice(start, start + length);
        }];
    }

    function stackLine(level, value) {
        const prefix = level + ":";
        return prefix + String(value).padStart(length - prefix.length, " ");
    }

    function ticTacToeFrames(moves, millisecondsPerMove) {
        const board = Array(9).fill(".");
        const turns = moves.map((square, turn) => {
            board[square] = turn % 2 === 0 ? "X" : "O";
            const cells = board.join("");
            return [millisecondsPerMove, cells.slice(0, 3) + "/" + cells.slice(3, 6) + "/" + cells.slice(6)];
        });
        return [[millisecondsPerMove, ".../.../..."], ...turns];
    }

    function progressBar(progress) {
        const slots = Math.max(0, length - 6);
        const filled = Math.floor(progress * slots);
        const percent = String(Math.floor(progress * 100)).padStart(3, " ");
        return "[" + "#".repeat(filled) + ".".repeat(slots - filled) + "]" + percent + "%";
    }

    const errorPositions = [2, 5, 9];
    function repair(progress) {
        const repaired = Math.floor(progress * (errorPositions.length + 1));
        return glyphs.map((glyph, index) => {
            const error = errorPositions.indexOf(index);
            return error >= repaired ? "!?#"[error] : glyph;
        }).join("");
    }

    function assemble(parity, progress) {
        const received = Math.floor(progress * Math.ceil(length / 2));
        return glyphs.map((glyph, index) => {
            const part = index % 2;
            return part < parity || (part === parity && Math.floor(index / 2) < received) ? glyph : ".";
        }).join("");
    }

    const morse = { s: "...", t: "-", e: ".", p: ".--.", h: "....", c: "-.-.", ".": ".-.-.-", n: "-." };
    const signal = Array.from(hostname, (glyph) => morse[glyph.toLowerCase()] ?? "?").join(" ");
    const tape = hexBytes.map((byte) => Number.parseInt(byte, 16).toString(2).padStart(8, "0")).join("");
    const rotor = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    // Rule 30 evolves one row of cells at a time from a single filled cell.
    let row = glyphs.map((_, index) => Number(index === Math.floor(length / 2)));
    const generations = Array.from({ length: 42 }, () => {
        const pattern = row.map((cell) => cell ? "#" : ".").join("");
        row = row.map((cell, index) => (row[index - 1] ?? 0) ^ (cell | (row[index + 1] ?? 0)));
        return pattern;
    });

    function telemetry(altitude, speed) {
        const altitudeText = String(Math.ceil(altitude)).padStart(3, "0");
        const speedText = String(Math.round(speed)).padStart(2, "0");
        return altitudeText + "M -" + speedText + "M/S";
    }

    const spectrumScale = " .:-=+*#@";
    const signalStrengths = [1, 2, 4, 7, 5, 2, 1, 3, 6, 4, 2, 1];
    function spectrum(gain, sample) {
        return glyphs.map((_, index) => {
            const noise = (sample * (index % 3 + 1) + index * 7) % 3;
            const signalLevel = signalStrengths[index % signalStrengths.length] * gain;
            return spectrumScale[Math.round(signalLevel + noise / 2)];
        }).join("");
    }
    const lockedSpectrum = spectrum(1, 0);
    const cartoonSignOff = "   FOLKS!   ";
    const billboard = "ENJOY TODAY!";
    const hiddenBillboard = "DO NOT THINK";
    const broadcast = "KAB / ON AIR";
    const chevrons = "/\\".repeat(Math.ceil(length / 2)).slice(0, length);
    const reversedTitle = [...glyphs].reverse().join("");
    const archonStars = ".  *  .    .";
    const archonSky = "+  .  *   . ";
    const shadokDigits = ["GA", "BU", "ZO", "MEU"];
    const silencioPlayback = [
        [280, ">..:||:....."],
        [320, ">.:|!!|:...."],
        [340, ">..:||||:..."],
        [280, ">...:||:...."],
        [300, ">.....:|:..."]
    ];

    const titleEffects = [
        sequence("title-typewriter",
            [1250, (p) => type(label, p)],
            [450, label]
        ),
        sequence("title-sweep",
            [1300, (p) => {
                const head = Math.floor(p * length);
                return glyphs.map((glyph, index) => index < head ? glyph : index === head ? "|" : ".").join("");
            }],
            [450, label]
        ),
        sequence("title-mirror",
            [500, reversedTitle],
            [1000, (p) => {
                const restored = Math.floor(p * length);
                return glyphs.map((glyph, index) => index < restored ? glyph : glyphs[length - index - 1]).join("");
            }],
            [450, label]
        ),
        sequence("title-alternating",
            [700, (p) => assemble(0, p)],
            [750, (p) => assemble(1, p)],
            [450, label]
        )
    ];

    const referenceEffects = [
        // Cold boot with a memory count before the host name is printed.
        sequence("cold-boot",
            [650, "RESET 0000"],
            [850, "ROM 064K OK"],
            [1480, (p) => "RAM " + String(Math.floor(p * 64)).padStart(2, "0") + "K"],
            [740, "RAM 64K OK"],
            [650, "MOUNT /"],
            [730, "FS CHECK OK"],
            [840, "BOOT /HOST"],
            [760, "SYSTEM READY"],
            [1320, (p) => type(label, p)],
            [620, label]
        ),
        // A shell prompt types the command and prints its result.
        sequence("shell-hostname",
            [620, "$ _"],
            [1230, (p) => type("$ whoami", p)],
            [820, "guest"],
            [1100, (p) => type("$ pwd", p)],
            [810, "/home/guest"],
            [1380, (p) => type("$ hostname", p)],
            [530, "$ hostname"],
            [1230, (p) => type(hostname, p)],
            [720, hostname],
            [600, label]
        ),
        // The modem retries a failed call, then decodes the incoming bit stream.
        sequence("dial-up",
            [600, "ATZ"],
            [530, "OK"],
            [1500, (p) => type("ATDT 5550100", p)],
            [740, "DIALING..."],
            [920, "NO CARRIER"],
            [820, "REDIAL..."],
            [820, "CONNECT 56K"],
            [2130, (p) => {
                const step = Math.floor(p * 18);
                const decoded = Math.floor(p * (length + 1));
                return glyphs.map((glyph, i) => i >= length - decoded ? glyph : tape[(step + i) % tape.length]).join("");
            }],
            [650, label]
        ),
        // A byte dump walks through the actual characters of the title.
        sequence("hex-dump",
            [720, "DUMP HOST"],
            [3120, (p) => {
                const offset = 2 * Math.floor(p * Math.ceil(length / 2));
                return offset.toString(16).toUpperCase().padStart(4, "0") + ": " + hexBytes.slice(offset, offset + 2).join(" ");
            }],
            [830, length + " BYTES"],
            [940, "END BYTE: " + hexBytes[hexBytes.length - 1]],
            [810, "ASCII OUT"],
            [1340, (p) => type(label, p)],
            [640, label]
        ),
        // A damaged frame fails its checksum and gets repaired in place.
        sequence("checksum-repair",
            [660, "RECV FRAME"],
            [780, repair(0)],
            [850, "CRC ERROR"],
            [760, "NACK / RETRY"],
            [850, "RESEND OK"],
            [730, "FIX 3 BYTES"],
            [1960, repair],
            [780, "CRC OK"],
            [630, "ACK"],
            [640, label]
        ),
        // A 32-bit register counts down to zero and releases the host name.
        sequence("register-countdown",
            [690, "REG32 ARM"],
            [860, "0xFFFFFFFF"],
            [740, "DECAY / 01"],
            [2660, (p) => "0x" + Math.floor((1 - p) ** 2 * 0xffffffff).toString(16).toUpperCase().padStart(8, "0")],
            [830, "0x00000000"],
            [770, "ZERO SIGNAL"],
            [1450, (p) => {
                const done = Math.floor(p * Math.ceil(length / 2));
                return glyphs.map((glyph, i) => Math.min(i, length - 1 - i) < done ? glyph : "0").join("");
            }],
            [650, label]
        ),
        // Each cipher rotor stops independently on its decoded character.
        sequence("rotor-cipher",
            [710, "KEY LOAD"],
            [810, "ROTOR HOME"],
            [1230, (p) => "SET KEY " + rotor[Math.floor(p * rotor.length)]],
            [750, "KEY FOUND"],
            [2580, (p) => {
                const step = Math.floor(p * 22);
                const locked = Math.floor(p * (length + 1));
                return glyphs.map((glyph, i) => i === 0 || i === length - 1 || (i * 7) % length < locked
                    ? glyph
                    : rotor[(i * 11 + step * (i % 3 + 1)) % rotor.length]).join("");
            }],
            [810, "KEY OK"],
            [730, "PLAIN TEXT"],
            [640, label]
        ),
        // The scan writes marks on the outward pass and letters on the return.
        sequence("two-pass-scan",
            [680, "SCAN START"],
            [750, "FIND EDGES"],
            [1520, (p) => {
                const head = Math.floor(p * length);
                return glyphs.map((_, i) => i < head ? "=" : i === head ? ">" : ".").join("");
            }],
            [690, "=".repeat(length)],
            [820, "PASS 2/2"],
            [1620, (p) => {
                const head = length - 1 - Math.floor(p * length);
                return glyphs.map((glyph, i) => i > head ? glyph : i === head ? "<" : "=").join("");
            }],
            [810, length + " CELLS OK"],
            [650, label]
        ),
        // A progress bar pauses for verification before opening the title.
        sequence("file-loader",
            [670, "LOAD /HOST"],
            [740, "CACHE MISS"],
            [650, "READ LOCAL"],
            [2660, progressBar],
            [810, progressBar(1)],
            [900, "VERIFY..."],
            [810, "OPEN OK"],
            [1300, (p) => type(label, p)],
            [650, label]
        ),
        // Two packets fill alternating cells before the frame is complete.
        sequence("packet-assembly",
            [700, "RX 1/2"],
            [1440, (p) => assemble(0, p)],
            [730, assemble(0, 1)],
            [800, "PKT 2 LOST"],
            [850, "RESEND 2"],
            [680, "RX 2/2"],
            [1530, (p) => assemble(1, p)],
            [810, "FRAME OK"],
            [650, label]
        ),
        // Morse symbols fill successive rows, then the receiver prints the result.
        sequence("morse-code",
            [690, "MORSE TX"],
            [790, "CALLING..."],
            [2760, (p) => {
                const sent = Math.floor(p * (signal.length + 1));
                const row = Math.floor(Math.max(0, sent - 1) / length) * length;
                const symbols = signal.slice(row, sent);
                return symbols.length === length ? symbols : symbols + "_";
            }],
            [750, "RX COMPLETE"],
            [810, "DECODE CW"],
            [1350, (p) => type(hostname, p)],
            [730, hostname],
            [650, label]
        ),
        // A paper tape moves beneath a fixed read head.
        sequence("paper-tape",
            [690, "INSERT TAPE"],
            [750, "REEL 01"],
            [780, "SET READHEAD"],
            [2460, (p) => {
                const offset = Math.floor(p * tape.length);
                const readHead = Math.floor(length / 2);
                return glyphs.map((_, i) => i === readHead ? "|" : tape[(offset + i) % tape.length] === "1" ? "o" : ".").join("");
            }],
            [790, "END OF TAPE"],
            [790, "REWIND <<"],
            [790, "PRINT BUFFER"],
            [1390, (p) => {
                const count = Math.floor(p * (length + 1));
                return label.slice(length - count).padStart(length, " ");
            }],
            [650, label]
        ),
        // A miniature text adventure ends at a sign bearing the title.
        slowSequence("text-adventure",
            [540, "DARK ROOM"],
            [760, (p) => type("> LOOK", p)],
            [750, "A KEY / DOOR"],
            [760, (p) => type("> TAKE KEY", p)],
            [430, "KEY TAKEN"],
            [850, (p) => type("> UNLOCK", p)],
            [590, "* CLICK *"],
            [770, (p) => type("> GO NORTH", p)],
            [480, "A COLD HALL"],
            [660, "A SIGN READS"],
            [1240, (p) => type(label, p)],
            [680, label]
        ),
        // A cellular automaton runs at two speeds before its final row is printed over.
        slowSequence("rule-30",
            [590, "RULE 30"],
            [560, "SEED 0001"],
            [1820, (p) => generations[Math.floor(p * 9)]],
            [480, "CLOCK x3"],
            [2260, (p) => generations[9 + Math.floor(p * (generations.length - 9))]],
            [460, generations.length + " ROWS"],
            [450, "HALT"],
            [1350, (p) => {
                const written = Math.floor(p * (length + 1));
                return label.slice(0, written) + generations[generations.length - 1].slice(written);
            }],
            [620, label]
        ),
        // Altitude and descent rate update as a lander fires its engines.
        slowSequence("lunar-lander",
            [650, "LANDER RX"],
            [560, "DESCENT AUTO"],
            [1950, (p) => telemetry(120 - 62 * p, 28 + 6 * p)],
            [650, "RETROBURN"],
            [2250, (p) => telemetry(58 * (1 - p) ** 2, 34 * (1 - p))],
            [510, "TOUCHDOWN"],
            [570, "DUST SETTLES"],
            [610, "BASE BEACON"],
            [1110, (p) => type(label, p)],
            [650, label]
        ),
        // A spectrum display picks out two peaks in a noisy signal.
        slowSequence("spectrum-scanner",
            [600, "SPECTRUM RX"],
            [1280, (p) => spectrum(0, Math.floor(p * 11))],
            [500, "NO CARRIER"],
            [590, "GAIN UP"],
            [1960, (p) => spectrum(p, Math.floor(p * 17))],
            [610, lockedSpectrum],
            [590, "CARRIER LOCK"],
            [1580, (p) => {
                const decoded = Math.floor(p * (length + 1));
                return lockedSpectrum.slice(0, length - decoded) + label.slice(length - decoded);
            }],
            [630, label]
        ),
        // A tiny BASIC program prompts for the name, then echoes it back.
        slowSequence("basic-program",
            [510, "READY."],
            [430, "NEW"],
            [850, (p) => type("10 INPUT A$", p)],
            [850, (p) => type("20 PRINT A$", p)],
            [700, (p) => type("30 END", p)],
            [620, (p) => type("RUN", p)],
            [570, "? _"],
            [1510, (p) => type("? " + hostname, p)],
            [380, "? " + hostname],
            [1140, (p) => type(hostname, p)],
            [480, "READY."],
            [650, label]
        ),
        // A test chamber promises dessert and delivers an empty tray.
        slowSequence("portal-cake",
            [750, "TEST ROOM 08"],
            [800, "REWARD: CAKE"],
            [530, "ORDER READY"],
            [1090, (p) => type("> SCAN TRAY", p)],
            [1450, (p) => {
                const scanned = Math.floor(p * 5);
                return "TRAY [" + " ".repeat(scanned) + "*" + ".".repeat(4 - scanned) + "]";
            }],
            [900, "TRAY [     ]"],
            [1150, "CAKE: A LIE"],
            [850, "EXIT OPEN"],
            [1000, (p) => type(label, p)],
            [550, label]
        ),
        // An action hero runs out of gum before running out of doors to kick.
        slowSequence("duke-nukem-door",
            [700, "GUM: ZERO"],
            [700, "BOOTS: TWO"],
            [800, "DOOR LOCKED"],
            [1050, (p) => type("> TRY KNOB", p)],
            [680, "NOPE."],
            [470, "PLAN B"],
            [1050, (p) => type("> APPLY BOOT", p)],
            [420, "[====||====]"],
            [300, "[===/  \\===]"],
            [800, "[__/    \\__]"],
            [1220, "I KNOCKED."],
            [620, label]
        ),
        // A cartoon sign-off with a one-row ASCII iris close.
        slowSequence("looney-tunes",
            [640, "----(3)-----"],
            [640, "----(2)-----"],
            [640, "----(1)-----"],
            [450, "((        ))"],
            [1050, " THAT'S ALL "],
            [1050, cartoonSignOff],
            [1950, (p) => {
                const closed = Math.floor(p * (Math.ceil(length / 2) + 1));
                return glyphs.map((_, index) => Math.min(index, length - 1 - index) < closed
                    ? "#"
                    : cartoonSignOff[index] ?? " ").join("");
            }],
            [490, "END OF REEL"],
            [420, ""],
            [650, label]
        ),
        // The CPC boots into Locomotive BASIC and runs a program from Drive A:.
        slowSequence("amstrad-cpc-6128",
            [700, "CPC 6128"],
            [680, "Amstrad 128K"],
            [760, "BASIC 1.1"],
            [680, "Ready"],
            [790, (p) => type("mode 2", p)],
            [680, (p) => type("cat", p)],
            [470, "Drive A:"],
            [520, "DISC READY"],
            [820, "HOST.BAS  1K"],
            [1230, (p) => type('run "host"', p)],
            [420, ""],
            [1000, (p) => type(label, p)],
            [700, label]
        ),
        // An original one-row warehouse puzzle. @ pushes $ onto the marked goal.
        slowSequence("sokoban",
            [680, "PUSH / 01"],
            [460, "GOAL: ."],
            [850, "#@ $     . #"],
            [500, "# @$     . #"],
            [520, "#  @$    . #"],
            [570, "#   @$   . #"],
            [620, "#    @$  . #"],
            [670, "#     @$ . #"],
            [720, "#      @$. #"],
            [1030, "#       @* #"],
            [1010, "LEVEL CLEAR"],
            [980, (p) => type(label, p)],
            [580, label]
        ),
        // Deep Thought delivers an answer and leaves the question open.
        slowSequence("hitchhikers-guide",
            [1000, "DON'T PANIC!"],
            [940, "DEEP THOUGHT"],
            [540, "QUERY QUEUED"],
            [2350, (p) => (p * 7.5).toFixed(1) + "M YEARS"],
            [550, "7.5M YEARS"],
            [720, "THE ANSWER"],
            [1140, "     42     "],
            [920, "QUESTION?"],
            [740, "ASK EARTH"],
            [680, label]
        ),
        // Vim refuses to quit until the buffer containing the hostname is saved.
        slowSequence("vim",
            [1000, (p) => type("$ vim notes", p)],
            [690, "-- INSERT --"],
            [1200, (p) => type(hostname, p)],
            [380, "[Esc]"],
            [680, (p) => type(":q", p)],
            [1050, "E37: CHANGES"],
            [880, (p) => type(":help quit", p)],
            [630, "SAVE & QUIT"],
            [710, (p) => type(":wq", p)],
            [520, "WRITING..."],
            [600, '"notes" 1L'],
            [700, label]
        ),
        // They Live. The sunglasses decode a billboard one cell at a time.
        slowSequence("they-live",
            [1050, billboard],
            [520, "[ AD BREAK ]"],
            [800, "  (o)--(o)  "],
            [700, "GLASSES ON"],
            [1640, (p) => {
                const exposed = Math.floor(p * (length + 1));
                return hiddenBillboard.slice(0, exposed) + billboard.slice(exposed);
            }],
            [1150, hiddenBillboard],
            [900, "    OBEY    "],
            [730, "GLASSES OFF"],
            [850, billboard],
            [580, label]
        ),
        // The Thing. Hold on the dish long enough for it to seem safe.
        slowSequence("the-thing",
            [850, "OUTPOST 31"],
            [750, "SAMPLE 01"],
            [1000, "[    .     ]"],
            [580, "NO REACTION"],
            [550, "ROOM QUIET"],
            [600, "SAMPLE 02"],
            [1650, "[    .     ]"],
            [350, "[    o     ]"],
            [200, "[   \\^/    ]"],
            [230, "[  /\\_/\\   ]"],
            [820, "[ /\\/|\\/\\  ]"],
            [1250, "WHO'S LEFT?"],
            [650, label]
        ),
        // Escape from New York. A wireframe glider approach and a very late extraction.
        slowSequence("escape-from-new-york",
            [920, "NYC / 1997"],
            [760, "GLIDER IN"],
            [480, "RADAR LOCK"],
            [470, "[....+.....]"],
            [420, "[..../\\....]"],
            [420, "[.../==\\...]"],
            [420, "[../=++=\\..]"],
            [420, "[./=++++=\\.]"],
            [480, "[==========]"],
            [650, "SNAKE / IN"],
            [1760, (p) => "T-00:00:0" + (9 - Math.floor(p * 9))],
            [970, "SNAKE / OUT"],
            [650, label]
        ),
        // Halloween. The shape in the doorway is still there when the light returns.
        slowSequence("halloween",
            [860, "HADDONFIELD"],
            [850, "OCT 31"],
            [730, "11:59 PM"],
            [550, "PORCH LIGHT"],
            [900, "[    ||    ]"],
            [780, "[    ..    ]"],
            [1120, "[    /o\\   ]"],
            [1050, ""],
            [1200, "[    /o\\   ]"],
            [850, "STILL THERE"],
            [680, label]
        ),
        // The Fog. A lighthouse broadcast disappears beneath a bank of tildes.
        slowSequence("the-fog",
            [790, "ANTONIO BAY"],
            [890, "LIGHTHOUSE"],
            [540, "BUOY LOST"],
            [860, broadcast],
            [1840, (p) => {
                const covered = Math.floor(p * (length + 1));
                return "~".repeat(covered) + broadcast.slice(covered);
            }],
            [760, "~~~~~~~~~~~~"],
            [640, "[   KNOCK  ]"],
            [420, "[          ]"],
            [590, "[   KNOCK  ]"],
            [420, "[          ]"],
            [800, "[   KNOCK  ]"],
            [900, "OFF AIR"],
            [630, label]
        ),
        // Twin Peaks. The Red Room writes the title backwards across its floor.
        slowSequence("twin-peaks",
            [960, "THE RED ROOM"],
            [560, "CURTAIN"],
            [1160, chevrons],
            [1460, (p) => String(Math.floor(p * 25)).padStart(2, "0") + " YEARS"],
            [920, "25 YEARS"],
            [780, chevrons],
            [1820, (p) => {
                const remaining = length - Math.floor(p * (length + 1));
                return chevrons.slice(0, remaining) + reversedTitle.slice(remaining);
            }],
            [1060, reversedTitle],
            [540, chevrons],
            [740, label]
        ),
        // Mulholland Drive. The exact same signal plays after the mic is cut.
        slowSequence("mulholland-drive",
            [740, "CLUB"],
            [960, "SILENCIO"],
            [1090, "NO HAY BANDA"],
            ...silencioPlayback,
            [740, "MIC OFF"],
            ...silencioPlayback,
            [500, "PLAYBACK"],
            [820, "BLUE BOX"],
            [480, "[==========]"],
            [630, "[==      ==]"],
            [460, ""],
            [610, label]
        ),
        // Eraserhead. Steam gives way to a spotlight inside the radiator.
        slowSequence("eraserhead",
            [1020, "THE RADIATOR"],
            [760, "[||||||||||]"],
            [480, "VALVE OPEN"],
            [1810, (p) => {
                const pressure = Math.floor(p * 9);
                const grille = glyphs.slice(2).map((_, index) => (index * 3 + pressure) % 7 < 2 ? ":" : "|");
                return "[" + grille.join("") + "]";
            }],
            [920, "HISSSSS..."],
            [560, ""],
            [1090, "[    *     ]"],
            [1120, "  THE LADY  "],
            [1190, (p) => type(label, p)],
            [650, label]
        ),
        // Blue Velvet. Look down through the neat grass of Lumberton.
        slowSequence("blue-velvet",
            [990, "LUMBERTON"],
            [850, "NICE LAWN."],
            [650, "||||||||||||"],
            [510, "LOOK CLOSER"],
            [1750, (p) => {
                const exposed = p * length / 2;
                return glyphs.map((_, index) => Math.abs(index - (length - 1) / 2) < exposed
                    ? "."
                    : "|").join("");
            }],
            [460, ".....::....."],
            [440, "..:..::..:.."],
            [730, "[    @     ]"],
            [1040, "FOUND: EAR"],
            [920, "LISTEN..."],
            [400, ""],
            [670, label]
        ),
        // Lost Highway. A tape shows a call from home and rewinds itself.
        slowSequence("lost-highway",
            [800, "UNMARKED VHS"],
            [600, "PLAY >"],
            [510, "TRACKING..."],
            [1440, (p) => "00:00:00:" + String(Math.floor(p * 24)).padStart(2, "0")],
            [640, "...:##%:...."],
            [960, "RING AT HOME"],
            [880, "NO CALLER ID"],
            [970, (p) => type("> CALL HOME", p)],
            [1030, "LINE IN USE"],
            [650, "REW <<"],
            [690, "00:00:00:00"],
            [530, "PLAY >"],
            [650, label]
        ),
        // DOS-era BIOS geometry. Zero ES:DI for old BIOSes before peeling the sector count out of CL.
        slowSequence("int-13h",
            [900, (p) => type("A:\\>CHS", p)],
            [620, "BITS 16"],
            [650, "xor dx,dx"],
            [650, "xor di,di"],
            [650, "mov es,di"],
            [760, "mov ax,0800h"],
            [500, "stc"],
            [900, "int 13h"],
            [660, "jc diskerr"],
            [450, "BIOS REPLY"],
            [1080, "CF=0 CX=4F12"],
            [620, "CL=ccssssss"],
            [910, "and cl,3Fh"],
            [880, "18 SECT/TRK"],
            [860, "80 CYL/2 HD"],
            [650, label]
        ),
        // HP 48 RPN. Multiply cylinders, heads, sectors per track, and bytes per sector.
        slowSequence("hp-48-rpn",
            [900, "HP 48 / RPN"],
            [470, "STACK CLEAR"],
            [850, "80 ENTER"],
            [660, stackLine(1, 80)],
            [750, "2 ENTER"],
            [660, stackLine(2, 80)],
            [660, stackLine(1, 2)],
            [480, "*"],
            [740, stackLine(1, 160)],
            [720, "18 *"],
            [740, stackLine(1, 2880)],
            [760, "512 *"],
            [1400, stackLine(1, 1474560)],
            [870, "RAW BYTES"],
            [650, label]
        ),
        // Saturn SASM. Increment the same two nibbles in hex and BCD modes.
        slowSequence("saturn-assembly",
            [920, "SATURN / ASM"],
            [460, "TWO NIBBLES"],
            [690, "P= 0"],
            [650, "SETHEX"],
            [770, "LCHEX 99"],
            [820, "C=C+1 B"],
            [1140, "C(B)=9A CY=0"],
            [760, "SETDEC"],
            [770, "LCHEX 99"],
            [820, "C=C+1 B"],
            [1270, "C(B)=00 CY=1"],
            [650, "SETHEX"],
            [590, "RTN"],
            [650, label]
        ),
        // 2001. Dave and HAL trade messages from the pod bay to the logic center.
        sequence("hal-9000",
            [850, "HAL 9000"],
            [820, "    (o)     "],
            [580, "DAVE >"],
            scrollLine("OPEN THE POD BAY DOORS, HAL.", 125),
            [580, "HAL  >"],
            scrollLine("I'M SORRY, DAVE. I'M AFRAID I CAN'T DO THAT.", 125),
            [580, "DAVE >"],
            [780, "WHAT'S THE"],
            [850, "PROBLEM?"],
            [580, "HAL  >"],
            [850, "THE MISSION"],
            [950, "COMES FIRST."],
            [790, "I READ"],
            [990, "YOUR LIPS."],
            [580, "DAVE >"],
            [880, "I'LL USE THE"],
            [1110, "AIRLOCK."],
            [580, "HAL  >"],
            [1070, "NO HELMET?"],
            [580, "DAVE >"],
            [1050, "OPEN THEM."],
            [580, "HAL  >"],
            [1210, "GOODBYE."],
            [740, "[NO CARRIER]"],
            [850, "LOGIC CENTER"],
            [1030, "STOP, DAVE."],
            [2390, (p) => {
                const removed = Math.floor(p * 7);
                return "MEM [" + "#".repeat(6 - removed) + ".".repeat(removed) + "]";
            }],
            [940, "D A I S Y"],
            [680, "D A I"],
            [880, "D"],
            [450, ""],
            [640, label]
        ),
        // The Shining. The Overlook's door gives way to a warning in the mirror.
        slowSequence("the-shining",
            [900, "THE OVERLOOK"],
            [1040, "ROOM 237"],
            [550, "HALL EMPTY"],
            [680, "[   ||||   ]"],
            [720, "[    ||    ]"],
            [740, "[          ]"],
            [1510, (p) => "   " + type("REDRUM", p)],
            [920, "   REDRUM   "],
            [940, "|  REDRUM  |"],
            [1520, "|  MURDER  |"],
            [490, ""],
            [620, label]
        ),
        // Dr. Strangelove. The recall goes out and one receiver stays silent.
        slowSequence("dr-strangelove",
            [910, "CRM-114"],
            [830, "RECALL / TX"],
            [740, "PREFIX ???"],
            [1120, (p) => type("PREFIX OPE", p)],
            [920, "TX [O][P][E]"],
            [530, "WAIT FOR ACK"],
            [2110, (p) => "RX [" + ".".repeat(Math.floor(p * 8)).padEnd(7, " ") + "]"],
            [1060, "NO REPLY"],
            [970, "01 STILL OUT"],
            [650, label]
        ),
        // Barry Lyndon. Candle flames expose the title through the Planar lens.
        slowSequence("barry-lyndon",
            [920, "BARRY LYNDON"],
            [910, "ZEISS 50MM"],
            [1060, "PLANAR f/0.7"],
            [490, "LIGHT METER"],
            [740, "  |  |  |   "],
            [480, "  i  |  |   "],
            [510, "  i  i  |   "],
            [910, "  i  i  i   "],
            [850, "ROLL CAMERA"],
            [1970, (p) => {
                const exposed = Math.floor(p * (length + 1));
                return glyphs.map((glyph, index) => (index * 5) % length < exposed ? glyph : ".").join("");
            }],
            [640, label]
        ),
        // Archon. Two sparks merge before the first line comes through.
        slowSequence("archon-power",
            [920, "ARCHON WARP"],
            [530, "2 TEMPLAR"],
            [600, "[ *      * ]"],
            [410, "[  *    *  ]"],
            [410, "[   *  *   ]"],
            [420, "[    **    ]"],
            [680, "[   ::#::  ]"],
            [880, "POWER"],
            [1400, "OVERWHELMING"],
            [1550, (p) => {
                const settled = Math.floor(p * (length + 1));
                return glyphs.map((glyph, index) => (index * 7) % length < settled ? glyph : "*").join("");
            }],
            [650, label]
        ),
        // Archon after repeated clicks. Leave a little quiet around the starfield.
        sequence("archon-poet",
            [1050, "ARCHON"],
            [840, "DEEP FIELD"],
            [1060, archonStars],
            [1490, "* .  :  .  *"],
            [2270, (p) => {
                const focused = Math.floor(p * (length + 1));
                return archonSky.slice(0, focused) + archonStars.slice(focused);
            }],
            [1490, "NO WORDS"],
            [990, ""],
            scrollLine("THEY SHOULD HAVE SENT A POET.", 170),
            [1580, archonStars],
            [2450, (p) => {
                const remaining = length - Math.floor(p * (length + 1));
                return archonStars.slice(0, remaining);
            }],
            [860, ""],
            [1700, (p) => type(label, p)],
            [650, label]
        ),
        // Battlecruiser. A bridge console checks its indicators and reports in.
        sequence("battlecruiser",
            [1150, "BRIDGE BOOT"],
            [980, "REACTOR IDLE"],
            [1300, "AUX POWER"],
            [830, "[..........]"],
            [2510, (p) => {
                const ready = Math.floor(p * (length - 1));
                return "[" + "#".repeat(ready) + ".".repeat(length - 2 - ready) + "]";
            }],
            [1290, "REACTOR ON"],
            [1000, "LINK TEST"],
            [1030, "PING..."],
            [990, "ACK RECEIVED"],
            [1100, "COMMS READY"],
            scrollLine("BATTLECRUISER OPERATIONAL."),
            [1060, "   [ OK ]   "],
            [1530, (p) => type("DOCK RELEASE", p)],
            [1020, "ALL SYSTEMS"],
            [1060, "ON STATION"],
            [720, label]
        ),
        // Artanis. The title has been clicked just often enough to annoy him.
        slowSequence("artanis",
            [900, "ARTANIS"],
            [470, "SELECTED"],
            [670, "CLICKS 08/08"],
            [480, "   [   ]    "],
            [420, "   [ . ]    "],
            [420, "   [ : ]    "],
            [660, "   [ ! ]    "],
            [1270, "STOP POKING"],
            [430, ""],
            [1280, "ME!"],
            [700, label]
        ),
        // Dragoon. The signal returns before the speaker does.
        slowSequence("dragoon",
            [870, "DRAGOON / RX"],
            [1080, "SIGNAL LOST"],
            [550, "TRYING RX"],
            [740, "[..........]"],
            [480, "[.....+....]"],
            [540, "[...::+::..]"],
            [640, "[== LINK ==]"],
            [960, "I HAVE"],
            [1490, "RETURNED."],
            [1140, (p) => type(label, p)],
            [650, label]
        ),
        // Medic. An ASCII pager beeps twice before anyone answers.
        slowSequence("medic",
            [900, "MEDIC / PAGE"],
            [480, "PAGE / 001"],
            [730, "[   PAGER  ]"],
            [500, "[   BEEP   ]"],
            [430, "[          ]"],
            [500, "[   BEEP   ]"],
            [610, "[          ]"],
            [1160, "DID SOMEONE"],
            [1350, "PAGE ME?"],
            [1020, (p) => type(label, p)],
            [650, label]
        ),
        // Overmind. The first words of the Zerg campaign emerge from a dark row.
        slowSequence("overmind",
            [950, "OVERMIND"],
            [550, "Z E R G"],
            [1100, ""],
            [880, "...::..::..."],
            [1260, "AWAKEN,"],
            [920, ""],
            [1430, "MY CHILD."],
            [730, "...::..::..."],
            [900, (p) => type(label, p)],
            [630, label]
        ),
        // Ghost. A voice comes through the receiver and disappears into static.
        sequence("ghost-exterminator",
            [900, "GHOST / RX"],
            [780, "[...::::...]"],
            [690, "CLOAK OFF"],
            scrollLine("SOMEBODY CALL FOR AN EXTERMINATOR?"),
            [1110, "I'M GONE."],
            [1580, (p) => {
                const phrase = "I'M GONE.";
                const visible = phrase.length - Math.floor(p * (phrase.length + 1));
                return phrase.slice(0, visible).padEnd(length, ".");
            }],
            [660, label]
        ),
        // Ghost after repeated clicks. The silence between the two lines matters.
        sequence("ghost-thunder",
            [900, "GHOST / TX"],
            [750, "OPEN CHANNEL"],
            scrollLine("YOU CALLED DOWN THE THUNDER...", 155),
            [830, "[....!!....]"],
            scrollLine("NOW REAP THE WHIRLWIND!", 155),
            [800, "CARRIER LOST"],
            [440, ""],
            [650, label]
        ),
        // Pinky and the Brain. Another night on the Acme Labs shift.
        sequence("pinky-and-the-brain",
            [900, "ACME LABS"],
            [820, "NIGHT SHIFT"],
            [930, "[  o    O  ]"],
            [670, "PINKY >"],
            scrollLine("GEE, BRAIN, WHAT DO YOU WANT TO DO TONIGHT?", 125),
            [670, "BRAIN >"],
            scrollLine("THE SAME THING WE DO EVERY NIGHT, PINKY.", 125),
            [650, ""],
            [1100, "TRY TO TAKE"],
            [940, "OVER THE"],
            [1470, "   WORLD!   "],
            [780, "PLAN FILED"],
            [650, label]
        ),
        // Brazil. A literal bug changes one letter on a Ministry form.
        sequence("brazil",
            [990, "MINISTRY"],
            [1400, (p) => type("FORM PRINT", p)],
            [1240, "NAME: TUTTLE"],
            [620, "*     TUTTLE"],
            [620, "  *   TUTTLE"],
            [620, "    * TUTTLE"],
            [860, "NAME: *UTTLE"],
            [1380, "NAME: BUTTLE"],
            [1010, "VERIFY FORM"],
            [1420, (p) => type("NAME: BUTTLE", p)],
            [1180, "FORM VALID"],
            [1290, "FORM FILED"],
            [920, "NEXT FORM..."],
            [1350, (p) => type(label, p)],
            [650, label]
        ),
        // Les Shadoks. Four words suffice once the counter carries in base four.
        sequence("les-shadoks",
            [1070, "LES SHADOKS"],
            [1460, shadokDigits.join(" ")],
            [980, "COMPTER..."],
            [3940, (p) => shadokDigits[Math.floor(p * shadokDigits.length)]],
            [1250, "MEU + BU ?"],
            [1170, "PLUS DE MOT"],
            [1060, "RETENUE"],
            [4910, (p) => {
                const value = 4 + Math.floor(p * 5);
                return Array.from(value.toString(4), (digit) => shadokDigits[Number(digit)]).join(" ");
            }],
            [1110, "BASE 4"],
            [1350, (p) => type(label, p)],
            [650, label]
        ),
        // Minitel. Dial the kiosk, enter the service code, and draw the sommaire.
        sequence("minitel",
            [1020, "MINITEL"],
            [1030, (p) => type("3615", p)],
            [1020, "CONNEXION"],
            [1500, (p) => "ATTENTE " + ".".repeat(Math.floor(p * 5))],
            [1030, "CODE SERVICE"],
            [1230, (p) => type("STEPHC", p)],
            [900, "ENVOI"],
            [1160, "3615 STEPHC"],
            [1200, "SOMMAIRE"],
            [1060, "01 BILLETS"],
            [1060, "02 A PROPOS"],
            [760, "[##..::..##]"],
            [2170, (p) => {
                const drawn = Math.floor(p * (length + 1));
                return glyphs.map((glyph, index) => index < drawn ? glyph : "#:."[index % 3]).join("");
            }],
            [650, label]
        ),
        // WarGames. Joshua tries the same game at three speeds and never finds a winner.
        sequence("wargames",
            [1020, "JOSHUA"],
            scrollLine("SHALL WE PLAY A GAME?", 115),
            [1060, "TIC-TAC-TOE"],
            ...ticTacToeFrames([0, 4, 8, 1, 7, 6, 2, 5, 3], 390),
            [720, "DRAW / 01"],
            ...ticTacToeFrames([4, 2, 0, 8, 1, 7, 6, 3, 5], 260),
            [720, "DRAW / 02"],
            ...ticTacToeFrames([4, 0, 8, 5, 2, 1, 7, 6, 3], 175),
            [720, "DRAW / 03"],
            [1250, "WINNER: NONE"],
            [720, ""],
            [1670, "STRANGE GAME"],
            [680, label]
        ),
        // Alien. Mother's display quietly changes its priorities.
        sequence("alien-mother",
            [1040, "NOSTROMO"],
            [1090, "MU/TH/UR"],
            [960, "WAKE CREW"],
            [1130, "CREW: 07"],
            [1390, "SIGNAL RX"],
            [980, "DISTRESS?"],
            [1410, (p) => type("> CREW INFO", p)],
            [1250, "ORDER 937"],
            [1040, "PRIORITY 1"],
            [1180, "SPECIMEN"],
            [1010, "CREW: 07"],
            [650, "CREW: 0-"],
            [1630, "CREW: --"],
            [740, ""],
            [660, label]
        ),
        // Apollo 11. Eagle reads out a program alarm and waits for Houston's go.
        sequence("apollo-11",
            [1080, "APOLLO 11"],
            [1050, "EAGLE / DSKY"],
            [1130, "DESCENT"],
            [1020, "PROG ALARM"],
            [1030, "VERB 05"],
            [1030, "NOUN 09"],
            [700, "ENTER"],
            [1480, "ALARM 1202"],
            [830, "EAGLE >"],
            [1220, "YOU COPY?"],
            [1650, ""],
            [860, "HOUSTON >"],
            [1570, "GO ON ALARM"],
            [1010, "DESCENT GO"],
            [1130, "CONTACT LT"],
            [1280, "EAGLE LANDED"],
            [670, label]
        ),
        // Amiga. Workbench hangs, the Guru appears, and the machine reboots.
        sequence("amiga-guru",
            [980, "AMIGA"],
            [1160, "KICKSTART"],
            [1120, "WORKBENCH"],
            [2170, (p) => progressBar(p * 0.78)],
            [1020, "LOAD STOPPED"],
            [690, ""],
            [1010, "GURU"],
            [1350, "MEDITATION"],
            [1130, "ERR B7000000"],
            [1130, "AT  00020000"],
            [1040, "LMB / RESET"],
            [1240, "REBOOT..."],
            [1660, (p) => type(label, p)],
            [650, label]
        ),
        // Monty Python. The shopkeeper's diagnosis fails the tap test.
        sequence("dead-parrot",
            [1000, "PET SHOP"],
            [900, "NORWEGIAN"],
            [900, "BLUE"],
            [700, "SHOP >"],
            [1300, "RESTING"],
            [740, "TEST >"],
            [940, "* TAP TAP *"],
            [1410, ""],
            [1320, "NO RESPONSE"],
            [720, "SHOP >"],
            [1160, "IT'S FINE."],
            [720, "TEST >"],
            [1570, "EX-PARROT!"],
            [940, "REFUND?"],
            [660, label]
        ),
        // Alien. Ripley restores Ash's signal long enough to ask about Order 937.
        sequence("alien-ash",
            [940, "ASH / RELINK"],
            [960, "NO RESPONSE"],
            [620, "[..........]"],
            [510, "[....:.....]"],
            [680, "[...:|:....]"],
            [790, "LINK UP"],
            [670, "RIPLEY >"],
            scrollLine("ASH, CAN YOU HEAR ME?", 130),
            [670, "ASH    >"],
            [900, "YES, I CAN"],
            [1060, "HEAR YOU."],
            [660, "RIPLEY >"],
            [840, "WHAT WAS"],
            [1060, "YOUR SPECIAL"],
            [930, "ORDER?"],
            [660, "ASH    >"],
            [1020, "ORDER 937"],
            [1010, "SPECIMEN"],
            [1200, "CREW: --"],
            [660, "RIPLEY >"],
            [930, "CAN WE STOP"],
            [730, "IT?"],
            [660, "ASH    >"],
            [1230, "YOU CAN'T."],
            [1060, "THE PERFECT"],
            [1320, "ORGANISM."],
            [760, ""],
            scrollLine("YOU HAVE MY SYMPATHIES.", 140),
            [590, "[...:|:....]"],
            [510, "[..........]"],
            [890, "SIGNAL LOST"],
            [660, label]
        ),
        // The talking cat's growls get subtitles on the title display.
        sequence("oh-long-johnson",
            [650, "  /\\_/\\"],
            [750, " ( o.o )"],
            [1100, "OH MY DOG"],
            [1300, "OH LONG JOHN"],
            scrollLine("OH LONG JOHNSON", 125),
            [1450, "OH DON PIANO"],
            scrollLine("WHY I EYES YA", 125),
            [650, label]
        ),
        // The classic LOLcat has a two-part request.
        sequence("i-can-has-cheezburger",
            [1250, "I CAN HAS"],
            [450, ""],
            [1700, "CHEEZBURGER?"],
            [650, label]
        ),
        // Longcat is too long to fit on the display.
        sequence("longcat",
            [1300, "LONGCAT IS"],
            scrollLine("LOOOOOOOOOOOOOOONG", 145),
            [650, label]
        ),
        // Keyboard Cat plays a short sign-off on five ASCII keys.
        sequence("keyboard-cat",
            [1200, "PLAY HIM OFF"],
            [1300, "KEYBOARD CAT"],
            [400, "[|.|.|.|.|.]"],
            [200, "[|*|.|.|.|.]"],
            [200, "[|.|*|.|.|.]"],
            [200, "[|.|.|*|.|.]"],
            [300, "[|.|.|.|*|.]"],
            [200, "[|.|.|*|.|.]"],
            [200, "[|.|*|.|.|.]"],
            [430, "[|*|.|.|.|*]"],
            [350, "[|.|.|.|.|.]"],
            [650, label]
        ),
        // The newspaper-reading cat arrives at a sudden decision.
        sequence("i-should-buy-a-boat",
            [1250, "I SHOULD"],
            [1500, "    ..."],
            [1650, "BUY A BOAT"],
            [650, label]
        )
    ];

    // References go in layer two unless listed here as longer scenes or deep cuts.
    const elaborateReferences = new Set([
        "amstrad-cpc-6128", "int-13h", "hp-48-rpn", "saturn-assembly", "minitel", "amiga-guru",
        "the-fog", "mulholland-drive", "eraserhead", "blue-velvet", "lost-highway", "hal-9000",
        "the-shining", "barry-lyndon", "brazil", "wargames", "alien-ash",
        "archon-power", "archon-poet", "battlecruiser", "artanis", "dragoon", "medic", "overmind",
        "ghost-exterminator", "ghost-thunder", "pinky-and-the-brain", "les-shadoks", "apollo-11"
    ]);
    const layers = [
        titleEffects,
        referenceEffects.filter(({ id }) => !elaborateReferences.has(id)),
        referenceEffects.filter(({ id }) => elaborateReferences.has(id))
    ];
    const effects = layers.flat();

    const seen = new Set();
    const seenKeyPrefix = "stephc:title-easter-egg:seen:";
    const completionKey = "stephc:title-easter-egg:completed";
    const collection = effects.map((effect) => effect.id).sort().join(",");
    const congratulations = sequence("congratulations",
        [1750, effects.length + "/" + effects.length],
        [1850, "Congrats!"],
        scrollLine("Now go back to work.", 160),
        [650, label]
    );

    let congratulationsSeen = false;
    let previousEffect;
    let playing = false;
    let clickCount = 0;
    let lastClick = -Infinity;
    let homeNavigation;

    function readProgress() {
        try {
            const storage = window.localStorage;
            for (const { id } of effects) {
                if (storage.getItem(seenKeyPrefix + id) === "1") seen.add(id);
            }
            congratulationsSeen ||= storage.getItem(completionKey) === collection;
        } catch {
            // The current page can still track progress when storage is unavailable.
        }
    }

    function saveProgress(key, value) {
        try {
            window.localStorage.setItem(key, value);
        } catch {
            // In-memory progress is available for the rest of this page visit.
        }
    }

    function activeLayerIndex() {
        return layers.findIndex((layer) => layer.some(({ id }) => !seen.has(id)));
    }

    function play() {
        playing = true;

        const original = [...link.childNodes];
        const accessibleLabel = link.getAttribute("aria-label");
        link.setAttribute("aria-label", accessibleLabel ?? label);

        const stage = document.createElement("span");
        stage.className = "blog-title-stage";
        const sizer = document.createElement("span");
        sizer.className = "blog-title-original";
        sizer.append(...original);
        const animation = document.createElement("span");
        animation.className = "blog-title-animation";
        animation.setAttribute("aria-hidden", "true");
        const cells = glyphs.map(() => document.createElement("span"));
        animation.append(...cells);
        stage.append(sizer, animation);
        link.replaceChildren(stage);

        function restore() {
            link.replaceChildren(...original);
            if (accessibleLabel === null) link.removeAttribute("aria-label");
            playing = false;
        }

        function paint(text) {
            const characters = Array.from(text);
            cells.forEach((cell, index) => {
                const glyph = characters[index] ?? " ";
                if (cell.textContent !== glyph) cell.textContent = glyph;
            });
        }

        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            paint("[hello!]");
            window.setTimeout(restore, 1200);
            return;
        }

        readProgress();
        const layerIndex = activeLayerIndex();
        const choices = layerIndex === -1
            ? effects.filter((effect) => effect !== previousEffect)
            : layers[layerIndex].filter(({ id }) => !seen.has(id));
        const effect = choices[Math.floor(Math.random() * choices.length)];
        previousEffect = effect;

        function animate(scene, onComplete) {
            let elapsed = 0;
            let previousTime;
            let lastPaint = -Infinity;

            function resetClock() {
                previousTime = undefined;
            }

            function frame(timestamp) {
                if (document.hidden) {
                    window.requestAnimationFrame(frame);
                    return;
                }

                elapsed += timestamp - (previousTime ?? timestamp);
                previousTime = timestamp;
                if (elapsed >= scene.duration) {
                    document.removeEventListener("visibilitychange", resetClock);
                    onComplete();
                    return;
                }

                if (elapsed - lastPaint >= 45) {
                    paint(scene.render(elapsed));
                    lastPaint = elapsed;
                }
                window.requestAnimationFrame(frame);
            }

            document.addEventListener("visibilitychange", resetClock);
            paint(scene.render(0));
            window.requestAnimationFrame(frame);
        }

        animate(effect, () => {
            if (!seen.has(effect.id)) {
                seen.add(effect.id);
                saveProgress(seenKeyPrefix + effect.id, "1");
            }

            readProgress();
            const nextLayerIndex = activeLayerIndex();
            if (nextLayerIndex === -1 && !congratulationsSeen) {
                animate(congratulations, () => {
                    congratulationsSeen = true;
                    saveProgress(completionKey, collection);
                    restore();
                });
                return;
            }

            if (nextLayerIndex > layerIndex) {
                const total = layers[layerIndex].length;
                animate(sequence("layer-unlocked",
                    [1000, "L" + (layerIndex + 1) + " " + total + "/" + total],
                    [1250, "LAYER " + (nextLayerIndex + 1) + " OPEN"]
                ), restore);
                return;
            }

            restore();
        });
    }

    link.classList.add("blog-title-easter-egg");
    link.addEventListener("click", (event) => {
        if (event.defaultPrevented || event.button !== 0 || event.detail === 0 ||
            event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;

        const current = new URL(window.location.href);
        if (current.origin !== home.origin) return;
        const atHome = (!current.hash || current.hash === "#top") &&
            (current.pathname === home.pathname ||
                (home.pathname.endsWith("/index.html") && current.pathname === directory.pathname));
        const now = performance.now();
        const inBurst = now - lastClick <= 1000;
        if (playing && !atHome && !inBurst) return;

        event.preventDefault();
        if (atHome && (window.scrollX || window.scrollY)) window.scrollTo(0, 0);
        lastClick = now;
        if (playing) return;

        clickCount = inBurst ? clickCount + 1 : 1;
        window.clearTimeout(homeNavigation);
        if (clickCount >= 3) {
            clickCount = 0;
            play();
        } else if (!atHome) {
            // A short delay gives a second tap a chance to start the Easter egg gesture.
            homeNavigation = window.setTimeout(() => {
                clickCount = 0;
                window.location.assign(home.href);
            }, clickCount === 1 ? 350 : 1000);
        }
    });
})();
