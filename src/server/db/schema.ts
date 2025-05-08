import { sql } from "drizzle-orm";
import { index, pgTableCreator } from "drizzle-orm/pg-core";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `election_${name}`);

/**
 * Stations table - represents the 82 polling stations
 */
export const stations = createTable(
  "station",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    name: d.varchar({ length: 100 }).notNull(),
    location: d.varchar({ length: 256 }),
    capacity: d.integer(),
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [index("station_name_idx").on(t.name)],
);

/**
 * Turnout table - tracks voter turnout at each station
 */
export const turnouts = createTable(
  "turnout",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    stationId: d.integer().references(() => stations.id, { onDelete: "cascade" }).notNull(),
    voterCount: d.integer().default(0).notNull(),
    updatedBy: d.varchar({ length: 100 }),
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [index("turnout_station_idx").on(t.stationId)],
);

/**
 * Staff table - tracks staff members who can update turnout data
 */
export const staffMembers = createTable(
  "staff",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    name: d.varchar({ length: 256 }).notNull(),
    username: d.varchar({ length: 100 }).notNull().unique(),
    passwordHash: d.varchar({ length: 256 }).notNull(),
    role: d.varchar({ length: 50 }).default("staff").notNull(),
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [index("staff_username_idx").on(t.username)],
);

/**
 * Audit log - tracks all changes to turnout data
 */
export const auditLogs = createTable(
  "audit_log",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    stationId: d.integer().references(() => stations.id).notNull(),
    staffId: d.integer().references(() => staffMembers.id),
    action: d.varchar({ length: 50 }).notNull(),
    previousValue: d.integer(),
    newValue: d.integer(),
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  }),
  (t) => [index("audit_station_idx").on(t.stationId)],
);
