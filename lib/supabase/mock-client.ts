/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Browser-safe Mock Supabase Client.
 * 
 * This file contains NO Node.js-specific imports. All filesystem operations
 * are proxied through /api/mock-db for browser usage.
 * 
 * Server-side code should use `mock-server.ts` for direct filesystem access.
 */

import {
  type MockDatabase,
  type AuthUser,
  type MockUser,
  type MockSession,
  generateUUID,
  simulateWalletTrigger,
  resolveJoins,
} from "@/lib/supabase/mock-shared";

// Re-export types for convenience
export type { MockDatabase, MockUser, MockSession };

// ---------------------------------------------------------------------------
// Browser DB access (via API proxy)
// ---------------------------------------------------------------------------
async function readDBBrowser(): Promise<MockDatabase> {
  const res = await fetch("/api/mock-db", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "readDB" }),
  });
  return res.json();
}

async function writeDBBrowser(db: MockDatabase): Promise<void> {
  await fetch("/api/mock-db", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "writeDB", db }),
  });
}

// ---------------------------------------------------------------------------
// Cookie helpers (browser-only)
// ---------------------------------------------------------------------------
function setSessionCookie(user: MockUser | null): void {
  if (typeof document === "undefined") return;
  if (!user) {
    document.cookie = "sb-mock-session=; path=/; max-age=0";
    return;
  }
  const encoded = btoa(JSON.stringify(user));
  document.cookie = `sb-mock-session=${encoded}; path=/; max-age=${60 * 60 * 24 * 7}`;
}

function getSessionCookieBrowser(): MockUser | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/sb-mock-session=([^;]+)/);
  if (!match) return null;
  try {
    return JSON.parse(atob(match[1]));
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Mock Query Builder (Browser)
// ---------------------------------------------------------------------------
type QueryAction = "select" | "insert" | "update" | "delete";

class MockQueryBuilder implements PromiseLike<any> {
  private _table: string;
  private _action: QueryAction = "select";
  private _selectStr = "*";
  private _filters: Array<{ field: string; op: string; value: any }> = [];
  private _orderField: string | null = null;
  private _orderAsc = true;
  private _limitCount: number | null = null;
  private _isSingle = false;
  private _isMaybeSingle = false;
  private _insertData: any = null;
  private _updateData: any = null;
  private _shouldReturnData = false;

  constructor(table: string) {
    this._table = table;
  }

  select(columns?: string): this {
    if (this._action !== "insert" && this._action !== "update" && this._action !== "delete") {
      this._action = "select";
    }
    if (columns) this._selectStr = columns;
    this._shouldReturnData = true;
    return this;
  }

  insert(data: any | any[]): this {
    this._action = "insert";
    this._insertData = data;
    return this;
  }

  update(data: any): this {
    this._action = "update";
    this._updateData = data;
    return this;
  }

  delete(): this {
    this._action = "delete";
    return this;
  }

  eq(field: string, value: any): this {
    this._filters.push({ field, op: "eq", value });
    return this;
  }

  neq(field: string, value: any): this {
    this._filters.push({ field, op: "neq", value });
    return this;
  }

  in(field: string, values: any[]): this {
    this._filters.push({ field, op: "in", value: values });
    return this;
  }

  order(field: string, opts?: { ascending?: boolean }): this {
    this._orderField = field;
    this._orderAsc = opts?.ascending ?? true;
    return this;
  }

  limit(count: number): this {
    this._limitCount = count;
    return this;
  }

  single(): this {
    this._isSingle = true;
    this._shouldReturnData = true;
    return this;
  }

  maybeSingle(): this {
    this._isMaybeSingle = true;
    this._shouldReturnData = true;
    return this;
  }

  then<TResult1 = any, TResult2 = never>(
    onfulfilled?: ((value: any) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return this._execute().then(onfulfilled, onrejected);
  }

  private async _execute(): Promise<{ data: any; error: any }> {
    try {
      const db = await readDBBrowser();
      let table = (db as any)[this._table] as any[];

      if (!table) {
        return { data: null, error: { message: `Table '${this._table}' not found` } };
      }

      switch (this._action) {
        case "select": {
          let rows = [...table];
          rows = this._applyFilters(rows);
          rows = resolveJoins(this._table, rows, this._selectStr, db);
          rows = this._applyOrder(rows);
          if (this._limitCount !== null) rows = rows.slice(0, this._limitCount);
          if (this._isSingle) {
            if (rows.length === 0) return { data: null, error: { message: "No rows found", code: "PGRST116" } };
            return { data: rows[0], error: null };
          }
          if (this._isMaybeSingle) return { data: rows[0] ?? null, error: null };
          return { data: rows, error: null };
        }

        case "insert": {
          const items = Array.isArray(this._insertData) ? this._insertData : [this._insertData];
          const inserted: any[] = [];
          for (const item of items) {
            const row = { id: generateUUID(), created_at: new Date().toISOString(), ...item };
            table.push(row);
            inserted.push(row);
            if (this._table === "wallet_transactions") simulateWalletTrigger(db, row);
          }
          (db as any)[this._table] = table;
          await writeDBBrowser(db);
          if (this._shouldReturnData) {
            let result: any = inserted;
            result = this._applyFilters(result);
            if (this._isSingle) return { data: result[0] ?? null, error: null };
            if (this._isMaybeSingle) return { data: result[0] ?? null, error: null };
            return { data: result, error: null };
          }
          return { data: inserted, error: null };
        }

        case "update": {
          const matchedRows = this._applyFilters([...table]);
          const matchedIds = new Set(matchedRows.map((r: any) => r.id));
          const updated: any[] = [];
          (db as any)[this._table] = table.map((row: any) => {
            if (matchedIds.has(row.id)) {
              const updatedRow = { ...row, ...this._updateData };
              updated.push(updatedRow);
              return updatedRow;
            }
            return row;
          });
          await writeDBBrowser(db);
          if (this._shouldReturnData) {
            if (this._isSingle) return { data: updated[0] ?? null, error: null };
            if (this._isMaybeSingle) return { data: updated[0] ?? null, error: null };
            return { data: updated, error: null };
          }
          return { data: updated, error: null };
        }

        case "delete": {
          const toDelete = this._applyFilters([...table]);
          const deleteIds = new Set(toDelete.map((r: any) => r.id));
          (db as any)[this._table] = table.filter((row: any) => !deleteIds.has(row.id));
          await writeDBBrowser(db);
          return { data: null, error: null };
        }

        default:
          return { data: null, error: { message: "Unknown action" } };
      }
    } catch (err: any) {
      return { data: null, error: { message: err.message || "Mock DB error" } };
    }
  }

  private _applyFilters(rows: any[]): any[] {
    for (const f of this._filters) {
      switch (f.op) {
        case "eq": rows = rows.filter((r) => String(r[f.field]) === String(f.value)); break;
        case "neq": rows = rows.filter((r) => String(r[f.field]) !== String(f.value)); break;
        case "in": rows = rows.filter((r) => (f.value as any[]).includes(r[f.field])); break;
      }
    }
    return rows;
  }

  private _applyOrder(rows: any[]): any[] {
    if (!this._orderField) return rows;
    const field = this._orderField;
    const asc = this._orderAsc;
    return rows.sort((a, b) => {
      if (a[field] < b[field]) return asc ? -1 : 1;
      if (a[field] > b[field]) return asc ? 1 : -1;
      return 0;
    });
  }
}

// ---------------------------------------------------------------------------
// Mock Auth (Browser)
// ---------------------------------------------------------------------------
class MockAuth {
  private _currentUser: MockUser | null = null;
  private _listeners: Array<(event: string, session: MockSession | null) => void> = [];

  constructor() {
    this._currentUser = getSessionCookieBrowser();
  }

  private _toMockUser(authUser: AuthUser): MockUser {
    return {
      id: authUser.id,
      email: authUser.email,
      user_metadata: { ...authUser.raw_user_meta_data },
      app_metadata: { provider: "email" },
      aud: "authenticated",
      created_at: new Date().toISOString(),
    };
  }

  private _notify(event: string, user: MockUser | null) {
    const session = user ? { access_token: "mock-token", refresh_token: "mock-refresh", user } : null;
    for (const cb of this._listeners) { try { cb(event, session); } catch {} }
  }

  async getSession() {
    if (!this._currentUser) this._currentUser = getSessionCookieBrowser();
    const session = this._currentUser
      ? { access_token: "mock-token", refresh_token: "mock-refresh", user: this._currentUser }
      : null;
    return { data: { session }, error: null };
  }

  async getUser() {
    const { data: { session } } = await this.getSession();
    if (!session) return { data: { user: null }, error: { message: "Not authenticated" } };
    return { data: { user: session.user }, error: null };
  }

  async signInWithPassword(creds: { email: string; password: string }) {
    const db = await readDBBrowser();
    const authUser = db.auth_users.find((u) => u.email === creds.email && u.password === creds.password);
    if (!authUser) return { data: { user: null, session: null }, error: { message: "Invalid login credentials" } };

    const user = this._toMockUser(authUser);
    this._currentUser = user;
    setSessionCookie(user);
    const session: MockSession = { access_token: "mock-token", refresh_token: "mock-refresh", user };
    this._notify("SIGNED_IN", user);
    return { data: { user, session }, error: null };
  }

  async signUp(params: { email: string; password: string; options?: { data?: Record<string, any> } }) {
    const db = await readDBBrowser();
    if (db.auth_users.find((u) => u.email === params.email))
      return { data: { user: null }, error: { message: "User already registered" } };

    const id = generateUUID();
    const meta = params.options?.data ?? {};
    const authUser: AuthUser = { id, email: params.email, password: params.password, raw_user_meta_data: meta };
    db.auth_users.push(authUser);
    db.users.push({
      id, email: params.email, full_name: meta.full_name ?? "", roll_number: null,
      year: null, branch: null, phone: null, role: "student", wallet_balance: 0,
      onboarding_completed: false, created_at: new Date().toISOString(),
    });
    await writeDBBrowser(db);

    const user = this._toMockUser(authUser);
    this._currentUser = user;
    setSessionCookie(user);
    this._notify("SIGNED_IN", user);
    return { data: { user }, error: null };
  }

  async signOut() {
    this._currentUser = null;
    setSessionCookie(null);
    this._notify("SIGNED_OUT", null);
    return { error: null };
  }

  async signInWithOAuth(_opts: any) { return { error: null }; }

  async updateUser(params: { data: Record<string, any> }) {
    if (!this._currentUser) return { data: { user: null }, error: { message: "Not authenticated" } };
    this._currentUser.user_metadata = { ...this._currentUser.user_metadata, ...params.data };

    const db = await readDBBrowser();
    const idx = db.auth_users.findIndex((u) => u.id === this._currentUser!.id);
    if (idx !== -1) db.auth_users[idx].raw_user_meta_data = { ...db.auth_users[idx].raw_user_meta_data, ...params.data };
    await writeDBBrowser(db);
    setSessionCookie(this._currentUser);
    return { data: { user: this._currentUser }, error: null };
  }

  async exchangeCodeForSession(_code: string) { return { error: null }; }

  onAuthStateChange(callback: (event: string, session: MockSession | null) => void) {
    this._listeners.push(callback);
    return { data: { subscription: { unsubscribe: () => { this._listeners = this._listeners.filter((l) => l !== callback); } } } };
  }
}

// ---------------------------------------------------------------------------
// Mock Realtime Channel
// ---------------------------------------------------------------------------
class MockChannel {
  on(_event: string, _config: any, _callback?: any): this { return this; }
  subscribe(): this { return this; }
}

// ---------------------------------------------------------------------------
// Mock Supabase Client (Browser)
// ---------------------------------------------------------------------------
export class MockSupabaseClient {
  auth: MockAuth;
  constructor() { this.auth = new MockAuth(); }
  from(table: string): MockQueryBuilder { return new MockQueryBuilder(table); }
  channel(_name: string): MockChannel { return new MockChannel(); }
  removeChannel(_channel: any): void {}
}

export function createBrowserMockClient(): MockSupabaseClient {
  return new MockSupabaseClient();
}
