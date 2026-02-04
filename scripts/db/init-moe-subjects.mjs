import { Pool } from "pg";

// Database configuration
const pool = new Pool({
  host: process.env.DATABASE_HOST || "services.irn13.chabokan.net",
  port: parseInt(process.env.DATABASE_PORT || "14102"),
  database: process.env.DATABASE_NAME || "tina",
  user: process.env.DATABASE_USER || "postgres",
  password: process.env.DATABASE_PASSWORD || "IArkz382QprMfqTO",
  ssl: false,
});

// Ministry of Education subjects
const moeSubjects = [
  {
    name: "فارسی",
    code: "PER01",
    description: "زبان فارسی",
    grade_level: "اول",
  },
  {
    name: "ریاضی",
    code: "MATH01",
    description: "ریاضیات پایه",
    grade_level: "اول",
  },
  {
    name: "علوم",
    code: "SCI01",
    description: "علوم تجربی",
    grade_level: "اول",
  },
  {
    name: "اجتماعی",
    code: "SOC01",
    description: "علوم اجتماعی",
    grade_level: "اول",
  },
  {
    name: "هنر",
    code: "ART01",
    description: "هنر و تعلیمات اسلامی",
    grade_level: "اول",
  },
  { name: "ورزش", code: "PE01", description: "تربیت بدنی", grade_level: "اول" },
  {
    name: "فارسی",
    code: "PER02",
    description: "زبان فارسی",
    grade_level: "دوم",
  },
  {
    name: "ریاضی",
    code: "MATH02",
    description: "ریاضیات پایه",
    grade_level: "دوم",
  },
  {
    name: "علوم",
    code: "SCI02",
    description: "علوم تجربی",
    grade_level: "دوم",
  },
  {
    name: "اجتماعی",
    code: "SOC02",
    description: "علوم اجتماعی",
    grade_level: "دوم",
  },
  {
    name: "هنر",
    code: "ART02",
    description: "هنر و تعلیمات اسلامی",
    grade_level: "دوم",
  },
  { name: "ورزش", code: "PE02", description: "تربیت بدنی", grade_level: "دوم" },
  {
    name: "فارسی",
    code: "PER03",
    description: "زبان فارسی",
    grade_level: "سوم",
  },
  {
    name: "ریاضی",
    code: "MATH03",
    description: "ریاضیات پایه",
    grade_level: "سوم",
  },
  {
    name: "علوم",
    code: "SCI03",
    description: "علوم تجربی",
    grade_level: "سوم",
  },
  {
    name: "اجتماعی",
    code: "SOC03",
    description: "علوم اجتماعی",
    grade_level: "سوم",
  },
  {
    name: "هنر",
    code: "ART03",
    description: "هنر و تعلیمات اسلامی",
    grade_level: "سوم",
  },
  { name: "ورزش", code: "PE03", description: "تربیت بدنی", grade_level: "سوم" },
  {
    name: "فارسی",
    code: "PER04",
    description: "زبان فارسی",
    grade_level: "چهارم",
  },
  {
    name: "ریاضی",
    code: "MATH04",
    description: "ریاضیات پایه",
    grade_level: "چهارم",
  },
  {
    name: "علوم",
    code: "SCI04",
    description: "علوم تجربی",
    grade_level: "چهارم",
  },
  {
    name: "اجتماعی",
    code: "SOC04",
    description: "علوم اجتماعی",
    grade_level: "چهارم",
  },
  {
    name: "هنر",
    code: "ART04",
    description: "هنر و تعلیمات اسلامی",
    grade_level: "چهارم",
  },
  {
    name: "ورزش",
    code: "PE04",
    description: "تربیت بدنی",
    grade_level: "چهارم",
  },
  {
    name: "فارسی",
    code: "PER05",
    description: "زبان فارسی",
    grade_level: "پنجم",
  },
  {
    name: "ریاضی",
    code: "MATH05",
    description: "ریاضیات پایه",
    grade_level: "پنجم",
  },
  {
    name: "علوم",
    code: "SCI05",
    description: "علوم تجربی",
    grade_level: "پنجم",
  },
  {
    name: "اجتماعی",
    code: "SOC05",
    description: "علوم اجتماعی",
    grade_level: "پنجم",
  },
  {
    name: "هنر",
    code: "ART05",
    description: "هنر و تعلیمات اسلامی",
    grade_level: "پنجم",
  },
  {
    name: "ورزش",
    code: "PE05",
    description: "تربیت بدنی",
    grade_level: "پنجم",
  },
  {
    name: "فارسی",
    code: "PER06",
    description: "زبان فارسی",
    grade_level: "ششم",
  },
  {
    name: "ریاضی",
    code: "MATH06",
    description: "ریاضیات پایه",
    grade_level: "ششم",
  },
  {
    name: "علوم",
    code: "SCI06",
    description: "علوم تجربی",
    grade_level: "ششم",
  },
  {
    name: "اجتماعی",
    code: "SOC06",
    description: "علوم اجتماعی",
    grade_level: "ششم",
  },
  {
    name: "هنر",
    code: "ART06",
    description: "هنر و تعلیمات اسلامی",
    grade_level: "ششم",
  },
  { name: "ورزش", code: "PE06", description: "تربیت بدنی", grade_level: "ششم" },
  {
    name: "زبان انگلیسی",
    code: "ENG07",
    description: "زبان انگلیسی",
    grade_level: "هفتم",
  },
  {
    name: "ریاضی",
    code: "MATH07",
    description: "ریاضیات پایه",
    grade_level: "هفتم",
  },
  {
    name: "علوم",
    code: "SCI07",
    description: "علوم تجربی",
    grade_level: "هفتم",
  },
  {
    name: "اجتماعی",
    code: "SOC07",
    description: "علوم اجتماعی",
    grade_level: "هفتم",
  },
  {
    name: "قرآن",
    code: "QUR07",
    description: "آموزش قرآن",
    grade_level: "هفتم",
  },
  {
    name: "ورزش",
    code: "PE07",
    description: "تربیت بدنی",
    grade_level: "هفتم",
  },
  {
    name: "زبان انگلیسی",
    code: "ENG08",
    description: "زبان انگلیسی",
    grade_level: "هشتم",
  },
  {
    name: "ریاضی",
    code: "MATH08",
    description: "ریاضیات پایه",
    grade_level: "هشتم",
  },
  {
    name: "علوم",
    code: "SCI08",
    description: "علوم تجربی",
    grade_level: "هشتم",
  },
  {
    name: "اجتماعی",
    code: "SOC08",
    description: "علوم اجتماعی",
    grade_level: "هشتم",
  },
  {
    name: "قرآن",
    code: "QUR08",
    description: "آموزش قرآن",
    grade_level: "هشتم",
  },
  {
    name: "ورزش",
    code: "PE08",
    description: "تربیت بدنی",
    grade_level: "هشتم",
  },
  {
    name: "زبان انگلیسی",
    code: "ENG09",
    description: "زبان انگلیسی",
    grade_level: "نهم",
  },
  {
    name: "ریاضی",
    code: "MATH09",
    description: "ریاضیات پایه",
    grade_level: "نهم",
  },
  {
    name: "علوم",
    code: "SCI09",
    description: "علوم تجربی",
    grade_level: "نهم",
  },
  {
    name: "اجتماعی",
    code: "SOC09",
    description: "علوم اجتماعی",
    grade_level: "نهم",
  },
  {
    name: "قرآن",
    code: "QUR09",
    description: "آموزش قرآن",
    grade_level: "نهم",
  },
  { name: "ورزش", code: "PE09", description: "تربیت بدنی", grade_level: "نهم" },
  {
    name: "زبان انگلیسی",
    code: "ENG10",
    description: "زبان انگلیسی",
    grade_level: "دهم",
  },
  {
    name: "ریاضی",
    code: "MATH10",
    description: "ریاضیات پایه",
    grade_level: "دهم",
  },
  { name: "فیزیک", code: "PHY10", description: "فیزیک", grade_level: "دهم" },
  { name: "شیمی", code: "CHE10", description: "شیمی", grade_level: "دهم" },
  {
    name: "زیست",
    code: "BIO10",
    description: "زیست شناسی",
    grade_level: "دهم",
  },
  {
    name: "تاریخ",
    code: "HIS10",
    description: "تاریخ ایران و جهان",
    grade_level: "دهم",
  },
  {
    name: "جغرافیا",
    code: "GEO10",
    description: "جغرافیا",
    grade_level: "دهم",
  },
  {
    name: "قرآن",
    code: "QUR10",
    description: "آموزش قرآن",
    grade_level: "دهم",
  },
  { name: "ورزش", code: "PE10", description: "تربیت بدنی", grade_level: "دهم" },
  {
    name: "زبان انگلیسی",
    code: "ENG11",
    description: "زبان انگلیسی",
    grade_level: "یازدهم",
  },
  {
    name: "ریاضی",
    code: "MATH11",
    description: "ریاضیات پایه",
    grade_level: "یازدهم",
  },
  { name: "فیزیک", code: "PHY11", description: "فیزیک", grade_level: "یازدهم" },
  { name: "شیمی", code: "CHE11", description: "شیمی", grade_level: "یازدهم" },
  {
    name: "زیست",
    code: "BIO11",
    description: "زیست شناسی",
    grade_level: "یازدهم",
  },
  {
    name: "تاریخ",
    code: "HIS11",
    description: "تاریخ ایران و جهان",
    grade_level: "یازدهم",
  },
  {
    name: "جغرافیا",
    code: "GEO11",
    description: "جغرافیا",
    grade_level: "یازدهم",
  },
  {
    name: "قرآن",
    code: "QUR11",
    description: "آموزش قرآن",
    grade_level: "یازدهم",
  },
  {
    name: "ورزش",
    code: "PE11",
    description: "تربیت بدنی",
    grade_level: "یازدهم",
  },
  {
    name: "زبان انگلیسی",
    code: "ENG12",
    description: "زبان انگلیسی",
    grade_level: "دوازدهم",
  },
  {
    name: "ریاضی",
    code: "MATH12",
    description: "ریاضیات پایه",
    grade_level: "دوازدهم",
  },
  {
    name: "فیزیک",
    code: "PHY12",
    description: "فیزیک",
    grade_level: "دوازدهم",
  },
  { name: "شیمی", code: "CHE12", description: "شیمی", grade_level: "دوازدهم" },
  {
    name: "زیست",
    code: "BIO12",
    description: "زیست شناسی",
    grade_level: "دوازدهم",
  },
  {
    name: "تاریخ",
    code: "HIS12",
    description: "تاریخ ایران و جهان",
    grade_level: "دوازدهم",
  },
  {
    name: "جغرافیا",
    code: "GEO12",
    description: "جغرافیا",
    grade_level: "دوازدهم",
  },
  {
    name: "قرآن",
    code: "QUR12",
    description: "آموزش قرآن",
    grade_level: "دوازدهم",
  },
  {
    name: "ورزش",
    code: "PE12",
    description: "تربیت بدنی",
    grade_level: "دوازدهم",
  },
];

async function initializeMoESubjects() {
  try {
    const client = await pool.connect();

    // Create a special school entry for Ministry of Education
    const moeSchoolId = "00000000-0000-0000-0000-000000000000";

    // Insert Ministry of Education as a school
    try {
      await client.query(
        `
        INSERT INTO schools (id, name, address)
        VALUES ($1, $2, $3)
        ON CONFLICT (id) DO NOTHING
        `,
        [moeSchoolId, "وزارت آموزش و پرورش", "تهران، ایران"]
      );
    } catch (schoolError) {
      console.log("Ministry of Education school already exists");
    }

    // Clear any existing MoE subjects to ensure we have a clean slate
    await client.query(`DELETE FROM subjects WHERE school_id = $1`, [
      moeSchoolId,
    ]);

    console.log("Cleared existing MoE subjects, now inserting all subjects...");

    // Remove the unique constraint temporarily
    try {
      await client.query(
        `ALTER TABLE subjects DROP CONSTRAINT IF EXISTS unique_school_subject_name`
      );
    } catch (error) {
      console.log("No unique constraint to drop or error dropping it");
    }

    let insertedCount = 0;

    // Insert all MoE subjects
    for (const subject of moeSubjects) {
      try {
        await client.query(
          `
          INSERT INTO subjects (school_id, name, code, description, grade_level)
          VALUES ($1, $2, $3, $4, $5)
          `,
          [
            moeSchoolId,
            subject.name,
            subject.code,
            subject.description,
            subject.grade_level,
          ]
        );
        insertedCount++;
        console.log(
          `Inserted subject: ${subject.name} (${subject.grade_level})`
        );
      } catch (insertError) {
        console.error(
          `Error inserting subject ${subject.name}:`,
          insertError.message
        );
      }
    }

    // Recreate the unique constraint
    try {
      await client.query(`
        ALTER TABLE subjects 
        ADD CONSTRAINT unique_school_subject_name 
        UNIQUE (school_id, name)
      `);
    } catch (constraintError) {
      console.log("Error recreating unique constraint or it already exists");
    }

    console.log(`\nSummary:`);
    console.log(`- Successfully inserted: ${insertedCount} subjects`);
    console.log(`- Total in list: ${moeSubjects.length} subjects`);

    client.release();
    process.exit(0);
  } catch (error) {
    console.error("Error initializing MoE subjects:", error);
    process.exit(1);
  }
}

initializeMoESubjects();
