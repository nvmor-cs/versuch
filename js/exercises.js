// Lumora – Übungsbibliothek
// Jede Übung: id, name, muscle (Muskelgruppe), equipment (Gerät), type, alias (Suchbegriffe)
// Typen: "weight_reps" (Gewicht × Wdh.), "reps" (nur Wdh.), "time" (Dauer)

"use strict";

const MUSCLES = [
  "Brust", "Rücken", "Schultern", "Nacken", "Bizeps", "Trizeps",
  "Beine", "Po", "Waden", "Bauch", "Unterarme", "Ganzkörper", "Cardio",
];

const EQUIPMENT = [
  "Langhantel", "Kurzhantel", "SZ-Stange", "Kettlebell", "Kabelzug",
  "Maschine", "Smith-Maschine", "Körpergewicht", "Cardiogerät", "Sonstiges",
];

const EXERCISE_TYPES = {
  weight_reps: { label: "Gewicht × Wdh." },
  reps:        { label: "Wiederholungen" },
  time:        { label: "Zeit" },
};

function x(id, name, muscle, equipment, type, alias) {
  return { id, name, muscle, equipment, type: type || "weight_reps", alias: alias || "" };
}

const EXERCISE_LIBRARY = [
  // ── Brust ──────────────────────────────────────────────
  x("bankdruecken-lh", "Bankdrücken (Langhantel)", "Brust", "Langhantel", null, "bench press flachbank"),
  x("schraegbank-lh", "Schrägbankdrücken (Langhantel)", "Brust", "Langhantel", null, "incline bench press"),
  x("negativbank-lh", "Negativbankdrücken (Langhantel)", "Brust", "Langhantel", null, "decline bench press"),
  x("bankdruecken-kh", "Bankdrücken (Kurzhanteln)", "Brust", "Kurzhantel", null, "dumbbell bench press"),
  x("schraegbank-kh", "Schrägbankdrücken (Kurzhanteln)", "Brust", "Kurzhantel", null, "incline dumbbell press"),
  x("bankdruecken-smith", "Bankdrücken (Smith-Maschine)", "Brust", "Smith-Maschine", null, "smith bench press"),
  x("fliegende-kh", "Fliegende (Kurzhanteln)", "Brust", "Kurzhantel", null, "dumbbell flys flies"),
  x("fliegende-schraeg", "Fliegende Schrägbank (Kurzhanteln)", "Brust", "Kurzhantel", null, "incline flys"),
  x("butterfly", "Butterfly (Maschine)", "Brust", "Maschine", null, "pec deck fly"),
  x("cable-fly", "Fliegende am Kabelzug (Cable Fly)", "Brust", "Kabelzug", null, "crossover kabelzug über kreuz"),
  x("brustpresse", "Brustpresse (Maschine)", "Brust", "Maschine", null, "chest press"),
  x("liegestuetze", "Liegestütze", "Brust", "Körpergewicht", "reps", "push ups pushups"),
  x("liegestuetze-erhoeht", "Liegestütze (Füße erhöht)", "Brust", "Körpergewicht", "reps", "decline push ups"),
  x("dips", "Dips", "Brust", "Körpergewicht", "reps", "barren"),
  x("dips-gewicht", "Dips (Zusatzgewicht)", "Brust", "Körpergewicht", null, "weighted dips"),
  x("ueberzuege-kh", "Überzüge (Kurzhantel)", "Brust", "Kurzhantel", null, "pullover"),

  // ── Rücken ─────────────────────────────────────────────
  x("klimmzuege", "Klimmzüge", "Rücken", "Körpergewicht", "reps", "pull ups pullups"),
  x("klimmzuege-untergriff", "Klimmzüge (Untergriff)", "Rücken", "Körpergewicht", "reps", "chin ups chinups"),
  x("klimmzuege-gewicht", "Klimmzüge (Zusatzgewicht)", "Rücken", "Körpergewicht", null, "weighted pull ups"),
  x("latzug-breit", "Latzug (breiter Griff)", "Rücken", "Kabelzug", null, "lat pulldown latziehen"),
  x("latzug-eng", "Latzug (enger Griff)", "Rücken", "Kabelzug", null, "close grip pulldown"),
  x("rudern-lh", "Langhantelrudern", "Rücken", "Langhantel", null, "barbell row bent over"),
  x("rudern-kh", "Kurzhantelrudern (einarmig)", "Rücken", "Kurzhantel", null, "dumbbell row"),
  x("rudern-kabel", "Rudern am Kabelzug (sitzend)", "Rücken", "Kabelzug", null, "seated cable row"),
  x("rudern-tbar", "T-Bar Rudern", "Rücken", "Langhantel", null, "t bar row"),
  x("rudern-maschine", "Rudern (Maschine)", "Rücken", "Maschine", null, "machine row"),
  x("kreuzheben", "Kreuzheben", "Rücken", "Langhantel", null, "deadlift"),
  x("rack-pulls", "Rack Pulls", "Rücken", "Langhantel", null, "teilkreuzheben"),
  x("hyperextensions", "Hyperextensions (Rückenstrecker)", "Rücken", "Körpergewicht", null, "back extension"),
  x("straight-arm-pulldown", "Überzüge am Kabelzug", "Rücken", "Kabelzug", null, "straight arm pulldown"),
  x("good-mornings", "Good Mornings", "Rücken", "Langhantel", null, ""),
  x("muscle-ups", "Muscle-Ups", "Rücken", "Körpergewicht", "reps", ""),

  // ── Nacken ─────────────────────────────────────────────
  x("shrugs-lh", "Schulterheben (Langhantel)", "Nacken", "Langhantel", null, "shrugs trapez"),
  x("shrugs-kh", "Schulterheben (Kurzhanteln)", "Nacken", "Kurzhantel", null, "dumbbell shrugs trapez"),

  // ── Schultern ──────────────────────────────────────────
  x("schulterdruecken-lh", "Schulterdrücken (Langhantel)", "Schultern", "Langhantel", null, "overhead press military ohp"),
  x("schulterdruecken-kh", "Schulterdrücken (Kurzhanteln)", "Schultern", "Kurzhantel", null, "dumbbell shoulder press"),
  x("schulterdruecken-maschine", "Schulterdrücken (Maschine)", "Schultern", "Maschine", null, "machine shoulder press"),
  x("arnold-press", "Arnold Press", "Schultern", "Kurzhantel", null, ""),
  x("push-press", "Push Press", "Schultern", "Langhantel", null, ""),
  x("seitheben-kh", "Seitheben (Kurzhanteln)", "Schultern", "Kurzhantel", null, "lateral raise side raise"),
  x("seitheben-kabel", "Seitheben (Kabelzug)", "Schultern", "Kabelzug", null, "cable lateral raise"),
  x("seitheben-maschine", "Seitheben (Maschine)", "Schultern", "Maschine", null, "machine lateral raise"),
  x("frontheben", "Frontheben (Kurzhanteln)", "Schultern", "Kurzhantel", null, "front raise"),
  x("reverse-flys", "Vorgebeugtes Seitheben (Reverse Flys)", "Schultern", "Kurzhantel", null, "rear delt bent over"),
  x("reverse-butterfly", "Reverse Butterfly (Maschine)", "Schultern", "Maschine", null, "reverse pec deck rear delt"),
  x("face-pulls", "Face Pulls (Kabelzug)", "Schultern", "Kabelzug", null, ""),
  x("aufrechtes-rudern", "Aufrechtes Rudern (Langhantel)", "Schultern", "Langhantel", null, "upright row"),

  // ── Bizeps ─────────────────────────────────────────────
  x("curls-lh", "Bizepscurls (Langhantel)", "Bizeps", "Langhantel", null, "barbell curls"),
  x("curls-sz", "Bizepscurls (SZ-Stange)", "Bizeps", "SZ-Stange", null, "ez bar curls"),
  x("curls-kh", "Bizepscurls (Kurzhanteln)", "Bizeps", "Kurzhantel", null, "dumbbell curls"),
  x("hammer-curls", "Hammercurls (Kurzhanteln)", "Bizeps", "Kurzhantel", null, ""),
  x("schraegbank-curls", "Schrägbankcurls (Kurzhanteln)", "Bizeps", "Kurzhantel", null, "incline curls"),
  x("konzentrations-curls", "Konzentrationscurls", "Bizeps", "Kurzhantel", null, "concentration curls"),
  x("scott-curls", "Scott-Curls (SZ-Stange)", "Bizeps", "SZ-Stange", null, "preacher curls"),
  x("curls-kabel", "Bizepscurls (Kabelzug)", "Bizeps", "Kabelzug", null, "cable curls"),
  x("curls-maschine", "Bizepscurls (Maschine)", "Bizeps", "Maschine", null, "machine curls"),

  // ── Trizeps ────────────────────────────────────────────
  x("trizepsdruecken-kabel", "Trizepsdrücken (Kabelzug)", "Trizeps", "Kabelzug", null, "pushdown triceps"),
  x("trizeps-seil", "Trizepsdrücken mit Seil (Kabelzug)", "Trizeps", "Kabelzug", null, "rope pushdown"),
  x("overhead-trizeps-kabel", "Trizepsdrücken über Kopf (Kabelzug)", "Trizeps", "Kabelzug", null, "overhead extension"),
  x("french-press", "French Press (SZ-Stange)", "Trizeps", "SZ-Stange", null, "skull crusher stirndrücken"),
  x("stirndruecken-kh", "Stirndrücken (Kurzhanteln)", "Trizeps", "Kurzhantel", null, "skull crusher"),
  x("enges-bankdruecken", "Enges Bankdrücken (Langhantel)", "Trizeps", "Langhantel", null, "close grip bench press"),
  x("bench-dips", "Dips an der Bank", "Trizeps", "Körpergewicht", "reps", "bench dips"),
  x("kickbacks", "Kickbacks (Kurzhantel)", "Trizeps", "Kurzhantel", null, "triceps kickback"),
  x("overhead-trizeps-kh", "Trizepsdrücken über Kopf (Kurzhantel)", "Trizeps", "Kurzhantel", null, "overhead extension"),
  x("trizeps-maschine", "Trizeps-Maschine (Dip-Maschine)", "Trizeps", "Maschine", null, "machine dips"),

  // ── Beine ──────────────────────────────────────────────
  x("kniebeugen", "Kniebeugen (Langhantel)", "Beine", "Langhantel", null, "squat squats"),
  x("frontkniebeugen", "Frontkniebeugen (Langhantel)", "Beine", "Langhantel", null, "front squat"),
  x("kniebeugen-smith", "Kniebeugen (Smith-Maschine)", "Beine", "Smith-Maschine", null, "smith squat"),
  x("goblet-squats", "Goblet Squats", "Beine", "Kettlebell", null, ""),
  x("beinpresse", "Beinpresse", "Beine", "Maschine", null, "leg press"),
  x("hackenschmidt", "Hackenschmidt-Kniebeuge (Maschine)", "Beine", "Maschine", null, "hack squat"),
  x("ausfallschritte", "Ausfallschritte (Kurzhanteln)", "Beine", "Kurzhantel", null, "lunges"),
  x("walking-lunges", "Walking Lunges", "Beine", "Kurzhantel", null, "gehende ausfallschritte"),
  x("bulgarian-split-squats", "Bulgarische Kniebeugen (Split Squats)", "Beine", "Kurzhantel", null, "bulgarian split squat"),
  x("beinstrecker", "Beinstrecker (Maschine)", "Beine", "Maschine", null, "leg extension"),
  x("beinbeuger-liegend", "Beinbeuger liegend (Maschine)", "Beine", "Maschine", null, "leg curl lying"),
  x("beinbeuger-sitzend", "Beinbeuger sitzend (Maschine)", "Beine", "Maschine", null, "seated leg curl"),
  x("rdl", "Rumänisches Kreuzheben (Langhantel)", "Beine", "Langhantel", null, "rdl romanian deadlift"),
  x("rdl-kh", "Rumänisches Kreuzheben (Kurzhanteln)", "Beine", "Kurzhantel", null, "dumbbell rdl"),
  x("sumo-kreuzheben", "Sumo-Kreuzheben", "Beine", "Langhantel", null, "sumo deadlift"),
  x("step-ups", "Step-Ups (Kurzhanteln)", "Beine", "Kurzhantel", null, ""),
  x("nordic-curls", "Nordic Hamstring Curls", "Beine", "Körpergewicht", "reps", ""),
  x("adduktoren", "Adduktoren-Maschine", "Beine", "Maschine", null, "adductor innenschenkel"),
  x("abduktoren", "Abduktoren-Maschine", "Beine", "Maschine", null, "abductor außenschenkel"),
  x("pistol-squats", "Pistol Squats", "Beine", "Körpergewicht", "reps", "einbeinige kniebeuge"),
  x("wandsitz", "Wandsitzen", "Beine", "Körpergewicht", "time", "wall sit"),

  // ── Po ─────────────────────────────────────────────────
  x("hip-thrusts", "Hip Thrusts (Langhantel)", "Po", "Langhantel", null, "hüftstoßen glutes"),
  x("hip-thrust-maschine", "Hip Thrust (Maschine)", "Po", "Maschine", null, "glutes"),
  x("glute-bridge", "Glute Bridge", "Po", "Körpergewicht", null, "beckenheben"),
  x("kickbacks-kabel", "Kickbacks am Kabelzug (Po)", "Po", "Kabelzug", null, "glute kickback"),

  // ── Waden ──────────────────────────────────────────────
  x("wadenheben-stehend", "Wadenheben stehend", "Waden", "Maschine", null, "calf raise standing"),
  x("wadenheben-sitzend", "Wadenheben sitzend (Maschine)", "Waden", "Maschine", null, "seated calf raise"),
  x("wadenheben-beinpresse", "Wadenheben an der Beinpresse", "Waden", "Maschine", null, "calf press"),

  // ── Bauch ──────────────────────────────────────────────
  x("crunches", "Crunches", "Bauch", "Körpergewicht", "reps", "bauchpressen"),
  x("situps", "Sit-Ups", "Bauch", "Körpergewicht", "reps", ""),
  x("beinheben-haengend", "Beinheben hängend", "Bauch", "Körpergewicht", "reps", "hanging leg raise"),
  x("beinheben-liegend", "Beinheben liegend", "Bauch", "Körpergewicht", "reps", "leg raise lying"),
  x("knieheben-dip", "Knieheben am Dip-Barren", "Bauch", "Körpergewicht", "reps", "knee raise captains chair"),
  x("plank", "Unterarmstütz (Plank)", "Bauch", "Körpergewicht", "time", "planke"),
  x("seitstuetz", "Seitstütz (Side Plank)", "Bauch", "Körpergewicht", "time", ""),
  x("russian-twists", "Russian Twists", "Bauch", "Körpergewicht", "reps", ""),
  x("cable-crunches", "Crunches am Kabelzug", "Bauch", "Kabelzug", null, "cable crunch"),
  x("bauchmaschine", "Bauchmaschine (Crunch-Maschine)", "Bauch", "Maschine", null, "ab machine"),
  x("ab-roller", "Ab-Roller (Bauchroller)", "Bauch", "Sonstiges", "reps", "ab wheel rollout"),
  x("mountain-climbers", "Mountain Climbers", "Bauch", "Körpergewicht", "time", "bergsteiger"),
  x("dead-bug", "Dead Bug", "Bauch", "Körpergewicht", "reps", "käfer"),
  x("hollow-hold", "Hollow Hold", "Bauch", "Körpergewicht", "time", ""),

  // ── Unterarme ──────────────────────────────────────────
  x("wrist-curls", "Handgelenkcurls (Langhantel)", "Unterarme", "Langhantel", null, "wrist curls"),
  x("reverse-curls", "Reverse Curls (SZ-Stange)", "Unterarme", "SZ-Stange", null, "reverse curl obergriff"),
  x("farmers-walk", "Farmer's Walk", "Unterarme", "Kurzhantel", "time", "farmers carry"),
  x("dead-hang", "Aushängen (Dead Hang)", "Unterarme", "Körpergewicht", "time", ""),

  // ── Ganzkörper ─────────────────────────────────────────
  x("kb-swings", "Kettlebell Swings", "Ganzkörper", "Kettlebell", null, ""),
  x("thrusters", "Thrusters (Langhantel)", "Ganzkörper", "Langhantel", null, ""),
  x("power-clean", "Umsetzen (Power Clean)", "Ganzkörper", "Langhantel", null, "clean"),
  x("clean-press", "Clean & Press", "Ganzkörper", "Langhantel", null, "umsetzen und drücken"),
  x("snatch", "Reißen (Snatch)", "Ganzkörper", "Langhantel", null, ""),
  x("burpees", "Burpees", "Ganzkörper", "Körpergewicht", "reps", ""),
  x("wall-balls", "Wall Balls", "Ganzkörper", "Sonstiges", null, "medizinball"),
  x("sled-push", "Schlitten schieben (Sled Push)", "Ganzkörper", "Sonstiges", null, "prowler"),
  x("turkish-getup", "Turkish Get-Up (Kettlebell)", "Ganzkörper", "Kettlebell", null, ""),
  x("box-jumps", "Box Jumps", "Ganzkörper", "Körpergewicht", "reps", "sprungbox"),
  x("stretching", "Dehnen / Stretching", "Ganzkörper", "Körpergewicht", "time", "mobility"),

  // ── Cardio ─────────────────────────────────────────────
  x("laufband", "Laufband", "Cardio", "Cardiogerät", "time", "treadmill"),
  x("laufen", "Laufen (draußen)", "Cardio", "Körpergewicht", "time", "joggen running"),
  x("gehen", "Gehen / Spazieren", "Cardio", "Körpergewicht", "time", "walking"),
  x("ergometer", "Fahrrad-Ergometer", "Cardio", "Cardiogerät", "time", "bike rad"),
  x("radfahren", "Radfahren (draußen)", "Cardio", "Sonstiges", "time", "cycling"),
  x("crosstrainer", "Crosstrainer", "Cardio", "Cardiogerät", "time", "elliptical"),
  x("rudergeraet", "Rudergerät (Ergometer)", "Cardio", "Cardiogerät", "time", "rowing erg"),
  x("stairmaster", "Treppensteiger (Stairmaster)", "Cardio", "Cardiogerät", "time", "stepmill"),
  x("seilspringen", "Seilspringen", "Cardio", "Sonstiges", "time", "jump rope"),
  x("schwimmen", "Schwimmen", "Cardio", "Körpergewicht", "time", "swimming"),
  x("assault-bike", "Assault Bike", "Cardio", "Cardiogerät", "time", "air bike"),
  x("hiit", "HIIT-Einheit", "Cardio", "Körpergewicht", "time", "intervall"),
];

// Beispielplan, der beim ersten Start angelegt wird.
// Ein Plan bündelt mehrere Trainings (z. B. Push / Pull / Beine).
const SAMPLE_PLANS = [
  {
    name: "Push / Pull / Beine",
    workouts: [
      {
        name: "Push (Brust, Schultern, Trizeps)",
        exercises: [
          { exerciseId: "bankdruecken-lh", sets: 4 },
          { exerciseId: "schulterdruecken-kh", sets: 3 },
          { exerciseId: "schraegbank-kh", sets: 3 },
          { exerciseId: "seitheben-kh", sets: 3 },
          { exerciseId: "trizepsdruecken-kabel", sets: 3 },
          { exerciseId: "overhead-trizeps-kabel", sets: 3 },
        ],
      },
      {
        name: "Pull (Rücken, Bizeps)",
        exercises: [
          { exerciseId: "kreuzheben", sets: 3 },
          { exerciseId: "klimmzuege", sets: 3 },
          { exerciseId: "rudern-kabel", sets: 3 },
          { exerciseId: "latzug-breit", sets: 3 },
          { exerciseId: "face-pulls", sets: 3 },
          { exerciseId: "curls-sz", sets: 3 },
          { exerciseId: "hammer-curls", sets: 3 },
        ],
      },
      {
        name: "Beine & Bauch",
        exercises: [
          { exerciseId: "kniebeugen", sets: 4 },
          { exerciseId: "rdl", sets: 3 },
          { exerciseId: "beinpresse", sets: 3 },
          { exerciseId: "beinbeuger-liegend", sets: 3 },
          { exerciseId: "wadenheben-stehend", sets: 4 },
          { exerciseId: "plank", sets: 3 },
          { exerciseId: "cable-crunches", sets: 3 },
        ],
      },
    ],
  },
];
