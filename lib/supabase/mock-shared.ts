/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Edge-safe shared utilities for Mock Supabase Mode.
 * This file contains NO Node.js-specific imports (no `fs`, `path`, `process`)
 * and is safe to import from Edge Runtime (middleware) and the browser.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface MockDatabase {
  auth_users: AuthUser[];
  users: any[];
  menu_items: any[];
  orders: any[];
  order_items: any[];
  wallet_transactions: any[];
  payment_settings: any[];
  notifications: any[];
}

export interface AuthUser {
  id: string;
  email: string;
  password: string;
  raw_user_meta_data: Record<string, any>;
}

export interface MockUser {
  id: string;
  email: string;
  user_metadata: Record<string, any>;
  app_metadata: { provider: string };
  aud: string;
  created_at: string;
}

export interface MockSession {
  access_token: string;
  refresh_token: string;
  user: MockUser;
}

// ---------------------------------------------------------------------------
// Cookie parser (Edge-safe – uses only standard Web APIs)
// ---------------------------------------------------------------------------

/**
 * Parse a mock user from a raw cookie header string.
 * Uses `atob()` which is available in both Edge Runtime and browsers.
 */
export function parseSessionFromCookieString(cookieStr: string): MockUser | null {
  const match = cookieStr.match(/sb-mock-session=([^;]+)/);
  if (!match) return null;
  try {
    return JSON.parse(atob(match[1]));
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// UUID Generator (Edge-safe)
// ---------------------------------------------------------------------------
export function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ---------------------------------------------------------------------------
// Relationship map for join queries
// ---------------------------------------------------------------------------
export const RELATIONSHIPS: Record<string, Record<string, { foreignKey: string; targetKey: string }>> = {
  orders: {
    order_items: { foreignKey: "order_id", targetKey: "id" },
    users: { foreignKey: "user_id", targetKey: "id" },
  },
  order_items: {
    menu_items: { foreignKey: "menu_item_id", targetKey: "id" },
  },
};

// ---------------------------------------------------------------------------
// Wallet trigger simulation
// ---------------------------------------------------------------------------
export function simulateWalletTrigger(db: MockDatabase, transaction: any): void {
  const userIdx = db.users.findIndex((u: any) => u.id === transaction.user_id);
  if (userIdx === -1) return;
  if (transaction.type === "credit") {
    db.users[userIdx].wallet_balance = Number(db.users[userIdx].wallet_balance) + Number(transaction.amount);
  } else if (transaction.type === "debit") {
    db.users[userIdx].wallet_balance = Number(db.users[userIdx].wallet_balance) - Number(transaction.amount);
  }
}

// ---------------------------------------------------------------------------
// Join resolver
// ---------------------------------------------------------------------------

interface RelationInfo {
  table: string;
  columns: string;
  nested: RelationInfo[];
}

function parseSelectRelations(selectStr: string): RelationInfo[] {
  const relations: RelationInfo[] = [];
  const regex = /(\w+)\s*\(([^()]*(?:\([^()]*\))?[^()]*)\)/g;
  let match;
  while ((match = regex.exec(selectStr)) !== null) {
    const table = match[1];
    const inner = match[2];
    relations.push({
      table,
      columns: inner,
      nested: parseSelectRelations(inner),
    });
  }
  return relations;
}

export function resolveJoins(
  mainTable: string,
  rows: any[],
  selectStr: string,
  db: MockDatabase,
): any[] {
  const relations = parseSelectRelations(selectStr);
  if (relations.length === 0) return rows;

  return rows.map((row) => {
    const enriched = { ...row };
    for (const rel of relations) {
      const relConfig = RELATIONSHIPS[mainTable]?.[rel.table];
      if (!relConfig) continue;

      const childTable = (db as any)[rel.table] as any[];
      if (!childTable) continue;

      let children = childTable.filter(
        (child: any) => child[relConfig.foreignKey] === row[relConfig.targetKey],
      );

      // Recursively resolve nested joins
      if (rel.nested.length > 0) {
        children = children.map((child: any) => {
          const enrichedChild = { ...child };
          for (const nestedRel of rel.nested) {
            const nestedConfig = RELATIONSHIPS[rel.table]?.[nestedRel.table];
            if (!nestedConfig) continue;
            const nestedTable = (db as any)[nestedRel.table] as any[];
            if (!nestedTable) continue;
            const nestedMatch = nestedTable.find(
              (n: any) => n[nestedConfig.targetKey] === child[nestedConfig.foreignKey],
            );
            enrichedChild[nestedRel.table] = nestedMatch ?? null;
          }
          return enrichedChild;
        });
      }

      enriched[rel.table] = children;
    }
    return enriched;
  });
}
