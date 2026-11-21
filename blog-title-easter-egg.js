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

    function sequence(...steps) {
        return {
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
    const silencioPlayback = [
        [280, ">..:||:....."],
        [320, ">.:|!!|:...."],
        [340, ">..:||||:..."],
        [280, ">...:||:...."],
        [300, ">.....:|:..."]
    ];

    const effects = [
        // Cold boot with a memory count before the host name is printed.
        sequence(
            [300, "RESET 0000"],
            [350, "ROM 064K OK"],
            [900, (p) => "RAM " + String(Math.floor(p * 64)).padStart(2, "0") + "K"],
            [300, "MOUNT /"],
            [350, "SYSTEM READY"],
            [700, (p) => type(label, p)],
            [320, label]
        ),
        // A shell prompt types the command and prints its result.
        sequence(
            [360, "$ _"],
            [870, (p) => type("$ hostname", p)],
            [440, "$ hostname"],
            [700, (p) => type(hostname, p)],
            [520, hostname],
            [420, label]
        ),
        // Dial-up chatter turns into a decoded bit stream.
        sequence(
            [270, "ATZ"],
            [270, "OK"],
            [780, (p) => type("ATDT 5550100", p)],
            [400, "CONNECT 56K"],
            [1120, (p) => {
                const step = Math.floor(p * 18);
                const decoded = Math.floor(p * (length + 1));
                return glyphs.map((glyph, i) => i >= length - decoded ? glyph : tape[(step + i) % tape.length]).join("");
            }],
            [350, label]
        ),
        // A byte dump walks through the actual characters of the title.
        sequence(
            [350, "DUMP HOST"],
            [1550, (p) => {
                const offset = 2 * Math.floor(p * Math.ceil(length / 2));
                return offset.toString(16).toUpperCase().padStart(4, "0") + ": " + hexBytes.slice(offset, offset + 2).join(" ");
            }],
            [350, "ASCII OUT"],
            [730, (p) => type(label, p)],
            [320, label]
        ),
        // A damaged frame fails its checksum and gets repaired in place.
        sequence(
            [350, "RECV FRAME"],
            [430, repair(0)],
            [460, "CRC ERROR"],
            [350, "FIX 3 BYTES"],
            [1160, repair],
            [380, "CRC OK"],
            [420, label]
        ),
        // A 32-bit register counts down to zero and releases the host name.
        sequence(
            [300, "REG32 ARM"],
            [1650, (p) => "0x" + Math.floor((1 - p) ** 2 * 0xffffffff).toString(16).toUpperCase().padStart(8, "0")],
            [400, "0x00000000"],
            [800, (p) => {
                const done = Math.floor(p * Math.ceil(length / 2));
                return glyphs.map((glyph, i) => Math.min(i, length - 1 - i) < done ? glyph : "0").join("");
            }],
            [350, label]
        ),
        // Each cipher rotor stops independently on its decoded character.
        sequence(
            [390, "KEY LOAD"],
            [1740, (p) => {
                const step = Math.floor(p * 22);
                const locked = Math.floor(p * (length + 1));
                return glyphs.map((glyph, i) => i === 0 || i === length - 1 || (i * 7) % length < locked
                    ? glyph
                    : rotor[(i * 11 + step * (i % 3 + 1)) % rotor.length]).join("");
            }],
            [350, "KEY OK"],
            [400, label]
        ),
        // The scan writes marks on the outward pass and letters on the return.
        sequence(
            [320, "SCAN START"],
            [980, (p) => {
                const head = Math.floor(p * length);
                return glyphs.map((_, i) => i < head ? "=" : i === head ? ">" : ".").join("");
            }],
            [270, "=".repeat(length)],
            [1080, (p) => {
                const head = length - 1 - Math.floor(p * length);
                return glyphs.map((glyph, i) => i > head ? glyph : i === head ? "<" : "=").join("");
            }],
            [340, label]
        ),
        // A progress bar pauses for verification before opening the title.
        sequence(
            [330, "LOAD /HOST"],
            [1350, progressBar],
            [360, progressBar(1)],
            [420, "VERIFY..."],
            [350, "OPEN OK"],
            [630, (p) => type(label, p)]
        ),
        // Two packets fill alternating cells before the frame is complete.
        sequence(
            [320, "RX 1/2"],
            [860, (p) => assemble(0, p)],
            [350, assemble(0, 1)],
            [320, "RX 2/2"],
            [860, (p) => assemble(1, p)],
            [330, "FRAME OK"],
            [370, label]
        ),
        // Morse symbols fill successive rows, then the receiver prints the result.
        sequence(
            [360, "MORSE TX"],
            [1700, (p) => {
                const sent = Math.floor(p * (signal.length + 1));
                const row = sent - sent % length;
                return signal.slice(row, sent) + "_";
            }],
            [400, "RX COMPLETE"],
            [840, (p) => type(hostname, p)],
            [380, label]
        ),
        // A paper tape moves beneath a fixed read head.
        sequence(
            [350, "INSERT TAPE"],
            [350, "REEL 01"],
            [1480, (p) => {
                const offset = Math.floor(p * tape.length);
                const readHead = Math.floor(length / 2);
                return glyphs.map((_, i) => i === readHead ? "|" : tape[(offset + i) % tape.length] === "1" ? "o" : ".").join("");
            }],
            [390, "END OF TAPE"],
            [850, (p) => {
                const count = Math.floor(p * (length + 1));
                return label.slice(length - count).padStart(length, " ");
            }],
            [320, label]
        ),
        // A miniature text adventure ends at a sign bearing the title.
        sequence(
            [540, "DARK ROOM"],
            [760, (p) => type("> LOOK", p)],
            [750, "A KEY / DOOR"],
            [760, (p) => type("> TAKE KEY", p)],
            [430, "KEY TAKEN"],
            [850, (p) => type("> UNLOCK", p)],
            [590, "* CLICK *"],
            [770, (p) => type("> GO NORTH", p)],
            [660, "A SIGN READS"],
            [1240, (p) => type(label, p)],
            [680, label]
        ),
        // A cellular automaton runs at two speeds before its final row is printed over.
        sequence(
            [590, "RULE 30"],
            [560, "SEED 0001"],
            [1820, (p) => generations[Math.floor(p * 9)]],
            [480, "CLOCK x3"],
            [2260, (p) => generations[9 + Math.floor(p * (generations.length - 9))]],
            [450, "HALT"],
            [1350, (p) => {
                const written = Math.floor(p * (length + 1));
                return label.slice(0, written) + generations[generations.length - 1].slice(written);
            }],
            [620, label]
        ),
        // Altitude and descent rate update as a lander fires its engines.
        sequence(
            [650, "LANDER RX"],
            [560, "DESCENT AUTO"],
            [1950, (p) => telemetry(120 - 62 * p, 28 + 6 * p)],
            [650, "RETROBURN"],
            [2250, (p) => telemetry(58 * (1 - p) ** 2, 34 * (1 - p))],
            [510, "TOUCHDOWN"],
            [610, "BASE BEACON"],
            [1110, (p) => type(label, p)],
            [650, label]
        ),
        // A spectrum display picks out two peaks in a noisy signal.
        sequence(
            [600, "SPECTRUM RX"],
            [1280, (p) => spectrum(0, Math.floor(p * 11))],
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
        sequence(
            [510, "READY."],
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
        sequence(
            [750, "TEST ROOM 08"],
            [800, "REWARD: CAKE"],
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
        sequence(
            [700, "GUM: ZERO"],
            [700, "BOOTS: TWO"],
            [800, "DOOR LOCKED"],
            [1050, (p) => type("> TRY KNOB", p)],
            [680, "NOPE."],
            [1050, (p) => type("> APPLY BOOT", p)],
            [420, "[====||====]"],
            [300, "[===/  \\===]"],
            [800, "[__/    \\__]"],
            [1220, "I KNOCKED."],
            [620, label]
        ),
        // A cartoon sign-off with a one-row ASCII iris close.
        sequence(
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
            [420, ""],
            [650, label]
        ),
        // The CPC boots into Locomotive BASIC and runs a program from Drive A:.
        sequence(
            [700, "CPC 6128"],
            [680, "Amstrad 128K"],
            [760, "BASIC 1.1"],
            [680, "Ready"],
            [790, (p) => type("mode 2", p)],
            [680, (p) => type("cat", p)],
            [470, "Drive A:"],
            [820, "HOST.BAS  1K"],
            [1230, (p) => type('run "host"', p)],
            [420, ""],
            [1000, (p) => type(label, p)],
            [700, label]
        ),
        // An original one-row warehouse puzzle. @ pushes $ onto the marked goal.
        sequence(
            [680, "PUSH / 01"],
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
        sequence(
            [1000, "DON'T PANIC!"],
            [940, "DEEP THOUGHT"],
            [2350, (p) => (p * 7.5).toFixed(1) + "M YEARS"],
            [550, "7.5M YEARS"],
            [720, "THE ANSWER"],
            [1140, "     42     "],
            [920, "QUESTION?"],
            [740, "ASK EARTH"],
            [680, label]
        ),
        // Vim refuses to quit until the buffer containing the hostname is saved.
        sequence(
            [1000, (p) => type("$ vim notes", p)],
            [690, "-- INSERT --"],
            [1200, (p) => type(hostname, p)],
            [380, "[Esc]"],
            [680, (p) => type(":q", p)],
            [1050, "E37: CHANGES"],
            [880, (p) => type(":help quit", p)],
            [630, "SAVE & QUIT"],
            [710, (p) => type(":wq", p)],
            [600, '"notes" 1L'],
            [700, label]
        ),
        // They Live. The sunglasses decode a billboard one cell at a time.
        sequence(
            [1050, billboard],
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
        sequence(
            [850, "OUTPOST 31"],
            [750, "SAMPLE 01"],
            [1000, "[    .     ]"],
            [580, "NO REACTION"],
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
        sequence(
            [920, "NYC / 1997"],
            [760, "GLIDER IN"],
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
        sequence(
            [860, "HADDONFIELD"],
            [850, "OCT 31"],
            [730, "11:59 PM"],
            [900, "[    ||    ]"],
            [780, "[    ..    ]"],
            [1120, "[    /o\\   ]"],
            [1050, ""],
            [1200, "[    /o\\   ]"],
            [850, "STILL THERE"],
            [680, label]
        ),
        // The Fog. A lighthouse broadcast disappears beneath a bank of tildes.
        sequence(
            [790, "ANTONIO BAY"],
            [890, "LIGHTHOUSE"],
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
        sequence(
            [960, "THE RED ROOM"],
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
        sequence(
            [740, "CLUB"],
            [960, "SILENCIO"],
            [1090, "NO HAY BANDA"],
            ...silencioPlayback,
            [740, "MIC OFF"],
            ...silencioPlayback,
            [820, "BLUE BOX"],
            [480, "[==========]"],
            [630, "[==      ==]"],
            [460, ""],
            [610, label]
        ),
        // Eraserhead. Steam gives way to a spotlight inside the radiator.
        sequence(
            [1020, "THE RADIATOR"],
            [760, "[||||||||||]"],
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
        sequence(
            [990, "LUMBERTON"],
            [850, "NICE LAWN."],
            [650, "||||||||||||"],
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
        sequence(
            [800, "UNMARKED VHS"],
            [600, "PLAY >"],
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
        sequence(
            [900, (p) => type("A:\\>CHS", p)],
            [620, "BITS 16"],
            [650, "xor dx,dx"],
            [650, "xor di,di"],
            [650, "mov es,di"],
            [760, "mov ax,0800h"],
            [500, "stc"],
            [900, "int 13h"],
            [660, "jc diskerr"],
            [1080, "CF=0 CX=4F12"],
            [620, "CL=ccssssss"],
            [910, "and cl,3Fh"],
            [880, "18 SECT/TRK"],
            [860, "80 CYL/2 HD"],
            [650, label]
        ),
        // HP 48 RPN. Multiply cylinders, heads, sectors per track, and bytes per sector.
        sequence(
            [900, "HP 48 / RPN"],
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
        sequence(
            [920, "SATURN / ASM"],
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
        // 2001. HAL's eye, a refused request, and six memory blocks pulled in turn.
        sequence(
            [850, "HAL 9000"],
            [820, "    (o)     "],
            [1060, (p) => type("> OPEN BAY", p)],
            [1130, "DENIED, DAVE"],
            [850, "LOGIC CENTER"],
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
        sequence(
            [900, "THE OVERLOOK"],
            [1040, "ROOM 237"],
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
        sequence(
            [910, "CRM-114"],
            [830, "RECALL / TX"],
            [740, "PREFIX ???"],
            [1120, (p) => type("PREFIX OPE", p)],
            [920, "TX [O][P][E]"],
            [2110, (p) => "RX [" + ".".repeat(Math.floor(p * 8)).padEnd(7, " ") + "]"],
            [1060, "NO REPLY"],
            [970, "01 STILL OUT"],
            [650, label]
        ),
        // Barry Lyndon. Candle flames expose the title through the Planar lens.
        sequence(
            [920, "BARRY LYNDON"],
            [910, "ZEISS 50MM"],
            [1060, "PLANAR f/0.7"],
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
        sequence(
            [920, "ARCHON WARP"],
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
        sequence(
            [850, "ARCHON"],
            [900, ".  *  .    ."],
            [820, "+  .  *   . "],
            scrollLine("THEY SHOULD HAVE SENT A POET.", 170),
            [900, ".  *  .    ."],
            [460, ""],
            [640, label]
        ),
        // Battlecruiser. A bridge console checks its indicators and reports in.
        sequence(
            [880, "BRIDGE BOOT"],
            [690, "[..........]"],
            [1520, (p) => {
                const ready = Math.floor(p * (length - 1));
                return "[" + "#".repeat(ready) + ".".repeat(length - 2 - ready) + "]";
            }],
            [640, "COMMS READY"],
            scrollLine("BATTLECRUISER OPERATIONAL."),
            [890, "   [ OK ]   "],
            [650, label]
        ),
        // Artanis. The title has been clicked just often enough to annoy him.
        sequence(
            [900, "ARTANIS"],
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
        sequence(
            [870, "DRAGOON / RX"],
            [1080, "SIGNAL LOST"],
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
        sequence(
            [900, "MEDIC / PAGE"],
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
        sequence(
            [950, "OVERMIND"],
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
        sequence(
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
        sequence(
            [900, "GHOST / TX"],
            [750, "OPEN CHANNEL"],
            scrollLine("YOU CALLED DOWN THE THUNDER...", 155),
            [830, "[....!!....]"],
            scrollLine("NOW REAP THE WHIRLWIND!", 155),
            [800, "CARRIER LOST"],
            [440, ""],
            [650, label]
        )
    ];

    let previousEffect;
    let playing = false;
    let clickCount = 0;
    let lastClick = -Infinity;

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

        const choices = effects.filter((effect) => effect !== previousEffect);
        const effect = choices[Math.floor(Math.random() * choices.length)];
        previousEffect = effect;

        let start;
        let lastPaint = -Infinity;

        function frame(timestamp) {
            start ??= timestamp;
            const elapsed = timestamp - start;
            if (elapsed >= effect.duration) {
                restore();
                return;
            }

            if (timestamp - lastPaint >= 45) {
                paint(effect.render(elapsed));
                lastPaint = timestamp;
            }
            window.requestAnimationFrame(frame);
        }

        paint(effect.render(0));
        window.requestAnimationFrame(frame);
    }

    link.classList.add("blog-title-easter-egg");
    link.addEventListener("click", (event) => {
        if (event.defaultPrevented || event.button !== 0 || event.detail === 0 ||
            event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;

        const current = new URL(window.location.href);
        const atHome = current.pathname === home.pathname ||
            (home.pathname.endsWith("/index.html") && current.pathname === directory.pathname);
        if (!atHome || current.origin !== home.origin || (current.hash && current.hash !== "#top")) return;

        event.preventDefault();
        if (window.scrollX || window.scrollY) window.scrollTo(0, 0);
        if (playing) return;

        const now = performance.now();
        clickCount = now - lastClick <= 1000 ? clickCount + 1 : 1;
        lastClick = now;
        if (clickCount >= 8) {
            clickCount = 0;
            play();
        }
    });
})();
