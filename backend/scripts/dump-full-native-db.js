"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const connectionString = 'postgresql://postgres:password@localhost:5432/s2s_matrimony?schema=public';
const pool = new pg_1.Pool({ connectionString });
function escapeValue(val) {
    if (val === null || val === undefined)
        return 'NULL';
    if (typeof val === 'number' || typeof val === 'boolean')
        return String(val);
    if (val instanceof Date)
        return `'${val.toISOString()}'`;
    if (Array.isArray(val)) {
        if (val.length === 0)
            return "'{}'";
        const escapedElements = val.map((item) => {
            if (typeof item === 'string')
                return `"${item.replace(/"/g, '\\"')}"`;
            return String(item);
        }).join(',');
        return `'${escapedElements}'`;
    }
    if (typeof val === 'object')
        return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
    return `'${String(val).replace(/'/g, "''")}'`;
}
async function generateFullDump() {
    console.log('📦 Starting 100% Comprehensive Local PostgreSQL Dump...');
    const client = await pool.connect();
    try {
        const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
        const tableNames = tablesRes.rows.map((r) => r.table_name);
        console.log(`Found ${tableNames.length} tables in local s2s_matrimony database.`);
        let sqlDump = `-- ========================================================\n`;
        sqlDump += `-- S2S Matrimony 100% Complete Database Dump\n`;
        sqlDump += `-- Exported at ${new Date().toISOString()}\n`;
        sqlDump += `-- Total Tables: ${tableNames.length}\n`;
        sqlDump += `-- ========================================================\n\n`;
        sqlDump += `SET statement_timeout = 0;\n`;
        sqlDump += `SET lock_timeout = 0;\n`;
        sqlDump += `SET client_encoding = 'UTF8';\n`;
        sqlDump += `SET standard_conforming_strings = on;\n`;
        sqlDump += `SET check_function_bodies = false;\n`;
        sqlDump += `SET xmloption = content;\n`;
        sqlDump += `SET client_min_messages = warning;\n`;
        sqlDump += `SET row_security = off;\n\n`;
        sqlDump += `SET session_replication_role = 'replica';\n\n`;
        const summaryStats = [];
        for (const tableName of tableNames) {
            const rowsRes = await client.query(`SELECT * FROM "${tableName}"`);
            const rows = rowsRes.rows;
            summaryStats.push({ table: tableName, count: rows.length });
            if (rows.length === 0) {
                console.log(`   [Empty] ${tableName}: 0 rows`);
                continue;
            }
            console.log(`   [Exporting] ${tableName}: ${rows.length} rows`);
            sqlDump += `-- --------------------------------------------------------\n`;
            sqlDump += `-- Table Data: "${tableName}" (${rows.length} rows)\n`;
            sqlDump += `-- --------------------------------------------------------\n`;
            sqlDump += `TRUNCATE TABLE "${tableName}" CASCADE;\n`;
            const columns = Object.keys(rows[0]).map((c) => `"${c}"`).join(', ');
            for (const row of rows) {
                const values = Object.values(row).map((v) => escapeValue(v)).join(', ');
                sqlDump += `INSERT INTO "${tableName}" (${columns}) VALUES (${values}) ON CONFLICT DO NOTHING;\n`;
            }
            sqlDump += `\n`;
        }
        sqlDump += `SET session_replication_role = 'origin';\n`;
        const outputPath = path.join(__dirname, '../../s2s_matrimony_dump.sql');
        fs.writeFileSync(outputPath, sqlDump, 'utf8');
        console.log('\n================ DATA EXTRACTION SUMMARY ================');
        summaryStats.forEach((st) => {
            if (st.count > 0) {
                console.log(`  ✓ ${st.table.padEnd(25)} : ${st.count} records`);
            }
        });
        console.log('=========================================================\n');
        console.log(`✅ Full Database Dump saved to: ${outputPath}`);
        console.log(`Total Size: ${(fs.statSync(outputPath).size / 1024).toFixed(2)} KB`);
    }
    catch (err) {
        console.error('❌ Error generating dump:', err);
    }
    finally {
        client.release();
        await pool.end();
    }
}
generateFullDump();
//# sourceMappingURL=dump-full-native-db.js.map