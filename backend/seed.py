"""
Realistic Educational Dataset Seeder for SStudizer Database.
Populates standard JEE / NEET / MHT-CET subjects, chapters, questions with LaTeX,
and mock tests with strict question_order sequencing.
"""
import uuid
from datetime import datetime, timezone, timedelta
from app.config import DATABASE_URL
from app.database import Base, engine, SessionLocal
from app.models import Subject, Chapter, Question, ChapterQuestionInventory, Test, TestQuestion, AuditLog

def now_utc():
    return datetime.now(timezone.utc)

def seed_database():
    # STRICT SAFETY GUARD:
    if not DATABASE_URL.startswith("sqlite"):
        print("=" * 70)
        print("CRITICAL SAFETY ABORT:")
        print("seed.py is ONLY designed for the local SQLite development database.")
        print("It is permanently BLOCKED from running on Supabase / PostgreSQL!")
        print("Your production database has NOT been touched.")
        print("=" * 70)
        return

    print("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Clear existing records safely if re-running
    db.query(AuditLog).delete()
    db.query(TestQuestion).delete()
    db.query(Test).delete()
    db.query(ChapterQuestionInventory).delete()
    db.query(Question).delete()
    db.query(Chapter).delete()
    db.query(Subject).delete()
    db.commit()

    print("Seeding subjects...")
    subjects_data = [
        {"name": "physics", "display_name": "Physics", "display_order": 1},
        {"name": "chemistry", "display_name": "Chemistry", "display_order": 2},
        {"name": "mathematics", "display_name": "Mathematics", "display_order": 3},
        {"name": "biology", "display_name": "Biology", "display_order": 4},
    ]
    subject_map = {}
    for s_item in subjects_data:
        s = Subject(
            id=str(uuid.uuid4()),
            name=s_item["name"],
            display_name=s_item["display_name"],
            display_order=s_item["display_order"]
        )
        db.add(s)
        subject_map[s_item["name"]] = s
    db.commit()

    print("Seeding chapters...")
    chapters_data = [
        # Physics
        {"subject": "physics", "name": "electrostatics", "display_name": "Electrostatics & Capacitance", "grade": "12th"},
        {"subject": "physics", "name": "current_electricity", "display_name": "Current Electricity", "grade": "12th"},
        {"subject": "physics", "name": "kinematics", "display_name": "Kinematics & Laws of Motion", "grade": "11th"},
        {"subject": "physics", "name": "rotational_motion", "display_name": "Rotational Motion", "grade": "11th"},
        {"subject": "physics", "name": "modern_physics", "display_name": "Modern Physics & Atoms", "grade": "12th"},
        # Chemistry
        {"subject": "chemistry", "name": "chemical_bonding", "display_name": "Chemical Bonding & Molecular Structure", "grade": "11th"},
        {"subject": "chemistry", "name": "thermodynamics", "display_name": "Chemical Thermodynamics", "grade": "11th"},
        {"subject": "chemistry", "name": "coordination_compounds", "display_name": "Coordination Compounds", "grade": "12th"},
        {"subject": "chemistry", "name": "organic_reaction_mechanisms", "display_name": "Organic Reaction Mechanisms", "grade": "12th"},
        # Mathematics
        {"subject": "mathematics", "name": "calculus_derivatives", "display_name": "Differential Calculus", "grade": "12th"},
        {"subject": "mathematics", "name": "integral_calculus", "display_name": "Integral Calculus & Areas", "grade": "12th"},
        {"subject": "mathematics", "name": "matrices_determinants", "display_name": "Matrices & Determinants", "grade": "12th"},
        {"subject": "mathematics", "name": "coordinate_geometry", "display_name": "Coordinate Geometry & Conic Sections", "grade": "11th"},
        # Biology
        {"subject": "biology", "name": "genetics_evolution", "display_name": "Principles of Inheritance & Genetics", "grade": "12th"},
        {"subject": "biology", "name": "cell_biology", "display_name": "Cell: The Unit of Life", "grade": "11th"},
        {"subject": "biology", "name": "human_physiology", "display_name": "Human Physiology & Neural Control", "grade": "11th"},
    ]
    chapter_map = {}
    for ch_item in chapters_data:
        ch = Chapter(
            id=str(uuid.uuid4()),
            subject_id=subject_map[ch_item["subject"]].id,
            name=ch_item["name"],
            display_name=ch_item["display_name"],
            grade=ch_item["grade"]
        )
        db.add(ch)
        chapter_map[ch_item["name"]] = ch
    db.commit()

    print("Seeding questions with LaTeX formulas and real options...")
    questions_to_create = [
        # --- Physics: Electrostatics ---
        {
            "chapter": "electrostatics",
            "difficulty": "easy",
            "type": "single_correct",
            "content": "Two point charges $q_1 = +2\\,\\mu\\text{C}$ and $q_2 = -2\\,\\mu\\text{C}$ are separated by a distance $r = 0.1\\,\\text{m}$ in vacuum. What is the magnitude of the electrostatic force between them?",
            "options": [
                {"id": "A", "text": "3.6 N attractive"},
                {"id": "B", "text": "3.6 N repulsive"},
                {"id": "C", "text": "1.8 N attractive"},
                {"id": "D", "text": "7.2 N attractive"}
            ],
            "correct_answer": "A",
            "explanation": "Coulomb's Law states: $F = \\frac{1}{4\\pi\\varepsilon_0} \\frac{|q_1 q_2|}{r^2}$. With $k = 9\\times 10^9\\,\\text{N m}^2/\\text{C}^2$, $F = 9\\times 10^9 \\times \\frac{4\\times 10^{-12}}{0.01} = 3.6\\,\\text{N}$. Because charges have opposite signs, the force is attractive."
        },
        {
            "chapter": "electrostatics",
            "difficulty": "medium",
            "type": "single_correct",
            "content": "A parallel plate capacitor with air between the plates has a capacitance of $8\\,\\text{pF}$. If a dielectric slab of dielectric constant $K = 6$ is inserted filling the space completely, and the distance between plates is halved, the new capacitance is:",
            "options": [
                {"id": "A", "text": "48 pF"},
                {"id": "B", "text": "96 pF"},
                {"id": "C", "text": "24 pF"},
                {"id": "D", "text": "16 pF"}
            ],
            "correct_answer": "B",
            "explanation": "Initial capacitance $C_0 = \\frac{\\varepsilon_0 A}{d} = 8\\,\\text{pF}$. With dielectric $K$ and new distance $d' = d/2$, $C' = \\frac{K \\varepsilon_0 A}{d/2} = 2K C_0 = 2(6)(8\\,\\text{pF}) = 96\\,\\text{pF}$."
        },
        {
            "chapter": "electrostatics",
            "difficulty": "hard",
            "type": "multi_correct",
            "content": "An electric dipole of dipole moment $\\vec{p} = p\\hat{i}$ is placed in a non-uniform electric field $\\vec{E} = \\alpha x \\hat{i}$. Which of the following statements are correct?",
            "options": [
                {"id": "A", "text": "The net torque acting on the dipole is zero."},
                {"id": "B", "text": "The net force on the dipole is directed along positive x-axis and has magnitude $p\\alpha$."},
                {"id": "C", "text": "The potential energy of the dipole depends on its coordinate $x$."},
                {"id": "D", "text": "The dipole will undergo pure rotational motion without translation."}
            ],
            "correct_answer": ["A", "B", "C"],
            "explanation": "Since $\\vec{p}$ is parallel to $\\vec{E}$, torque $\\vec{\\tau} = \\vec{p} \\times \\vec{E} = 0$. The force on dipole in non-uniform field is $F_x = p \\frac{dE_x}{dx} = p\\alpha > 0$. Potential energy $U = -\\vec{p}\\cdot\\vec{E} = -p\\alpha x$."
        },
        # --- Physics: Current Electricity ---
        {
            "chapter": "current_electricity",
            "difficulty": "easy",
            "type": "single_correct",
            "content": "A wire of resistance $R$ is stretched uniformly to twice its original length. Its new resistance will be:",
            "options": [
                {"id": "A", "text": "$2R$"},
                {"id": "B", "text": "$4R$"},
                {"id": "C", "text": "$R/2$"},
                {"id": "D", "text": "$R/4$"}
            ],
            "correct_answer": "B",
            "explanation": "Volume $V = A L$ is constant. When length doubles ($L' = 2L$), area halves ($A' = A/2$). Resistance $R' = \\rho \\frac{L'}{A'} = \\rho \\frac{2L}{A/2} = 4R$."
        },
        {
            "chapter": "current_electricity",
            "difficulty": "medium",
            "type": "numeric",
            "content": "In a balanced Wheatstone bridge, the four arms have resistances $P = 10\\,\\Omega$, $Q = 20\\,\\Omega$, $R = 15\\,\\Omega$, and unknown resistance $S\\,\\Omega$. What is the value of $S$ in ohms?",
            "options": None,
            "correct_answer": "30",
            "explanation": "For a balanced bridge, $\\frac{P}{Q} = \\frac{R}{S} \\implies S = R \\cdot \\frac{Q}{P} = 15 \\times \\frac{20}{10} = 30\\,\\Omega$."
        },
        # --- Chemistry: Chemical Bonding ---
        {
            "chapter": "chemical_bonding",
            "difficulty": "easy",
            "type": "single_correct",
            "content": "Which of the following molecules has a square planar geometry according to VSEPR theory?",
            "options": [
                {"id": "A", "text": "$\\text{SF}_4$"},
                {"id": "B", "text": "$\\text{XeF}_4$"},
                {"id": "C", "text": "$\\text{CCl}_4$"},
                {"id": "D", "text": "$\\text{BF}_4^-$"}
            ],
            "correct_answer": "B",
            "explanation": "$\\text{XeF}_4$ has 4 bond pairs and 2 lone pairs on Xenon ($sp^3d^2$ hybridization, octahedral electron geometry, square planar molecular geometry)."
        },
        {
            "chapter": "chemical_bonding",
            "difficulty": "medium",
            "type": "single_correct",
            "content": "According to Molecular Orbital Theory (MOT), the bond order of $\\text{O}_2^+$ is:",
            "options": [
                {"id": "A", "text": "2.0"},
                {"id": "B", "text": "2.5"},
                {"id": "C", "text": "3.0"},
                {"id": "D", "text": "1.5"}
            ],
            "correct_answer": "B",
            "explanation": "$\\text{O}_2$ has 16 electrons and bond order 2.0. In $\\text{O}_2^+$ (15 electrons), one electron is removed from the antibonding $\\pi^*2p$ orbital. Bond order = $(10 - 5)/2 = 2.5$."
        },
        # --- Chemistry: Thermodynamics ---
        {
            "chapter": "thermodynamics",
            "difficulty": "medium",
            "type": "single_correct",
            "content": "For a reaction to be spontaneous at all temperatures, the thermodynamic criteria are:",
            "options": [
                {"id": "A", "text": "$\\Delta H < 0$ and $\\Delta S > 0$"},
                {"id": "B", "text": "$\\Delta H > 0$ and $\\Delta S > 0$"},
                {"id": "C", "text": "$\\Delta H < 0$ and $\\Delta S < 0$"},
                {"id": "D", "text": "$\\Delta H > 0$ and $\\Delta S < 0$"}
            ],
            "correct_answer": "A",
            "explanation": "Gibbs free energy change $\\Delta G = \\Delta H - T\\Delta S$. When $\\Delta H < 0$ (exothermic) and $\\Delta S > 0$ (entropy increases), $\\Delta G$ is strictly negative at all temperatures."
        },
        # --- Mathematics: Differential Calculus ---
        {
            "chapter": "calculus_derivatives",
            "difficulty": "easy",
            "type": "single_correct",
            "content": "Evaluate the limit: $\\lim_{x \\to 0} \\frac{\\sin(5x)}{\\tan(2x)}$.",
            "options": [
                {"id": "A", "text": "5/2"},
                {"id": "B", "text": "2/5"},
                {"id": "C", "text": "1"},
                {"id": "D", "text": "0"}
            ],
            "correct_answer": "A",
            "explanation": "$\\lim_{x \\to 0} \\frac{\\sin(5x)}{\\tan(2x)} = \\lim_{x \\to 0} \\frac{\\frac{\\sin(5x)}{5x} \\times 5x}{\\frac{\\tan(2x)}{2x} \\times 2x} = \\frac{1 \\times 5}{1 \\times 2} = \\frac{5}{2}$."
        },
        {
            "chapter": "calculus_derivatives",
            "difficulty": "medium",
            "type": "single_correct",
            "content": "The derivative of $f(x) = x^{\\sin(x)}$ with respect to $x$ for $x > 0$ is:",
            "options": [
                {"id": "A", "text": "$x^{\\sin(x)} [\\cos(x)\\ln(x) + \\frac{\\sin(x)}{x}]$"},
                {"id": "B", "text": "$x^{\\sin(x)} [\\sin(x)\\ln(x) + \\frac{\\cos(x)}{x}]$"},
                {"id": "C", "text": "$\\sin(x) x^{\\sin(x)-1}$"},
                {"id": "D", "text": "$x^{\\sin(x)} \\cos(x)$"}
            ],
            "correct_answer": "A",
            "explanation": "Let $y = x^{\\sin(x)}$. Taking natural log: $\\ln y = \\sin(x)\\ln(x)$. Differentiating implicitly: $\\frac{1}{y} y' = \\cos(x)\\ln(x) + \\frac{\\sin(x)}{x}$. Multiply by $y$ to get option A."
        },
        {
            "chapter": "integral_calculus",
            "difficulty": "hard",
            "type": "single_correct",
            "content": "Compute the definite integral: $I = \\int_{0}^{\\pi/2} \\frac{\\sqrt{\\sin x}}{\\sqrt{\\sin x} + \\sqrt{\\cos x}}\\,dx$.",
            "options": [
                {"id": "A", "text": "$\\pi/4$"},
                {"id": "B", "text": "$\\pi/2$"},
                {"id": "C", "text": "$\\pi$"},
                {"id": "D", "text": "$1$"}
            ],
            "correct_answer": "A",
            "explanation": "Using King's property $\\int_a^b f(x)dx = \\int_a^b f(a+b-x)dx$, $I = \\int_0^{\\pi/2} \\frac{\\sqrt{\\cos x}}{\\sqrt{\\cos x} + \\sqrt{\\sin x}}\\,dx$. Adding the two forms yields $2I = \\int_0^{\\pi/2} 1\\,dx = \\pi/2 \\implies I = \\pi/4$."
        },
        # --- Biology: Genetics & Evolution ---
        {
            "chapter": "genetics_evolution",
            "difficulty": "easy",
            "type": "single_correct",
            "content": "In a monohybrid cross between a homozygous tall pea plant ($TT$) and a homozygous dwarf pea plant ($tt$), the phenotype ratio in the $F_2$ generation is:",
            "options": [
                {"id": "A", "text": "3 Tall : 1 Dwarf"},
                {"id": "B", "text": "1 Tall : 2 Medium : 1 Dwarf"},
                {"id": "C", "text": "1 Tall : 1 Dwarf"},
                {"id": "D", "text": "4 Tall : 0 Dwarf"}
            ],
            "correct_answer": "A",
            "explanation": "Mendel's law of segregation gives genotype ratio $1 TT : 2 Tt : 1 tt$. Since $T$ is completely dominant over $t$, the phenotypic ratio is 3 Tall : 1 Dwarf."
        },
        {
            "chapter": "cell_biology",
            "difficulty": "medium",
            "type": "single_correct",
            "content": "Which organelle is responsible for the formation of acrosome in mammalian sperm?",
            "options": [
                {"id": "A", "text": "Golgi apparatus"},
                {"id": "B", "text": "Mitochondria"},
                {"id": "C", "text": "Centrosome"},
                {"id": "D", "text": "Lysosome"}
            ],
            "correct_answer": "A",
            "explanation": "The acrosome is a specialized cap-like vesicle derived from the Golgi apparatus during spermiogenesis containing hyaluronidase and acrosin enzymes."
        },
        # --- Data Quality Sample Case (Intentional warning case for diagnostics demonstration) ---
        {
            "chapter": "modern_physics",
            "difficulty": "medium",
            "type": "single_correct",
            "content": "In the photoelectric effect, the stopping potential $V_0$ is linearly related to the frequency $\\nu$ of incident radiation. (Notice: Sample uploaded record to test validation)",
            "options": [
                {"id": "A", "text": "Linear slope $h/e$"}
                # Intentionally only 1 option provided to demonstrate diagnostic alert!
            ],
            "correct_answer": "A",
            "explanation": "Einstein's photoelectric equation: $eV_0 = h\\nu - \\phi \\implies V_0 = \\frac{h}{e}\\nu - \\frac{\\phi}{e}$."
        }
    ]

    created_questions = []
    for q_spec in questions_to_create:
        ch = chapter_map.get(q_spec["chapter"])
        if not ch:
            continue
        q = Question(
            id=str(uuid.uuid4()),
            external_uid=str(uuid.uuid4()),
            chapter_id=ch.id,
            difficulty=q_spec["difficulty"],
            question_type=q_spec["type"],
            content=q_spec["content"],
            options=q_spec["options"],
            correct_answer=q_spec["correct_answer"],
            explanation=q_spec["explanation"],
            is_active=True,
            source_type="dataset"
        )
        db.add(q)
        created_questions.append(q)
    db.commit()

    print("Updating chapter question inventory counters...")
    for ch_name, ch_obj in chapter_map.items():
        for diff in ("easy", "medium", "hard"):
            cnt = db.query(Question).filter(Question.chapter_id == ch_obj.id, Question.difficulty == diff).count()
            inv = ChapterQuestionInventory(
                chapter_id=ch_obj.id,
                difficulty=diff,
                active_count=cnt,
                updated_at=now_utc()
            )
            db.add(inv)
    db.commit()

    print("Seeding sample tests...")
    # Test 1: JEE Advanced Full Mock Test 1
    t1 = Test(
        id=str(uuid.uuid4()),
        title="JEE Advanced Full Mock Test 1",
        description="Comprehensive 3-hour mock test containing Physics, Chemistry, and Mathematics questions.",
        duration_minutes=180,
        availability_start_time=now_utc() - timedelta(days=2),
        availability_end_time=now_utc() + timedelta(days=30),
        exam_type="jee",
        mode="online",
        status="published"
    )
    db.add(t1)

    # Test 2: NEET 2026 Biology Booster Sprint
    t2 = Test(
        id=str(uuid.uuid4()),
        title="NEET 2026 Biology Booster Sprint",
        description="Focused practice test on Cell Biology, Genetics, and Physiology.",
        duration_minutes=60,
        availability_start_time=now_utc() - timedelta(days=5),
        availability_end_time=now_utc() + timedelta(days=25),
        exam_type="neet",
        mode="online",
        status="published"
    )
    db.add(t2)

    # Test 3: MHT-CET PCM Demo Exam
    t3 = Test(
        id=str(uuid.uuid4()),
        title="MHT-CET PCM Demo Exam (Draft)",
        description="Draft test for upcoming Maharashtra State CET students.",
        duration_minutes=90,
        availability_start_time=now_utc() + timedelta(days=1),
        availability_end_time=now_utc() + timedelta(days=15),
        exam_type="mhtcet_pcm",
        mode="offline",
        status="draft"
    )
    db.add(t3)
    db.commit()

    print("Assigning test questions with strict question_order sequencing...")
    # Assign physics, chemistry, math questions to Test 1 in order: 1, 2, 3, 4, 5...
    order_idx = 1
    for q in created_questions[:8]:
        tq = TestQuestion(
            id=str(uuid.uuid4()),
            test_id=t1.id,
            question_id=q.id,
            question_order=order_idx
        )
        db.add(tq)
        order_idx += 1

    # Assign biology and chemistry questions to Test 2
    order_idx2 = 1
    for q in created_questions[6:13]:
        tq = TestQuestion(
            id=str(uuid.uuid4()),
            test_id=t2.id,
            question_id=q.id,
            question_order=order_idx2
        )
        db.add(tq)
        order_idx2 += 1

    # Assign a couple questions to Test 3
    order_idx3 = 1
    for q in created_questions[1:5]:
        tq = TestQuestion(
            id=str(uuid.uuid4()),
            test_id=t3.id,
            question_id=q.id,
            question_order=order_idx3
        )
        db.add(tq)
        order_idx3 += 1

    db.commit()
    print("Database seeding completed successfully!")
    db.close()

if __name__ == "__main__":
    seed_database()
