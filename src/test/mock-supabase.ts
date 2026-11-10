/**
 * High-fidelity, self-contained in-memory mock of the Supabase Client.
 * Faithfully mirrors Auth admin methods, PostgREST query builder chaining,
 * RLS/profiles/students relationships, and Storage bucket operations for automated testing.
 */

export interface MockUser {
  id: string;
  email: string;
  password?: string | undefined;
  email_confirmed_at: string | null;
  user_metadata: Record<string, any>;
  created_at: string;
}

export interface MockProfile {
  id: string;
  email?: string | undefined;
  full_name?: string | undefined;
  college?: string | undefined;
  branch?: string | undefined;
  graduation_year?: number | null | undefined;
  role: "student" | "admin";
  created_at?: string | undefined;
  resume_path?: string | null | undefined;
}

export interface MockStudent {
  id: string;
  user_id: string;
  full_name: string;
  team_code: string;
  college: string;
  mobile?: string;
  course_branch?: string;
  graduation_year?: number | null;
  resume_url?: string | null;
  skills?: string[];
  created_at?: string;
}

export interface MockApplication {
  id: string;
  student_id: string;
  internship_id: string;
  status: string;
  created_at: string;
  resume_url?: string | null;
  video_url?: string | null;
  skills?: string | null;
  portfolio_url?: string | null;
  availability?: string | null;
  student_name?: string | null;
  student_email?: string | null;
  student_phone?: string | null;
  college?: string | null;
  course_branch?: string | null;
  cnf_number?: string | null;
  role_title?: string | null;
  answers?: Record<string, any> | null;
}

class MockDatabase {
  users = new Map<string, MockUser>();
  profiles = new Map<string, MockProfile>();
  students = new Map<string, MockStudent>();
  applications = new Map<string, MockApplication>();
  storageFiles = new Map<string, { name: string; id: string; updated_at: string }[]>();

  constructor() {
    this.seedBaseline();
  }

  seedBaseline() {
    this.users.clear();
    this.profiles.clear();
    this.students.clear();
    this.applications.clear();
    this.storageFiles.clear();

    // 1. Seed Admin user (EQUINOXCIE)
    const adminId = "293f2877-1148-45a4-825e-2c4e6efa3e5b";
    this.users.set(adminId, {
      id: adminId,
      email: "equinoxcie@admin.equinox.internal",
      password: "EQUINOXCIE",
      email_confirmed_at: "2026-10-25T10:00:00Z",
      user_metadata: { role: "admin", full_name: "CIE Lead Administrator" },
      created_at: "2026-10-25T10:00:00Z",
    });

    this.profiles.set(adminId, {
      id: adminId,
      email: "equinoxcie@admin.equinox.internal",
      role: "admin",
      full_name: "CIE Lead Administrator",
      college: "MLR Institute of Technology",
      created_at: "2026-10-25T10:00:00Z",
    });

    // 2. Seed active registered student (Chirumamilla Hemanth Chowdary)
    const studentUserId = "960505b6-6bb1-4f40-b385-485ffbfde7e8";
    this.users.set(studentUserId, {
      id: studentUserId,
      email: "chhemanth.dev@gmail.com",
      password: "CNF-8A5CE7",
      email_confirmed_at: "2026-10-26T12:00:00Z",
      user_metadata: {
        role: "student",
        full_name: "CHIRUMAMILLA HEMANTH CHOWDARY",
        team_code: "CNF-8A5CE7",
        cnf_number: "CNF-8A5CE7",
      },
      created_at: "2026-10-26T12:00:00Z",
    });

    this.profiles.set(studentUserId, {
      id: studentUserId,
      email: "chhemanth.dev@gmail.com",
      role: "student",
      full_name: "CHIRUMAMILLA HEMANTH CHOWDARY",
      college: "MLR Institute of Technology",
      branch: "Computer Science and Engineering",
      created_at: "2026-10-26T12:00:00Z",
    });

    this.students.set("s-hemanth", {
      id: "s-hemanth",
      user_id: studentUserId,
      full_name: "CHIRUMAMILLA HEMANTH CHOWDARY",
      team_code: "CNF-8A5CE7",
      college: "MLR Institute of Technology",
      mobile: "9876543210",
      course_branch: "Computer Science and Engineering",
      graduation_year: 2026,
      resume_url: `${studentUserId}/d0000004-1793515128162-CNF-8A5CE7_CHIRUMAMILLA_HEMANTH_CHOWDARY.docx`,
      created_at: "2026-10-26T12:00:00Z",
    });

    // 3. Seed 3 Applications for Hemanth
    const app1Id = "d083ca1d-68c9-4463-813f-9262807b91c4";
    this.applications.set(app1Id, {
      id: app1Id,
      student_id: studentUserId,
      internship_id: "d0000004-0000-0000-0000-000000000002",
      status: "submitted",
      created_at: "2026-10-28T09:30:00Z",
      resume_url: `${studentUserId}/d0000004-1793515128162-CNF-8A5CE7_CHIRUMAMILLA_HEMANTH_CHOWDARY.docx`,
      video_url: "https://drive.google.com/file/d/1FGXYyrz4YsBLKCWbgBp58fv76XZ-4ZW1/view?usp=drive_link",
      portfolio_url: "https://github.com/chhemanth-dev/foodguard-io",
      skills: "React, Next.js, TypeScript, Tailwind",
      availability: "Immediate",
    });

    const app2Id = "87047ec0-5e13-4f56-bebd-ee01a9edb934";
    this.applications.set(app2Id, {
      id: app2Id,
      student_id: studentUserId,
      internship_id: "d0000002-0000-0000-0000-000000000002",
      status: "submitted",
      created_at: "2026-10-28T10:15:00Z",
      resume_url: `${studentUserId}/d0000002-1793514970905-CNF-8A5CE7_CHIRUMAMILLA_HEMANTH_CHOWDARY.docx`,
      video_url: "https://drive.google.com/file/d/1FGXYyrz4YsBLKCWbgBp58fv76XZ-4ZW1/view?usp=drive_link",
      portfolio_url: "https://github.com/chhemanth-dev/light-native",
      skills: "React Native, Mobile Architecture",
      availability: "Immediate",
    });

    const app3Id = "9f59075c-8a69-4bc1-b353-0d40762f286f";
    this.applications.set(app3Id, {
      id: app3Id,
      student_id: studentUserId,
      internship_id: "d0000002-0000-0000-0000-000000000001",
      status: "submitted",
      created_at: "2026-10-28T10:20:00Z",
      resume_url: `${studentUserId}/d0000002-1793514854773-CNF-8A5CE7_CHIRUMAMILLA_HEMANTH_CHOWDARY.docx`,
      video_url: "https://drive.google.com/file/d/1FGXYyrz4YsBLKCWbgBp58fv76XZ-4ZW1/view?usp=drive_link",
      portfolio_url: "https://github.com/chhemanth-dev/light-native",
      skills: "iOS / Android, Flutter, Dart",
      availability: "Immediate",
    });

    // 4. Seed Storage folder & files
    this.storageFiles.set(studentUserId, [
      {
        name: "d0000004-1793515128162-CNF-8A5CE7_CHIRUMAMILLA_HEMANTH_CHOWDARY.docx",
        id: "f1",
        updated_at: "2026-10-28T09:30:00Z",
      },
      {
        name: "d0000002-1793514970905-CNF-8A5CE7_CHIRUMAMILLA_HEMANTH_CHOWDARY.docx",
        id: "f2",
        updated_at: "2026-10-28T10:15:00Z",
      },
      {
        name: "d0000002-1793514854773-CNF-8A5CE7_CHIRUMAMILLA_HEMANTH_CHOWDARY.docx",
        id: "f3",
        updated_at: "2026-10-28T10:20:00Z",
      },
    ]);
  }
}

export const sharedMockDb = new MockDatabase();

class MockQueryBuilder {
  private db: MockDatabase;
  private table: string;
  private action: "select" | "insert" | "update" | "upsert" | "delete" = "select";
  private payload: any = null;
  private filters: Array<(row: any) => boolean> = [];
  private orderCol: string | null = null;
  private orderAsc = true;
  private limitCount: number | null = null;

  constructor(db: MockDatabase, table: string) {
    this.db = db;
    this.table = table;
  }

  select(_columns = "*", _options?: { count?: string }) {
    this.action = "select";
    return this;
  }

  insert(data: any) {
    this.action = "insert";
    this.payload = data;
    return this;
  }

  update(data: any) {
    this.action = "update";
    this.payload = data;
    return this;
  }

  upsert(data: any, _options?: { onConflict?: string }) {
    this.action = "upsert";
    this.payload = data;
    return this;
  }

  delete() {
    this.action = "delete";
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push((row) => String(row[column] ?? "").toLowerCase() === String(value ?? "").toLowerCase());
    return this;
  }

  neq(column: string, value: any) {
    this.filters.push((row) => String(row[column] ?? "") !== String(value ?? ""));
    return this;
  }

  ilike(column: string, value: string) {
    const pattern = value.replace(/%/g, ".*").toLowerCase();
    const regex = new RegExp(`^${pattern}$`, "i");
    this.filters.push((row) => regex.test(String(row[column] ?? "")));
    return this;
  }

  in(column: string, values: any[]) {
    const valSet = new Set(values.map((v) => String(v).toLowerCase()));
    this.filters.push((row) => valSet.has(String(row[column] ?? "").toLowerCase()));
    return this;
  }

  or(condition: string) {
    this.filters.push((row) => {
      if (condition.includes("user_id.in") || condition.includes("id.in")) {
        const matches = condition.match(/\((.*?)\)/g);
        if (matches) {
          const ids = matches
            .flatMap((m) => m.replace(/[()]/g, "").split(","))
            .map((s) => s.trim().toLowerCase());
          return ids.includes(String(row.user_id ?? "").toLowerCase()) || ids.includes(String(row.id ?? "").toLowerCase());
        }
      }
      const parts = condition.split(",");
      return parts.some((part) => {
        const segs = part.trim().split(".");
        if (segs.length < 3) return false;
        const col = segs[0];
        const op = segs[1];
        const val = segs.slice(2).join(".");
        if (!col || !op) return false;
        const rowVal = String((row as Record<string, any>)[col] ?? "").toLowerCase();
        const targetVal = String(val).toLowerCase();
        if (op === "eq" || op === "ilike") {
          return rowVal === targetVal;
        }
        return false;
      });
    });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orderCol = column;
    this.orderAsc = options?.ascending !== false;
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  private getTableMap(): Map<string, any> {
    if (this.table === "profiles") return this.db.profiles;
    if (this.table === "students") return this.db.students;
    if (this.table === "applications") return this.db.applications;
    return new Map();
  }

  private execute() {
    const map = this.getTableMap();

    if (this.action === "insert") {
      const items = Array.isArray(this.payload) ? this.payload : [this.payload];
      const inserted: any[] = [];
      for (const item of items) {
        const id = item.id || item.user_id || `rec_${Date.now()}_${Math.random()}`;
        const row = { id, created_at: new Date().toISOString(), ...item };
        map.set(id, row);
        inserted.push(row);
      }
      return { data: Array.isArray(this.payload) ? inserted : inserted[0], error: null };
    }

    if (this.action === "upsert") {
      const item = this.payload;
      let existingKey: string | null = null;
      for (const [key, row] of map.entries()) {
        if (item.id && row.id === item.id) {
          existingKey = key;
          break;
        }
        if (item.user_id && row.user_id === item.user_id) {
          existingKey = key;
          break;
        }
        if (item.email && row.email && row.email.toLowerCase() === item.email.toLowerCase()) {
          existingKey = key;
          break;
        }
      }
      const key = existingKey || item.id || item.user_id || `rec_${Date.now()}`;
      const existing = map.get(key) || {};
      const updated = { ...existing, ...item, id: key };
      map.set(key, updated);
      return { data: updated, error: null };
    }

    if (this.action === "delete") {
      let deletedCount = 0;
      for (const [key, row] of Array.from(map.entries())) {
        if (this.filters.every((f) => f(row))) {
          map.delete(key);
          deletedCount++;
        }
      }
      return { data: null, error: null, count: deletedCount };
    }

    if (this.action === "update") {
      let updatedRow: any = null;
      for (const [key, row] of map.entries()) {
        if (this.filters.every((f) => f(row))) {
          const updated = { ...row, ...this.payload };
          map.set(key, updated);
          updatedRow = updated;
        }
      }
      return { data: updatedRow, error: null };
    }

    // Default: select
    let rows = Array.from(map.values()).filter((row) => this.filters.every((f) => f(row)));

    if (this.orderCol) {
      const col = this.orderCol;
      const asc = this.orderAsc;
      rows.sort((a, b) => {
        const valA = a[col] ?? "";
        const valB = b[col] ?? "";
        if (valA < valB) return asc ? -1 : 1;
        if (valA > valB) return asc ? 1 : -1;
        return 0;
      });
    }

    if (this.limitCount !== null) {
      rows = rows.slice(0, this.limitCount);
    }

    return { data: rows, error: null, count: rows.length };
  }

  async single() {
    const res = this.execute();
    const rows = Array.isArray(res.data) ? res.data : [res.data];
    if (rows.length === 0 || !rows[0]) {
      return { data: null, error: { message: "JSON object requested, multiple (or no) rows returned", code: "PGRST116" } };
    }
    return { data: rows[0], error: null };
  }

  async maybeSingle() {
    const res = this.execute();
    const rows = Array.isArray(res.data) ? res.data : [res.data];
    return { data: rows[0] || null, error: null };
  }

  then<TResult1 = any, TResult2 = never>(
    onfulfilled?: ((value: any) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    const result = this.execute();
    return Promise.resolve(result).then(onfulfilled, onrejected);
  }
}

export function createMockSupabaseClient(_url?: string, _key?: string, options?: any) {
  const db = sharedMockDb;

  return {
    from: (table: string) => new MockQueryBuilder(db, table),

    rpc: async (functionName: string, _params?: any) => {
      if (functionName === "check_auth_rate_limit") {
        return { data: true, error: null };
      }
      if (functionName === "reset_auth_rate_limit") {
        return { data: null, error: null };
      }
      return { data: null, error: null };
    },

    auth: {
      admin: {
        listUsers: async (_params?: { perPage?: number }) => {
          return {
            data: { users: Array.from(db.users.values()) },
            error: null,
          };
        },

        getUserById: async (userId: string) => {
          const user = db.users.get(userId);
          if (!user) {
            return { data: { user: null }, error: { message: "User not found" } };
          }
          return { data: { user }, error: null };
        },

        createUser: async (payload: {
          email: string;
          password?: string;
          email_confirm?: boolean;
          user_metadata?: Record<string, any>;
        }) => {
          const cleanEmail = payload.email.trim().toLowerCase();
          const existing = Array.from(db.users.values()).find((u) => u.email === cleanEmail);
          if (existing) {
            return {
              data: { user: null },
              error: { message: "User already registered" },
            };
          }

          const id = crypto.randomUUID();
          const newUser: MockUser = {
            id,
            email: cleanEmail,
            password: payload.password,
            email_confirmed_at: payload.email_confirm ? new Date().toISOString() : null,
            user_metadata: payload.user_metadata || {},
            created_at: new Date().toISOString(),
          };

          db.users.set(id, newUser);
          return { data: { user: newUser }, error: null };
        },

        updateUserById: async (userId: string, updates: any) => {
          const user = db.users.get(userId);
          if (!user) {
            return { data: { user: null }, error: { message: "User not found" } };
          }

          if (updates.password) user.password = updates.password;
          if (updates.email) user.email = updates.email.toLowerCase();
          if (updates.email_confirm) user.email_confirmed_at = new Date().toISOString();
          if (updates.user_metadata) {
            user.user_metadata = { ...user.user_metadata, ...updates.user_metadata };
          }

          return { data: { user }, error: null };
        },

        deleteUser: async (userId: string) => {
          db.users.delete(userId);
          return { data: { user: null }, error: null };
        },
      },

      signInWithPassword: async (credentials: { email: string; password?: string }) => {
        const cleanEmail = (credentials.email || "").trim().toLowerCase();
        const user = Array.from(db.users.values()).find((u) => u.email === cleanEmail);

        if (!user || user.password !== credentials.password) {
          return {
            data: { user: null, session: null },
            error: new Error("Invalid confirmation number, email, or password."),
          };
        }

        const session = {
          access_token: `mock-token-${user.id}`,
          refresh_token: "mock-refresh-token",
          user,
        };

        return { data: { user, session }, error: null };
      },

      signOut: async () => {
        return { error: null };
      },

      resetPasswordForEmail: async (_email: string, _options?: any) => {
        return { data: {}, error: null };
      },

      resend: async (_options: { type: string; email: string }) => {
        return { data: {}, error: null };
      },

      getUser: async (token?: string) => {
        if (token && token.startsWith("mock-token-")) {
          const id = token.replace("mock-token-", "");
          const user = db.users.get(id);
          if (user) return { data: { user }, error: null };
        }
        const admin = db.users.get("293f2877-1148-45a4-825e-2c4e6efa3e5b");
        return { data: { user: admin || null }, error: null };
      },

      getSession: async () => {
        const admin = db.users.get("293f2877-1148-45a4-825e-2c4e6efa3e5b");
        return {
          data: {
            session: admin
              ? {
                access_token: `mock-token-${admin.id}`,
                user: admin,
              }
              : null,
          },
          error: null,
        };
      },

      setSession: async (session: { access_token?: string; refresh_token?: string }) => {
        return { data: { session, user: null }, error: null };
      },

      onAuthStateChange: (_callback: (event: string, session: any) => void) => {
        return {
          data: {
            subscription: {
              id: "mock-sub-id",
              callback: _callback,
              unsubscribe: () => { },
            },
          },
        };
      },
    },

    storage: {
      from: (_bucket: string) => ({
        list: async (folder?: string) => {
          if (!folder) {
            // Return root folders
            const folders = Array.from(db.storageFiles.keys()).map((k) => ({
              name: k,
              id: k,
              updated_at: new Date().toISOString(),
            }));
            return { data: folders, error: null };
          }
          const files = db.storageFiles.get(folder) || [];
          return { data: files, error: null };
        },

        createSignedUrl: async (filePath: string, _expiresIn: number) => {
          let folder = filePath.includes("/") ? filePath.split("/")[0] : filePath;
          let filename = filePath.includes("/") ? filePath.split("/").slice(1).join("/") : null;

          if (folder && db.storageFiles.has(folder)) {
            const files = db.storageFiles.get(folder) || [];
            if (!filename && files.length > 0 && files[0]) {
              filename = files[0].name;
            }
            if (filename && files.some((f) => f.name === filename)) {
              return {
                data: {
                  signedUrl: `https://mock-storage.equinox.internal/resumes/${folder}/${filename}?token=mock-valid-sig`,
                },
                error: null,
              };
            }
          }

          return {
            data: null,
            error: { message: "Object not found in storage bucket." },
          };
        },

        download: async (_path: string) => {
          const blob = new Blob(["Mock CV Document Binary Content"], {
            type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          });
          return { data: blob, error: null };
        },

        remove: async (paths: string[]) => {
          return { data: paths, error: null };
        },
      }),
    },
  };
}

export function resetMockDatabase() {
  sharedMockDb.seedBaseline();
}