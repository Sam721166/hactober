import { Pool } from "pg";
import { SEED_COMPONENTS, SEED_PROJECTS, SeedProject, SeedComponent } from "./seed-data";

const connectionString =
  process.env.DATABASE_URL || "postgresql://samirande@localhost:5432/circuitdoctor";

let pool: Pool | null = null;
let isInitialized = false;

// Fallback in-memory store for demo/offline resilience
const memoryStore = {
  projects: [...SEED_PROJECTS],
  components: [...SEED_COMPONENTS],
  debugSessions: [] as any[],
  savedProjects: new Set<string>(),
};

export function getDbPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    pool.on("error", (err) => {
      console.warn("Postgres pool error:", err.message);
    });
  }
  return pool;
}

/**
 * Initializes database tables and automatically seeds initial sample data.
 */
export async function initDb() {
  if (isInitialized) return;

  try {
    const db = getDbPool();
    // Verify connection
    await db.query("SELECT 1");

    // Check if projects table has seed data
    const countRes = await db.query("SELECT COUNT(*) FROM projects");
    const count = parseInt(countRes.rows[0].count, 10);

    if (count === 0) {
      console.log("Seeding CircuitDoctor sample projects and catalogue components...");
      await seedDatabase();
    }

    isInitialized = true;
  } catch (error: any) {
    console.warn("Postgres initialization note (using resilient fallback):", error.message);
    isInitialized = true;
  }
}

/**
 * Seeds PostgreSQL tables with projects, components, circuits, and plans
 */
export async function seedDatabase() {
  const db = getDbPool();

  try {
    // 1. Seed Components
    for (const comp of SEED_COMPONENTS) {
      await db.query(
        `INSERT INTO components (id, name, slug, category, description, interfaces, specifications, approx_price_inr)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (slug) DO UPDATE SET
           name = EXCLUDED.name,
           category = EXCLUDED.category,
           description = EXCLUDED.description,
           specifications = EXCLUDED.specifications,
           approx_price_inr = EXCLUDED.approx_price_inr`,
        [
          comp.id,
          comp.name,
          comp.slug,
          comp.category,
          comp.description,
          comp.interfaces || null,
          JSON.stringify(comp.specifications),
          comp.approxPriceInr || null,
        ]
      );
    }

    // 2. Seed Projects & Related Entities
    for (const proj of SEED_PROJECTS) {
      await db.query(
        `INSERT INTO projects (id, title, slug, description, board, category, difficulty, budget_inr, is_sample, is_public)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (slug) DO UPDATE SET
           title = EXCLUDED.title,
           description = EXCLUDED.description,
           board = EXCLUDED.board,
           category = EXCLUDED.category,
           difficulty = EXCLUDED.difficulty,
           budget_inr = EXCLUDED.budget_inr`,
        [
          proj.id,
          proj.title,
          proj.slug,
          proj.description,
          proj.board,
          proj.category,
          proj.difficulty,
          proj.budgetInr,
          proj.isSample,
          proj.isPublic,
        ]
      );

      // Plan
      await db.query(
        `INSERT INTO project_plans (id, project_id, overview, problem, solution, features, hardware_requirements, wiring_instructions, build_steps, testing_guide, limitations, safety_notes, estimated_cost)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         ON CONFLICT (project_id) DO UPDATE SET
           overview = EXCLUDED.overview,
           features = EXCLUDED.features,
           wiring_instructions = EXCLUDED.wiring_instructions,
           build_steps = EXCLUDED.build_steps`,
        [
          `plan-${proj.id}`,
          proj.id,
          proj.plan.overview,
          proj.plan.problem,
          proj.plan.solution,
          JSON.stringify(proj.plan.features),
          JSON.stringify(proj.plan.hardwareRequirements),
          JSON.stringify(proj.plan.wiringInstructions),
          JSON.stringify(proj.plan.buildSteps),
          JSON.stringify(proj.plan.testingGuide),
          JSON.stringify(proj.plan.limitations),
          JSON.stringify(proj.plan.safetyNotes),
          proj.plan.estimatedCost,
        ]
      );

      // Circuit Design
      await db.query(
        `INSERT INTO circuit_designs (id, project_id, name, components_json, connections_json)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (project_id) DO UPDATE SET
           components_json = EXCLUDED.components_json,
           connections_json = EXCLUDED.connections_json`,
        [
          `circuit-${proj.id}`,
          proj.id,
          `${proj.title} Circuit`,
          JSON.stringify(proj.circuit.components),
          JSON.stringify(proj.circuit.connections),
        ]
      );

      // Firmware File
      await db.query(
        `INSERT INTO firmware_files (id, project_id, filename, language, content)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content`,
        [
          `firmware-${proj.id}`,
          proj.id,
          proj.firmware.filename,
          proj.firmware.language,
          proj.firmware.content,
        ]
      );

      // BOM Items
      for (let i = 0; i < proj.bom.length; i++) {
        const item = proj.bom[i];
        await db.query(
          `INSERT INTO project_components (id, project_id, ref, name, quantity, unit_price_inr, notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (id) DO NOTHING`,
          [
            `bom-${proj.id}-${i}`,
            proj.id,
            item.ref,
            item.name,
            item.quantity,
            item.unitPriceInr || null,
            item.notes || null,
          ]
        );
      }
    }

    console.log("Database seeded successfully with all sample projects and catalogue components.");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

// ==========================================
// Projects Repository API
// ==========================================

export async function getProjects(params?: {
  category?: string;
  board?: string;
  difficulty?: string;
  search?: string;
  isSample?: boolean;
}): Promise<any[]> {
  await initDb();
  try {
    const db = getDbPool();
    let query = `
      SELECT p.*,
        json_build_object(
          'overview', pp.overview,
          'features', pp.features,
          'wiringInstructions', pp.wiring_instructions,
          'buildSteps', pp.build_steps,
          'estimatedCost', pp.estimated_cost
        ) as plan,
        json_build_object(
          'components', cd.components_json,
          'connections', cd.connections_json
        ) as circuit
      FROM projects p
      LEFT JOIN project_plans pp ON p.id = pp.project_id
      LEFT JOIN circuit_designs cd ON p.id = cd.project_id
      WHERE 1=1
    `;
    const values: any[] = [];
    let idx = 1;

    if (params?.category && params.category !== "all") {
      query += ` AND p.category ILIKE $${idx++}`;
      values.push(`%${params.category}%`);
    }
    if (params?.board && params.board !== "all") {
      query += ` AND p.board ILIKE $${idx++}`;
      values.push(`%${params.board}%`);
    }
    if (params?.difficulty && params.difficulty !== "all") {
      query += ` AND p.difficulty = $${idx++}`;
      values.push(params.difficulty);
    }
    if (params?.isSample !== undefined) {
      query += ` AND p.is_sample = $${idx++}`;
      values.push(params.isSample);
    }
    if (params?.search) {
      query += ` AND (p.title ILIKE $${idx} OR p.description ILIKE $${idx})`;
      values.push(`%${params.search}%`);
      idx++;
    }

    query += ` ORDER BY p.is_sample DESC, p.created_at DESC`;

    const res = await db.query(query, values);
    return res.rows.map(mapProjectRow);
  } catch (error) {
    console.warn("Using memory store for getProjects:", (error as Error).message);
    let list = [...memoryStore.projects];
    if (params?.category && params.category !== "all") {
      list = list.filter((p) => p.category.toLowerCase().includes(params.category!.toLowerCase()));
    }
    if (params?.board && params.board !== "all") {
      list = list.filter((p) => p.board.toLowerCase().includes(params.board!.toLowerCase()));
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter((p) => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
    }
    return list;
  }
}

export async function getProjectById(idOrSlug: string): Promise<any | null> {
  await initDb();
  try {
    const db = getDbPool();
    const query = `
      SELECT p.*,
        row_to_json(pp.*) as plan,
        row_to_json(cd.*) as circuit
      FROM projects p
      LEFT JOIN project_plans pp ON p.id = pp.project_id
      LEFT JOIN circuit_designs cd ON p.id = cd.project_id
      WHERE p.id = $1 OR p.slug = $1
      LIMIT 1
    `;
    const res = await db.query(query, [idOrSlug]);
    if (res.rows.length === 0) return null;

    const project: any = mapProjectRow(res.rows[0]);

    // Fetch firmwares and BOM
    const fwRes = await db.query("SELECT * FROM firmware_files WHERE project_id = $1", [project.id]);
    project.firmwares = fwRes.rows.map((r) => ({
      id: r.id,
      filename: r.filename,
      language: r.language,
      content: r.content,
      extractedPins: r.extracted_pins,
    }));

    const bomRes = await db.query("SELECT * FROM project_components WHERE project_id = $1 ORDER BY ref ASC", [project.id]);
    project.bom = bomRes.rows.map((r) => ({
      id: r.id,
      ref: r.ref,
      name: r.name,
      quantity: r.quantity,
      unitPriceInr: r.unit_price_inr ? parseFloat(r.unit_price_inr) : null,
      notes: r.notes,
    }));

    return project;
  } catch (error) {
    console.warn("Using memory store for getProjectById:", (error as Error).message);
    const proj = memoryStore.projects.find((p) => p.id === idOrSlug || p.slug === idOrSlug);
    return proj || null;
  }
}

export async function createProject(data: {
  title: string;
  description: string;
  board: string;
  category?: string;
  difficulty?: string;
  budgetInr?: number;
  plan?: any;
  circuit?: any;
  firmware?: { filename: string; language: string; content: string };
  bom?: Array<{ ref: string; name: string; quantity: number; unitPriceInr?: number; notes?: string }>;
}): Promise<any> {
  await initDb();
  const id = `proj-${Date.now()}`;
  const slug = `${data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString().slice(-4)}`;

  try {
    const db = getDbPool();
    await db.query(
      `INSERT INTO projects (id, title, slug, description, board, category, difficulty, budget_inr, is_sample, is_public)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false, true)`,
      [
        id,
        data.title,
        slug,
        data.description,
        data.board,
        data.category || "Custom",
        data.difficulty || "Intermediate",
        data.budgetInr || null,
      ]
    );

    if (data.plan) {
      await db.query(
        `INSERT INTO project_plans (id, project_id, overview, problem, solution, features, hardware_requirements, wiring_instructions, build_steps, testing_guide, limitations, safety_notes, estimated_cost)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          `plan-${id}`,
          id,
          data.plan.overview || data.description,
          data.plan.problem || null,
          data.plan.solution || null,
          JSON.stringify(data.plan.features || []),
          JSON.stringify(data.plan.hardwareRequirements || []),
          JSON.stringify(data.plan.wiringInstructions || []),
          JSON.stringify(data.plan.buildSteps || []),
          JSON.stringify(data.plan.testingGuide || []),
          JSON.stringify(data.plan.limitations || []),
          JSON.stringify(data.plan.safetyNotes || []),
          data.plan.estimatedCost || null,
        ]
      );
    }

    if (data.circuit) {
      await db.query(
        `INSERT INTO circuit_designs (id, project_id, name, components_json, connections_json)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          `circuit-${id}`,
          id,
          `${data.title} Circuit`,
          JSON.stringify(data.circuit.components || []),
          JSON.stringify(data.circuit.connections || []),
        ]
      );
    }

    if (data.firmware) {
      await db.query(
        `INSERT INTO firmware_files (id, project_id, filename, language, content)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          `fw-${id}`,
          id,
          data.firmware.filename || "main.ino",
          data.firmware.language || "arduino",
          data.firmware.content || "",
        ]
      );
    }

    if (data.bom && Array.isArray(data.bom)) {
      for (let i = 0; i < data.bom.length; i++) {
        const item = data.bom[i];
        await db.query(
          `INSERT INTO project_components (id, project_id, ref, name, quantity, unit_price_inr, notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            `bom-${id}-${i}`,
            id,
            item.ref || `C${i + 1}`,
            item.name,
            item.quantity || 1,
            item.unitPriceInr || null,
            item.notes || null,
          ]
        );
      }
    }

    return await getProjectById(id);
  } catch (error) {
    console.warn("Fallback creation in memory store:", (error as Error).message);
    const newProj: any = {
      id,
      title: data.title,
      slug,
      description: data.description,
      board: data.board,
      category: data.category || "Custom",
      difficulty: data.difficulty || "Intermediate",
      budgetInr: data.budgetInr || 0,
      isSample: false,
      isPublic: true,
      plan: data.plan || {
        overview: data.description,
        features: [],
        wiringInstructions: [],
        buildSteps: [],
      },
      circuit: data.circuit || { components: [], connections: [] },
      firmware: data.firmware || { filename: "main.ino", language: "arduino", content: "" },
      bom: data.bom || [],
    };
    memoryStore.projects.unshift(newProj);
    return newProj;
  }
}

export async function saveCircuitDesign(
  projectId: string,
  circuitData: { components: any[]; connections: any[] }
) {
  await initDb();
  try {
    const db = getDbPool();
    await db.query(
      `INSERT INTO circuit_designs (id, project_id, components_json, connections_json, updated_at)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
       ON CONFLICT (project_id) DO UPDATE SET
         components_json = EXCLUDED.components_json,
         connections_json = EXCLUDED.connections_json,
         updated_at = CURRENT_TIMESTAMP`,
      [
        `circuit-${projectId}`,
        projectId,
        JSON.stringify(circuitData.components),
        JSON.stringify(circuitData.connections),
      ]
    );
    return { ok: true, projectId };
  } catch (error) {
    console.warn("Saving circuit in memory store:", (error as Error).message);
    const p = memoryStore.projects.find((pr) => pr.id === projectId);
    if (p) {
      p.circuit = circuitData;
    }
    return { ok: true, projectId };
  }
}

export async function saveFirmware(
  projectId: string,
  filename: string,
  content: string,
  extractedPins?: any[]
) {
  await initDb();
  try {
    const db = getDbPool();
    await db.query(
      `INSERT INTO firmware_files (id, project_id, filename, content, extracted_pins, updated_at)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
       ON CONFLICT (id) DO UPDATE SET
         content = EXCLUDED.content,
         extracted_pins = EXCLUDED.extracted_pins,
         updated_at = CURRENT_TIMESTAMP`,
      [
        `firmware-${projectId}`,
        projectId,
        filename,
        content,
        JSON.stringify(extractedPins || []),
      ]
    );
    return { ok: true, projectId };
  } catch (error) {
    console.warn("Saving firmware in memory store:", (error as Error).message);
    const p = memoryStore.projects.find((pr) => pr.id === projectId);
    if (p) {
      p.firmware = { filename, language: "arduino", content };
    }
    return { ok: true, projectId };
  }
}

// ==========================================
// Debug Sessions Repository API
// ==========================================

export async function createDebugSession(data: {
  projectId?: string;
  title: string;
  boardType: string;
  imageUrl?: string;
  imageFileName?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  errorLogs?: string;
  observations?: any[];
  hypotheses?: any[];
}) {
  await initDb();
  const id = `debug-${Date.now()}`;
  try {
    const db = getDbPool();
    const res = await db.query(
      `INSERT INTO debug_sessions (
         id, project_id, title, board_type, image_url, image_file_name,
         expected_behavior, actual_behavior, error_logs, observations, hypotheses, test_results, status
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'IN_PROGRESS')
       RETURNING *`,
      [
        id,
        data.projectId || null,
        data.title,
        data.boardType,
        data.imageUrl || null,
        data.imageFileName || null,
        data.expectedBehavior || null,
        data.actualBehavior || null,
        data.errorLogs || null,
        JSON.stringify(data.observations || []),
        JSON.stringify(data.hypotheses || []),
        JSON.stringify([]),
      ]
    );
    return res.rows[0];
  } catch (error) {
    console.warn("Saving debug session to memory fallback:", (error as Error).message);
    const session = {
      id,
      project_id: data.projectId,
      title: data.title,
      board_type: data.boardType,
      image_url: data.imageUrl,
      image_file_name: data.imageFileName,
      expected_behavior: data.expectedBehavior,
      actual_behavior: data.actualBehavior,
      error_logs: data.errorLogs,
      observations: data.observations || [],
      hypotheses: data.hypotheses || [],
      test_results: [],
      status: "IN_PROGRESS",
      created_at: new Date(),
    };
    memoryStore.debugSessions.unshift(session);
    return session;
  }
}

export async function updateDebugSession(
  id: string,
  data: {
    testResults?: any[];
    hypotheses?: any[];
    status?: string;
    resolvedSummary?: string;
  }
) {
  await initDb();
  try {
    const db = getDbPool();
    const sets: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (data.testResults) {
      sets.push(`test_results = $${idx++}`);
      values.push(JSON.stringify(data.testResults));
    }
    if (data.hypotheses) {
      sets.push(`hypotheses = $${idx++}`);
      values.push(JSON.stringify(data.hypotheses));
    }
    if (data.status) {
      sets.push(`status = $${idx++}`);
      values.push(data.status);
    }
    if (data.resolvedSummary) {
      sets.push(`resolved_summary = $${idx++}`);
      values.push(data.resolvedSummary);
    }

    sets.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `UPDATE debug_sessions SET ${sets.join(", ")} WHERE id = $${idx} RETURNING *`;
    const res = await db.query(query, values);
    return res.rows[0];
  } catch (error) {
    console.warn("Updating debug session in memory store:", (error as Error).message);
    const session = memoryStore.debugSessions.find((s) => s.id === id);
    if (session) {
      if (data.testResults) session.test_results = data.testResults;
      if (data.hypotheses) session.hypotheses = data.hypotheses;
      if (data.status) session.status = data.status;
      if (data.resolvedSummary) session.resolved_summary = data.resolvedSummary;
      return session;
    }
    return null;
  }
}

export async function getDebugSessions(projectId?: string) {
  await initDb();
  try {
    const db = getDbPool();
    let query = `SELECT * FROM debug_sessions`;
    const values: any[] = [];
    if (projectId) {
      query += ` WHERE project_id = $1`;
      values.push(projectId);
    }
    query += ` ORDER BY created_at DESC`;
    const res = await db.query(query, values);
    return res.rows;
  } catch (error) {
    if (projectId) {
      return memoryStore.debugSessions.filter((s) => s.project_id === projectId);
    }
    return memoryStore.debugSessions;
  }
}

export async function getDebugSessionById(id: string) {
  await initDb();
  try {
    const db = getDbPool();
    const res = await db.query(`SELECT * FROM debug_sessions WHERE id = $1 LIMIT 1`, [id]);
    return res.rows[0] || null;
  } catch (error) {
    return memoryStore.debugSessions.find((s) => s.id === id) || null;
  }
}

// ==========================================
// Components Catalogue API
// ==========================================

export async function getCatalogueComponents(params?: {
  category?: string;
  search?: string;
}) {
  await initDb();
  try {
    const db = getDbPool();
    let query = `SELECT * FROM components WHERE 1=1`;
    const values: any[] = [];
    let idx = 1;

    if (params?.category && params.category !== "all") {
      query += ` AND category ILIKE $${idx++}`;
      values.push(`%${params.category}%`);
    }
    if (params?.search) {
      query += ` AND (name ILIKE $${idx} OR description ILIKE $${idx})`;
      values.push(`%${params.search}%`);
      idx++;
    }
    query += ` ORDER BY name ASC`;
    const res = await db.query(query, values);
    return res.rows;
  } catch (error) {
    let list = [...memoryStore.components];
    if (params?.category && params.category !== "all") {
      list = list.filter((c) => c.category.toLowerCase().includes(params.category!.toLowerCase()));
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q));
    }
    return list;
  }
}

// Helpers
function mapProjectRow(r: any) {
  return {
    id: r.id,
    title: r.title,
    slug: r.slug,
    description: r.description,
    board: r.board,
    category: r.category,
    difficulty: r.difficulty,
    budgetInr: r.budget_inr,
    isSample: r.is_sample,
    isPublic: r.is_public,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    plan: r.plan
      ? typeof r.plan === "string"
        ? JSON.parse(r.plan)
        : r.plan
      : null,
    circuit: (() => {
      const raw = r.circuit
        ? typeof r.circuit === "string"
          ? JSON.parse(r.circuit)
          : r.circuit
        : null;
      if (!raw) return { components: [], connections: [] };
      return {
        components: raw.components || raw.components_json || [],
        connections: raw.connections || raw.connections_json || [],
      };
    })(),
  };
}
