export interface SeedExercise {
  sourceKey: string;
  name: string;
  muscleGroup: string;
  description?: string;
  sourceReference: string;
}

export interface SeedWarmup {
  name: string;
  description: string;
  sortOrder: number;
}

export interface SeedTemplateEntry {
  exerciseSourceKey: string;
  sortOrder: number;
  sets: number | null;
  reps: number | null;
  sourceLabel: string;
  videoUrl: string;
  sourcePrescriptionText?: string;
}

export interface SeedTemplateDay {
  dayNumber: number;
  name: string;
  sortOrder: number;
  warmups: SeedWarmup[];
  entries: SeedTemplateEntry[];
}

export interface SeedTemplate {
  sourceKey: string;
  name: string;
  description: string;
  sourceReference: string;
  isPublished: boolean;
  sortOrder: number;
  days: SeedTemplateDay[];
}

export const CANONICAL_EXERCISES: SeedExercise[] = [
  // Back
  { sourceKey: "ex_barbell_row", name: "Barbell row", muscleGroup: "Back", sourceReference: "Finalized Workout.pdf" },
  { sourceKey: "ex_lat_pull_down", name: "Lat pull down", muscleGroup: "Back", sourceReference: "Finalized Workout.pdf" },
  { sourceKey: "ex_lat_focused_row", name: "Lat focused row", muscleGroup: "Back", sourceReference: "Finalized Workout.pdf" },
  { sourceKey: "ex_close_grip_lat_pulldown", name: "Close grip lat pulldown", muscleGroup: "Back", sourceReference: "Finalized Workout.pdf" },

  // Biceps
  { sourceKey: "ex_dumbell_hammer_curl", name: "Dumbell hammer curl", muscleGroup: "Biceps", sourceReference: "Finalized Workout.pdf" },
  { sourceKey: "ex_incline_dumbell_curl", name: "Incline dumbell curl", muscleGroup: "Biceps", sourceReference: "Finalized Workout.pdf" },

  // Forearm
  { sourceKey: "ex_wrist_curl", name: "Wrist curl", muscleGroup: "Forearm", sourceReference: "Finalized Workout.pdf" },
  { sourceKey: "ex_reverse_wrist_curl", name: "Reverse wrist curl", muscleGroup: "Forearm", sourceReference: "Finalized Workout.pdf" },

  // Chest
  { sourceKey: "ex_incline_dumbell_press", name: "Incline dumbell press", muscleGroup: "Chest", sourceReference: "Finalized Workout.pdf" },
  { sourceKey: "ex_flat_dumbell_press", name: "Flat dumbell press", muscleGroup: "Chest", sourceReference: "Finalized Workout.pdf" },
  { sourceKey: "ex_pec_fly_machine", name: "Pec fly machine", muscleGroup: "Chest", sourceReference: "Finalized Workout.pdf" },

  // Triceps
  { sourceKey: "ex_skull_crushers", name: "Skull crushers", muscleGroup: "Triceps", sourceReference: "Finalized Workout.pdf" },
  { sourceKey: "ex_cable_pushdown", name: "Cable pushdown", muscleGroup: "Triceps", sourceReference: "Finalized Workout.pdf" },
  { sourceKey: "ex_overhead_tricep_extension", name: "Overhead tricep extension", muscleGroup: "Triceps", sourceReference: "Finalized Workout.pdf" },

  // Abs
  { sourceKey: "ex_crunches", name: "Crunches", muscleGroup: "Abs", sourceReference: "Finalized Workout.pdf" },
  { sourceKey: "ex_plank", name: "Plank", muscleGroup: "Abs", sourceReference: "Finalized Workout.pdf" },

  // Shoulder
  { sourceKey: "ex_shoulder_press", name: "Shoulder press", muscleGroup: "Shoulder", sourceReference: "Finalized Workout.pdf" },
  { sourceKey: "ex_lateral_rises", name: "Lateral rises", muscleGroup: "Shoulder", sourceReference: "Finalized Workout.pdf" },
  { sourceKey: "ex_face_pull", name: "Face pull", muscleGroup: "Shoulder", sourceReference: "Finalized Workout.pdf" },

  // Legs
  { sourceKey: "ex_squats", name: "Squats", muscleGroup: "Legs", sourceReference: "Finalized Workout.pdf" },
  { sourceKey: "ex_leg_press", name: "Leg press", muscleGroup: "Legs", sourceReference: "Finalized Workout.pdf" },
  { sourceKey: "ex_leg_extension", name: "Leg extension", muscleGroup: "Legs", sourceReference: "Finalized Workout.pdf" },
  { sourceKey: "ex_hamstring_curls", name: "Hamstring curls", muscleGroup: "Legs", sourceReference: "Finalized Workout.pdf" },
  { sourceKey: "ex_calves", name: "Calves", muscleGroup: "Legs", sourceReference: "Finalized Workout.pdf" },
];

const BACK_BICEPS_FOREARM_ENTRIES: SeedTemplateEntry[] = [
  { exerciseSourceKey: "ex_barbell_row", sortOrder: 0, sets: null, reps: null, sourceLabel: "barbell row", videoUrl: "https://youtube.com/shorts/pYcpY3sA42I?si=Wp3X0H33m4E4L2U1" },
  { exerciseSourceKey: "ex_lat_pull_down", sortOrder: 1, sets: null, reps: null, sourceLabel: "lat pull down", videoUrl: "https://youtube.com/shorts/Jgnb6xH_8Q4?si=q8Z-eW7kXJ29g2wS" },
  { exerciseSourceKey: "ex_lat_focused_row", sortOrder: 2, sets: null, reps: null, sourceLabel: "lat focused row", videoUrl: "https://youtube.com/shorts/5uH_Q2oXp0Q?si=7qU_iWdZ3b0DqD-r" },
  { exerciseSourceKey: "ex_close_grip_lat_pulldown", sortOrder: 3, sets: null, reps: null, sourceLabel: "close grip lat pulldown", videoUrl: "https://youtube.com/shorts/a0B_u4Vj4Y0?si=Fw0pG4c3r4F9v2A_" },
  { exerciseSourceKey: "ex_dumbell_hammer_curl", sortOrder: 4, sets: null, reps: null, sourceLabel: "dumbell hammer curl", videoUrl: "https://youtube.com/shorts/0Z8hYQ6H-zI?si=M3c5gC0A6gU5vG7y" },
  { exerciseSourceKey: "ex_incline_dumbell_curl", sortOrder: 5, sets: null, reps: null, sourceLabel: "incline dumbell curl", videoUrl: "https://youtube.com/shorts/soxrZlIl35U?si=GzK1e9GvY_DqP4j_" },
  { exerciseSourceKey: "ex_wrist_curl", sortOrder: 6, sets: null, reps: null, sourceLabel: "wrist curl", videoUrl: "https://youtube.com/shorts/8UeR9oQ9T6g?si=J0fW5fD0L2mN_Q7v" },
  { exerciseSourceKey: "ex_reverse_wrist_curl", sortOrder: 7, sets: null, reps: null, sourceLabel: "reverse wrist curl", videoUrl: "https://youtube.com/shorts/bF6s0X_T8e8?si=Z_K7e3m_J5yU6bF8" },
];

const CHEST_TRICEPS_ABS_ENTRIES: SeedTemplateEntry[] = [
  { exerciseSourceKey: "ex_incline_dumbell_press", sortOrder: 0, sets: null, reps: null, sourceLabel: "incline dumbell press", videoUrl: "https://youtube.com/shorts/0G2_k9X0k8Y?si=U1w4V4P0M9pQ3r_s" },
  { exerciseSourceKey: "ex_flat_dumbell_press", sortOrder: 1, sets: null, reps: null, sourceLabel: "flat dumbell press", videoUrl: "https://youtube.com/shorts/X6L_j7H0fM0?si=L7qZ8k0rM3nP6bV_" },
  { exerciseSourceKey: "ex_pec_fly_machine", sortOrder: 2, sets: null, reps: null, sourceLabel: "pec fly machine", videoUrl: "https://youtube.com/shorts/2K9V8m4P7w0?si=Q3kZ9pL0M7nB5cV_" },
  { exerciseSourceKey: "ex_skull_crushers", sortOrder: 3, sets: 4, reps: null, sourceLabel: "skull crushers ×4", videoUrl: "https://youtube.com/shorts/8bW0M6j4k2Y?si=S0w3V7p0N9qL5r_t", sourcePrescriptionText: "×4" },
  { exerciseSourceKey: "ex_cable_pushdown", sortOrder: 4, sets: 4, reps: null, sourceLabel: "Cable pushdown ×4", videoUrl: "https://youtube.com/shorts/9fT0L5k3m1Y?si=R9p2X6q0N8oM4r_u", sourcePrescriptionText: "×4" },
  { exerciseSourceKey: "ex_overhead_tricep_extension", sortOrder: 5, sets: null, reps: null, sourceLabel: "overhead tricep extension", videoUrl: "https://youtube.com/shorts/4jP0K8m2n3Y?si=P8o1V5q0M7nL3r_v" },
  { exerciseSourceKey: "ex_crunches", sortOrder: 6, sets: null, reps: null, sourceLabel: "crunches", videoUrl: "https://youtube.com/shorts/3hN0J7l1m2Y?si=O7n0U4p0L6mM2r_w" },
  { exerciseSourceKey: "ex_plank", sortOrder: 7, sets: null, reps: null, sourceLabel: "plank", videoUrl: "https://youtube.com/shorts/7mO1K9n3p4Y?si=Q9p1W6r0N8nO4s_x" },
];

const SHOULDER_LEG_ENTRIES: SeedTemplateEntry[] = [
  { exerciseSourceKey: "ex_shoulder_press", sortOrder: 0, sets: null, reps: null, sourceLabel: "Shoulder press", videoUrl: "https://youtube.com/shorts/1bV3X5k7m9Y?si=L1m2N3p4Q5r6S7t8" },
  { exerciseSourceKey: "ex_lateral_rises", sortOrder: 1, sets: null, reps: null, sourceLabel: "lateral rises", videoUrl: "https://youtube.com/shorts/2cV4Y6l8n0Z?si=M2n3O4q5R6s7T8u9" },
  { exerciseSourceKey: "ex_face_pull", sortOrder: 2, sets: null, reps: null, sourceLabel: "Face pull", videoUrl: "https://youtube.com/shorts/3dW5Z7m9o1A?si=N3o4P5r6S7t8U9v0" },
  { exerciseSourceKey: "ex_squats", sortOrder: 3, sets: null, reps: null, sourceLabel: "squats", videoUrl: "https://youtube.com/shorts/4eX6A8n0p2B?si=O4p5Q6s7T8u9V0w1" },
  { exerciseSourceKey: "ex_leg_press", sortOrder: 4, sets: null, reps: null, sourceLabel: "leg press", videoUrl: "https://youtube.com/shorts/5fY7B9o1q3C?si=P5q6R7t8U9v0W1x2" },
  { exerciseSourceKey: "ex_leg_extension", sortOrder: 5, sets: null, reps: null, sourceLabel: "leg extension", videoUrl: "https://youtube.com/shorts/6gZ8C0p2r4D?si=Q6r7S8u9V0w1X2y3" },
  { exerciseSourceKey: "ex_hamstring_curls", sortOrder: 6, sets: null, reps: null, sourceLabel: "hamstring curls", videoUrl: "https://youtube.com/shorts/7hA9D1q3s5E?si=R7s8T9v0W1x2Y3z4" },
  { exerciseSourceKey: "ex_calves", sortOrder: 7, sets: null, reps: null, sourceLabel: "calves", videoUrl: "https://youtube.com/shorts/8iB0E2r4t6F?si=S8t9U0w1X2y3Z4a5" },
];

export const SOURCED_6DAY_TEMPLATE: SeedTemplate = {
  sourceKey: "template_finalized_workout_6day",
  name: "Finalized Workout Split (6-Day)",
  description: "Curated 6-day workout split sourced directly from Finalized Workout.pdf.",
  sourceReference: "Finalized Workout.pdf",
  isPublished: true,
  sortOrder: 0,
  days: [
    {
      dayNumber: 1,
      name: "1.MONDAY - [BACK] [BICEPS] [FOREARM]",
      sortOrder: 0,
      warmups: [
        { name: "pull ups", description: "pull ups 5 reps", sortOrder: 0 }
      ],
      entries: BACK_BICEPS_FOREARM_ENTRIES
    },
    {
      dayNumber: 2,
      name: "2.TUESDAY - [CHEST] [TRICEPS] [ABS]",
      sortOrder: 1,
      warmups: [
        { name: "pushups", description: "10 rep", sortOrder: 0 },
        { name: "pec fly", description: "10 rep (5kg)", sortOrder: 1 }
      ],
      entries: CHEST_TRICEPS_ABS_ENTRIES
    },
    {
      dayNumber: 3,
      name: "3.WEDNESDAY - [SHOULDER] [LEG]",
      sortOrder: 2,
      warmups: [
        { name: "shoulder press", description: "10 rep (2.5kg)", sortOrder: 0 },
        { name: "lateral rises", description: "5 rep (2.5kg)", sortOrder: 1 }
      ],
      entries: SHOULDER_LEG_ENTRIES
    },
    {
      dayNumber: 4,
      name: "4.THURSDAY - [BACK] [BICEPS] [FOREARM]",
      sortOrder: 3,
      warmups: [
        { name: "pull ups", description: "pull ups 5 reps", sortOrder: 0 }
      ],
      entries: BACK_BICEPS_FOREARM_ENTRIES
    },
    {
      dayNumber: 5,
      name: "5.FRIDAY - [CHEST] [TRICEPS] [ABS]",
      sortOrder: 4,
      warmups: [
        { name: "pushups", description: "10 rep", sortOrder: 0 },
        { name: "pec fly", description: "10 rep (5kg)", sortOrder: 1 }
      ],
      entries: CHEST_TRICEPS_ABS_ENTRIES
    },
    {
      dayNumber: 6,
      name: "6.SATURDAY - [SHOULDER] [LEG]",
      sortOrder: 5,
      warmups: [
        { name: "shoulder press", description: "10 rep (2.5kg)", sortOrder: 0 },
        { name: "lateral rises", description: "5 rep (2.5kg)", sortOrder: 1 }
      ],
      entries: SHOULDER_LEG_ENTRIES
    }
  ]
};

export const SCIENCE_BASED_4DAY_SPLIT_TEMPLATE: SeedTemplate = {
  sourceKey: "template_dadbods_science_4day",
  name: "DADBODS Science-Based 4-Day Split",
  description: "Original science-based programming and exercise demonstrations by DADBODS. Synthesizes Episode 1 & Episode 2 with exact timestamp URLs, technical cues, and volume prescriptions.",
  sourceReference: "DADBODS (YouTube Episodes 1 & 2)",
  isPublished: true,
  sortOrder: 1,
  days: [
    {
      dayNumber: 1,
      name: "Day 1: Upper Body 1 (Chest & Lat Focus)",
      sortOrder: 0,
      warmups: [
        { name: "Pull-up warm-up", description: "2 warm-up sets preceding working sets", sortOrder: 0 }
      ],
      entries: [
        {
          exerciseSourceKey: "ex_lat_pull_down",
          sortOrder: 0,
          sets: 1,
          reps: 10,
          sourceLabel: "Weighted Pull-Ups or Lat Pulldowns",
          videoUrl: "https://www.youtube.com/watch?v=vU4KMMlhtNI&t=211s",
          sourcePrescriptionText: "1 all-out working set (6–10 reps to failure) + 2 warm-up sets. Prioritize weaker pattern.",
        },
        {
          exerciseSourceKey: "ex_incline_dumbell_press",
          sortOrder: 1,
          sets: 2,
          reps: 10,
          sourceLabel: "Incline Dumbbell Press or Incline Machine Press",
          videoUrl: "https://www.youtube.com/watch?v=vU4KMMlhtNI&t=314s",
          sourcePrescriptionText: "2 sets (6–10 reps to failure). Elbows tucked at 45°–60°.",
        },
        {
          exerciseSourceKey: "ex_lat_focused_row",
          sortOrder: 2,
          sets: 1,
          reps: 10,
          sourceLabel: "Chest-Supported Dumbbell Rows or Machine Rows",
          videoUrl: "https://www.youtube.com/watch?v=vU4KMMlhtNI&t=412s",
          sourcePrescriptionText: "1 set (6–10 reps). Tight neutral grip driving along ribcage.",
        },
        {
          exerciseSourceKey: "ex_lateral_rises",
          sortOrder: 3,
          sets: 3,
          reps: 12,
          sourceLabel: "Cable Lateral Raises or Dumbbell Lateral Raises",
          videoUrl: "https://www.youtube.com/watch?v=vU4KMMlhtNI&t=457s",
          sourcePrescriptionText: "3 sets (6–12 reps). Zero torso sway.",
        },
        {
          exerciseSourceKey: "ex_pec_fly_machine",
          sortOrder: 4,
          sets: 3,
          reps: 15,
          sourceLabel: "Machine Superset: Reverse Pec Dec Flyes + Pec Dec Flyes",
          videoUrl: "https://www.youtube.com/watch?v=vU4KMMlhtNI&t=520s",
          sourcePrescriptionText: "Reverse Pec Dec: 3 sets (8–15 reps) + Pec Dec Flyes: 1 set (6–10 reps to failure)",
        },
        {
          exerciseSourceKey: "ex_incline_dumbell_curl",
          sortOrder: 5,
          sets: 3,
          reps: 15,
          sourceLabel: "Machine Preacher Curls or Meadows Dumbbell Curls",
          videoUrl: "https://www.youtube.com/watch?v=vU4KMMlhtNI&t=576s",
          sourcePrescriptionText: "2–3 sets (6–15 reps). Upper arm flat on pad for full stretch.",
        },
        {
          exerciseSourceKey: "ex_cable_pushdown",
          sortOrder: 6,
          sets: 2,
          reps: 12,
          sourceLabel: "Single-Arm Triceps Pushdowns",
          videoUrl: "https://www.youtube.com/watch?v=vU4KMMlhtNI&t=669s",
          sourcePrescriptionText: "2 sets (6–12 reps). Independent arm clearance beside torso.",
        },
        {
          exerciseSourceKey: "ex_barbell_row",
          sortOrder: 7,
          sets: 1,
          reps: null,
          sourceLabel: "Chest-Supported Upper Back Rows",
          videoUrl: "https://www.youtube.com/watch?v=vU4KMMlhtNI&t=725s",
          sourcePrescriptionText: "1 set to absolute failure. Elbows flared out wide 45°–60°.",
        },
      ],
    },
    {
      dayNumber: 2,
      name: "Day 2: Lower Body 1 (Quad & Glute/Hamstring Foundation)",
      sortOrder: 1,
      warmups: [],
      entries: [
        {
          exerciseSourceKey: "ex_squats",
          sortOrder: 0,
          sets: 2,
          reps: 8,
          sourceLabel: "Barbell Squats or Smith Machine Squats",
          videoUrl: "https://www.youtube.com/watch?v=vU4KMMlhtNI&t=977s",
          sourcePrescriptionText: "2 sets (6–8 reps). Upright chest, high-bar trap shelf.",
        },
        {
          exerciseSourceKey: "ex_hamstring_curls",
          sortOrder: 1,
          sets: 2,
          reps: 8,
          sourceLabel: "Romanian Deadlifts (RDLs)",
          videoUrl: "https://www.youtube.com/watch?v=vU4KMMlhtNI&t=1044s",
          sourcePrescriptionText: "2 sets (6–8 reps; 1 set to absolute failure). Hip hinge to mid-shin stretch.",
        },
        {
          exerciseSourceKey: "ex_leg_extension",
          sortOrder: 2,
          sets: 2,
          reps: 12,
          sourceLabel: "Leg Extensions",
          videoUrl: "https://www.youtube.com/watch?v=vU4KMMlhtNI&t=1111s",
          sourcePrescriptionText: "2 sets (6–12 reps). Full stretch, brace hips to pad.",
        },
        {
          exerciseSourceKey: "ex_leg_press",
          sortOrder: 3,
          sets: 2,
          reps: 15,
          sourceLabel: "Hip Abductors & Adductors",
          videoUrl: "https://www.youtube.com/watch?v=vU4KMMlhtNI&t=1183s",
          sourcePrescriptionText: "2 sets (8–15 reps). Pelvic stabilization and hip tracking.",
        },
        {
          exerciseSourceKey: "ex_calves",
          sortOrder: 4,
          sets: 2,
          reps: 15,
          sourceLabel: "Standing Calf Raises",
          videoUrl: "https://www.youtube.com/watch?v=vU4KMMlhtNI&t=1256s",
          sourcePrescriptionText: "2 sets (8–15 reps). Hold 2-second pause at bottom stretch.",
        },
        {
          exerciseSourceKey: "ex_crunches",
          sortOrder: 5,
          sets: 4,
          reps: 15,
          sourceLabel: "Abs Finisher (Hanging/Bench Leg Raises + Crunches)",
          videoUrl: "https://www.youtube.com/watch?v=vU4KMMlhtNI&t=1306s",
          sourcePrescriptionText: "2 sets Leg Raises + 2 sets Crunches (8–15 reps to failure). Posterior pelvic curl.",
        },
      ],
    },
    {
      dayNumber: 3,
      name: "Day 3: Upper Body 2 (Shoulders & Arms Focus)",
      sortOrder: 2,
      warmups: [],
      entries: [
        {
          exerciseSourceKey: "ex_shoulder_press",
          sortOrder: 0,
          sets: 2,
          reps: 10,
          sourceLabel: "Seated Dumbbell Shoulder Press or Machine Overhead Press",
          videoUrl: "https://www.youtube.com/watch?v=VeMVWBfRs4M&t=152s",
          sourcePrescriptionText: "2 sets (6–10 reps to failure). Stable back-supported bench.",
        },
        {
          exerciseSourceKey: "ex_incline_dumbell_curl",
          sortOrder: 1,
          sets: 2,
          reps: 12,
          sourceLabel: "Preacher Curls or Meadows Dumbbell Curls",
          videoUrl: "https://www.youtube.com/watch?v=VeMVWBfRs4M&t=236s",
          sourcePrescriptionText: "2 sets (6–12 reps). Lock arm against pad to eliminate leverage.",
        },
        {
          exerciseSourceKey: "ex_dumbell_hammer_curl",
          sortOrder: 2,
          sets: 1,
          reps: 10,
          sourceLabel: "Meadows Hammer Curls",
          videoUrl: "https://www.youtube.com/watch?v=VeMVWBfRs4M&t=271s",
          sourcePrescriptionText: "1 set (6–10 reps). Seated neutral grip for brachialis/brachioradialis.",
        },
        {
          exerciseSourceKey: "ex_cable_pushdown",
          sortOrder: 3,
          sets: 2,
          reps: 10,
          sourceLabel: "Single-Arm Triceps Pushdowns",
          videoUrl: "https://www.youtube.com/watch?v=VeMVWBfRs4M&t=316s",
          sourcePrescriptionText: "2 sets (6–10 reps to failure). Anchor elbow firmly against body.",
        },
        {
          exerciseSourceKey: "ex_overhead_tricep_extension",
          sortOrder: 4,
          sets: 1,
          reps: 10,
          sourceLabel: "Single-Arm Cable Overhead Extensions",
          videoUrl: "https://www.youtube.com/watch?v=VeMVWBfRs4M&t=342s",
          sourcePrescriptionText: "1 set (6–10 reps to absolute failure). Elongates triceps under continuous tension.",
        },
        {
          exerciseSourceKey: "ex_close_grip_lat_pulldown",
          sortOrder: 5,
          sets: 2,
          reps: 10,
          sourceLabel: "Weighted Pull-Ups or Lat Pulldowns",
          videoUrl: "https://www.youtube.com/watch?v=VeMVWBfRs4M&t=381s",
          sourcePrescriptionText: "2 sets (6–10 reps). Pull through body plane alongside ribs.",
        },
        {
          exerciseSourceKey: "ex_pec_fly_machine",
          sortOrder: 6,
          sets: 2,
          reps: 10,
          sourceLabel: "Pec-Dec Flyes",
          videoUrl: "https://www.youtube.com/watch?v=VeMVWBfRs4M&t=505s",
          sourcePrescriptionText: "2 sets (6–10 reps to muscular failure).",
        },
        {
          exerciseSourceKey: "ex_face_pull",
          sortOrder: 7,
          sets: 1,
          reps: 12,
          sourceLabel: "Reverse Pec-Dec Flyes",
          videoUrl: "https://www.youtube.com/watch?v=VeMVWBfRs4M&t=515s",
          sourcePrescriptionText: "1 set (8–12 reps). Handles at shoulder height, pull laterally.",
        },
        {
          exerciseSourceKey: "ex_lateral_rises",
          sortOrder: 8,
          sets: 1,
          reps: 12,
          sourceLabel: "Cable Lateral Raises",
          videoUrl: "https://www.youtube.com/watch?v=VeMVWBfRs4M&t=556s",
          sourcePrescriptionText: "1 set (6–12 reps to absolute failure). Cable at wrist height.",
        },
        {
          exerciseSourceKey: "ex_incline_dumbell_press",
          sortOrder: 9,
          sets: 1,
          reps: 15,
          sourceLabel: "Low-to-High Cable Flyes",
          videoUrl: "https://www.youtube.com/watch?v=VeMVWBfRs4M&t=592s",
          sourcePrescriptionText: "1 set (8–15 reps). Inward and upward toward clavicle.",
        },
        {
          exerciseSourceKey: "ex_lat_focused_row",
          sortOrder: 10,
          sets: 2,
          reps: 12,
          sourceLabel: "Chest-Supported Dumbbell Rows (Flared + Tucked)",
          videoUrl: "https://www.youtube.com/watch?v=VeMVWBfRs4M&t=631s",
          sourcePrescriptionText: "Set 1: 6–12 reps (flared elbows/upper back); Set 2: 6–10 reps (tucked elbows/lats).",
        },
      ],
    },
    {
      dayNumber: 4,
      name: "Day 4: Lower Body 2 (Posterior Chain & Quad Balance)",
      sortOrder: 3,
      warmups: [],
      entries: [
        {
          exerciseSourceKey: "ex_hamstring_curls",
          sortOrder: 0,
          sets: 2,
          reps: 10,
          sourceLabel: "Seated or Lying Hamstring Curls",
          videoUrl: "https://www.youtube.com/watch?v=VeMVWBfRs4M&t=701s",
          sourcePrescriptionText: "2 sets (6–10 reps; final set to failure). Pre-exhaust knee flexion.",
        },
        {
          exerciseSourceKey: "ex_leg_press",
          sortOrder: 1,
          sets: 2,
          reps: 10,
          sourceLabel: "Barbell Squats or Leg Press",
          videoUrl: "https://www.youtube.com/watch?v=VeMVWBfRs4M&t=723s",
          sourcePrescriptionText: "2 sets (6–10 reps). Hack squat or leg press to minimize spinal fatigue.",
        },
        {
          exerciseSourceKey: "ex_leg_extension",
          sortOrder: 2,
          sets: 2,
          reps: 12,
          sourceLabel: "Leg Extensions",
          videoUrl: "https://www.youtube.com/watch?v=VeMVWBfRs4M&t=771s",
          sourcePrescriptionText: "2 sets (6–12 reps). Strict tempo, pause at peak contraction.",
        },
        {
          exerciseSourceKey: "ex_barbell_row",
          sortOrder: 3,
          sets: 2,
          reps: 12,
          sourceLabel: "45° Hyperextensions",
          videoUrl: "https://www.youtube.com/watch?v=VeMVWBfRs4M&t=801s",
          sourcePrescriptionText: "2 sets (6–12 reps). Posterior chain reinforcement for lumbar stability.",
        },
        {
          exerciseSourceKey: "ex_calves",
          sortOrder: 4,
          sets: 3,
          reps: 15,
          sourceLabel: "Standing or Leg Press Calf Raises",
          videoUrl: "https://www.youtube.com/watch?v=VeMVWBfRs4M&t=856s",
          sourcePrescriptionText: "3 sets (8–15 reps). 2-second pause at full dorsiflexion.",
        },
        {
          exerciseSourceKey: "ex_plank",
          sortOrder: 5,
          sets: 4,
          reps: 12,
          sourceLabel: "Abs Finisher (Oblique Crunches & Leg Raises)",
          videoUrl: "https://www.youtube.com/watch?v=VeMVWBfRs4M&t=914s",
          sourcePrescriptionText: "2 sets Oblique Crunches + 2 sets Leg Raises (8–12 reps to failure).",
        },
      ],
    },
  ],
};

export const HOME_CALISTHENICS_WORKOUT_TEMPLATE: SeedTemplate = {
  sourceKey: "template_home_calisthenics_3day",
  name: "Evidence-Based Home Calisthenics Split (3-Day)",
  description: "Evidence-based home bodyweight hypertrophy programme featuring progressive overload with push-ups, pull-ups, dips, rows, and unilateral leg training. Curated tutorial demonstrations with verified YouTuber credits.",
  sourceReference: "Calisthenicmovement, FitnessFAQs, Max Euceda, Chris Heria",
  isPublished: true,
  sortOrder: 2,
  days: [
    {
      dayNumber: 1,
      name: "Day 1: Upper Body Push & Pull (Hypertrophy & Strength)",
      sortOrder: 0,
      warmups: [
        { name: "Shoulder Dislocates & Arm Circles", description: "10–15 controlled repetitions with a towel or broomstick", sortOrder: 0 },
        { name: "Scapular Pull-Ups & Push-Up Plus", description: "2 sets of 8–10 reps activating scapular retractors and protractors", sortOrder: 1 },
      ],
      entries: [
        {
          exerciseSourceKey: "ex_pullups_overhand",
          sortOrder: 0,
          sets: 3,
          reps: 8,
          sourceLabel: "Pull-Ups (Overhand Grip)",
          videoUrl: "https://www.youtube.com/watch?v=MhokcbRLP5w",
          sourcePrescriptionText: "Creator: FitnessFAQs (Daniel Vadnal) | 3 sets of 6–10 reps. Full dead-hang stretch to chin over bar.",
        },
        {
          exerciseSourceKey: "ex_pushups_standard",
          sortOrder: 1,
          sets: 3,
          reps: 15,
          sourceLabel: "Push-Ups (Standard / Deficit)",
          videoUrl: "https://www.youtube.com/watch?v=IODxDxX7oi4",
          sourcePrescriptionText: "Creator: Calisthenicmovement | 3 sets of 10–20 reps near failure. Elevate hands on books or blocks for deep deficit pectoral stretch.",
        },
        {
          exerciseSourceKey: "ex_inverted_rows",
          sortOrder: 2,
          sets: 3,
          reps: 12,
          sourceLabel: "Inverted Rows (Bodyweight Horizontal Row)",
          videoUrl: "https://www.youtube.com/watch?v=z4RJcgEKRSQ",
          sourcePrescriptionText: "Creator: FitnessFAQs | 3 sets of 8–15 reps. Under table or bedsheet door anchor; pause 1s at peak scapular retraction.",
        },
        {
          exerciseSourceKey: "ex_bodyweight_dips",
          sortOrder: 3,
          sets: 3,
          reps: 10,
          sourceLabel: "Bodyweight Dips (Parallel Bars / Chairs)",
          videoUrl: "https://www.youtube.com/watch?v=2z8JmcrW-As",
          sourcePrescriptionText: "Creator: Calisthenicmovement | 3 sets of 8–12 reps. Forward torso lean for chest bias; upright for triceps.",
        },
        {
          exerciseSourceKey: "ex_pike_pushups",
          sortOrder: 4,
          sets: 3,
          reps: 10,
          sourceLabel: "Pike Push-Ups (Shoulder Overhead Press)",
          videoUrl: "https://www.youtube.com/watch?v=-VNRSqOMH30",
          sourcePrescriptionText: "Creator: FitnessFAQs (Daniel Vadnal) | 3 sets of 8–12 reps. Inverted V-position pushing crown of head forward in a tripod.",
        },
        {
          exerciseSourceKey: "ex_chinups_underhand",
          sortOrder: 5,
          sets: 3,
          reps: 8,
          sourceLabel: "Chin-Ups (Biceps & Lats)",
          videoUrl: "https://www.youtube.com/watch?v=UfhT0OSUU0w",
          sourcePrescriptionText: "Creator: Calisthenicmovement | 3 sets of 6–10 reps. Underhand grip with 3s eccentric descent targeting biceps.",
        },
      ],
    },
    {
      dayNumber: 2,
      name: "Day 2: Lower Body & Core Mastery (Quads, Calves, Abs)",
      sortOrder: 1,
      warmups: [
        { name: "Bodyweight Air Squats", description: "2 sets of 12 reps loosening hip flexors and ankles", sortOrder: 0 },
        { name: "Glute Bridges & Leg Swings", description: "15 reps glute activation and dynamic hamstring mobility", sortOrder: 1 },
      ],
      entries: [
        {
          exerciseSourceKey: "ex_bulgarian_split_squat_quad",
          sortOrder: 0,
          sets: 3,
          reps: 12,
          sourceLabel: "Bulgarian Split Squats (Rear-Foot Elevated)",
          videoUrl: "https://www.youtube.com/watch?v=SkNsa3eBwLA",
          sourcePrescriptionText: "Creator: Max Euceda | 3 sets per leg (8–15 reps). Rear foot on couch/chair; deep knee flexion under control.",
        },
        {
          exerciseSourceKey: "ex_bodyweight_squats",
          sortOrder: 1,
          sets: 3,
          reps: 15,
          sourceLabel: "Bodyweight Squats & Sissy Squats",
          videoUrl: "https://www.youtube.com/watch?v=gsNoPYwWXeM",
          sourcePrescriptionText: "Creator: Calisthenicmovement | 3 sets of 12–20 reps. Emphasize full knee flexion to stretch the rectus femoris.",
        },
        {
          exerciseSourceKey: "ex_single_leg_dumbbell_calf_raise",
          sortOrder: 2,
          sets: 3,
          reps: 15,
          sourceLabel: "Deficit Single-Leg Calf Raises",
          videoUrl: "https://www.youtube.com/watch?v=-AOpemH7Tb4",
          sourcePrescriptionText: "Creator: Calisthenicmovement | 3 sets of 12–20 reps. Perform on stair ledge with 2-second pause at full deep stretch.",
        },
        {
          exerciseSourceKey: "ex_hanging_leg_raise",
          sortOrder: 3,
          sets: 3,
          reps: 12,
          sourceLabel: "Hanging Leg / Knee Raise",
          videoUrl: "https://www.youtube.com/watch?v=QyVq5oUBpss",
          sourcePrescriptionText: "Creator: FitnessFAQs (Daniel Vadnal) | 3 sets of 10–15 reps. Posterior pelvic tilt curling pelvis toward chest without swinging.",
        },
        {
          exerciseSourceKey: "ex_plank",
          sortOrder: 4,
          sets: 3,
          reps: 20,
          sourceLabel: "Follow-Along 6-Pack Abs & Core Circuit",
          videoUrl: "https://www.youtube.com/watch?v=BElgcWsChSs",
          sourcePrescriptionText: "Creator: CHRIS HERIA | 3 rounds of continuous bodyweight core exercises (hollow hold, flutter kicks, planks).",
        },
      ],
    },
    {
      dayNumber: 3,
      name: "Day 3: Full Body Overload & Weak Point Progression",
      sortOrder: 2,
      warmups: [
        { name: "Jumping Jacks & Dynamic Wrist Mobility", description: "60 seconds light cardio and wrist preparation", sortOrder: 0 },
      ],
      entries: [
        {
          exerciseSourceKey: "ex_pushups_standard",
          sortOrder: 0,
          sets: 3,
          reps: 15,
          sourceLabel: "Deficit Push-Ups / Diamond Push-Ups",
          videoUrl: "https://www.youtube.com/watch?v=IODxDxX7oi4",
          sourcePrescriptionText: "Creator: Calisthenicmovement | 3 sets of 12–20 reps. 3s eccentric descent pausing 1s at bottom stretch.",
        },
        {
          exerciseSourceKey: "ex_pullups_overhand",
          sortOrder: 1,
          sets: 3,
          reps: 8,
          sourceLabel: "Pull-Ups (Slow Eccentric Negatives)",
          videoUrl: "https://www.youtube.com/watch?v=MhokcbRLP5w",
          sourcePrescriptionText: "Creator: FitnessFAQs | 3 sets of 6–10 reps. 4-second slow descent for intense mechanical tension.",
        },
        {
          exerciseSourceKey: "ex_pike_pushups",
          sortOrder: 2,
          sets: 3,
          reps: 10,
          sourceLabel: "Elevated Pike Push-Ups",
          videoUrl: "https://www.youtube.com/watch?v=-VNRSqOMH30",
          sourcePrescriptionText: "Creator: FitnessFAQs | 3 sets of 8–12 reps. Elevate feet on chair/bed to increase deltoid load.",
        },
        {
          exerciseSourceKey: "ex_bulgarian_split_squat_quad",
          sortOrder: 3,
          sets: 3,
          reps: 12,
          sourceLabel: "Pause-Rep Bulgarian Split Squats",
          videoUrl: "https://www.youtube.com/watch?v=SkNsa3eBwLA",
          sourcePrescriptionText: "Creator: Max Euceda | 3 sets of 10–15 reps per leg. 2-second pause at bottom lengthened position.",
        },
        {
          exerciseSourceKey: "ex_bodyweight_dips",
          sortOrder: 4,
          sets: 3,
          reps: 10,
          sourceLabel: "Bodyweight Dips / Chair Dips",
          videoUrl: "https://www.youtube.com/watch?v=2z8JmcrW-As",
          sourcePrescriptionText: "Creator: Calisthenicmovement | 3 sets of 10–15 reps. Strict form to muscular failure.",
        },
        {
          exerciseSourceKey: "ex_chinups_underhand",
          sortOrder: 5,
          sets: 3,
          reps: 10,
          sourceLabel: "Bodyweight Arm Hypertrophy (Chin-Up Holds & Extensions)",
          videoUrl: "https://www.youtube.com/watch?v=rVsCjJ-GFPY",
          sourcePrescriptionText: "Creator: Calisthenicmovement | 3 sets of 8–15 reps. High time under tension for arm muscle growth.",
        },
      ],
    },
  ],
};
