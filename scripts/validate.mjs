#!/usr/bin/env node
// Cross-tool plugin manifest & marketplace validator.
// Validates Claude Code and Codex CLI manifests + SKILL.md frontmatter
// against minimal, locally-embedded schemas (no network calls).

import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import matter from 'gray-matter';

const repoRoot = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

const errors = [];

function fail(file, msg) {
  errors.push(`✗ ${path.relative(repoRoot, file)}: ${msg}`);
}

function ok(file, msg) {
  console.log(`✓ ${path.relative(repoRoot, file)}${msg ? ' — ' + msg : ''}`);
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    fail(file, `invalid JSON: ${err.message}`);
    return null;
  }
}

// ---------------- Schemas (minimal, locally embedded) ----------------

const authorSchema = {
  type: 'object',
  required: ['name'],
  properties: {
    name: { type: 'string', minLength: 1 },
    email: { type: 'string', format: 'email' },
    url: { type: 'string', format: 'uri' },
  },
};

const claudePluginManifestSchema = {
  type: 'object',
  required: ['name', 'description', 'author'],
  properties: {
    name: { type: 'string', minLength: 1, pattern: '^[a-z0-9][a-z0-9-]*$' },
    version: { type: 'string', minLength: 1 },
    description: { type: 'string', minLength: 1 },
    author: authorSchema,
    homepage: { type: 'string', format: 'uri' },
    license: { type: 'string' },
    keywords: { type: 'array', items: { type: 'string' } },
  },
};

const codexPluginManifestSchema = {
  type: 'object',
  required: ['name', 'version', 'description', 'author'],
  properties: {
    name: { type: 'string', minLength: 1, pattern: '^[a-z0-9][a-z0-9-]*$' },
    version: { type: 'string', minLength: 1 },
    description: { type: 'string', minLength: 1 },
    author: authorSchema,
    skills: { type: 'array', items: { type: 'string', minLength: 1 } },
    hooks: { type: 'array', items: { type: 'string' } },
    mcpServers: { type: 'array', items: { type: 'string' } },
    apps: { type: 'array', items: { type: 'string' } },
  },
};

const claudeMarketplaceSchema = {
  type: 'object',
  required: ['name', 'owner', 'plugins'],
  properties: {
    $schema: { type: 'string' },
    name: { type: 'string', minLength: 1 },
    description: { type: 'string' },
    owner: authorSchema,
    plugins: {
      type: 'array',
      items: {
        type: 'object',
        required: ['name', 'source'],
        properties: {
          name: { type: 'string', minLength: 1, pattern: '^[a-z0-9][a-z0-9-]*$' },
          description: { type: 'string' },
          source: {
            oneOf: [
              { type: 'string' },
              {
                type: 'object',
                required: ['source'],
                properties: {
                  source: { type: 'string', enum: ['github', 'git', 'url', 'git-subdir', 'local'] },
                  repo: { type: 'string' },
                  url: { type: 'string' },
                  path: { type: 'string' },
                  ref: { type: 'string' },
                  sha: { type: 'string' },
                },
              },
            ],
          },
          author: authorSchema,
          category: { type: 'string' },
          homepage: { type: 'string' },
          strict: { type: 'boolean' },
        },
      },
    },
  },
};

const codexMarketplaceSchema = {
  type: 'object',
  required: ['name', 'plugins'],
  properties: {
    name: { type: 'string', minLength: 1 },
    description: { type: 'string' },
    owner: authorSchema,
    plugins: {
      type: 'array',
      items: {
        type: 'object',
        required: ['name', 'source'],
        properties: {
          name: { type: 'string', minLength: 1, pattern: '^[a-z0-9][a-z0-9-]*$' },
          description: { type: 'string' },
          source: {
            oneOf: [
              { type: 'string' },
              { type: 'object' },
            ],
          },
        },
      },
    },
  },
};

const skillFrontmatterSchema = {
  type: 'object',
  required: ['name', 'description'],
  properties: {
    name: { type: 'string', minLength: 1 },
    description: { type: 'string', minLength: 1 },
  },
};

// ---------------- Validation runners ----------------

function validateJson(file, schema, label) {
  if (!fs.existsSync(file)) {
    fail(file, `missing required file (${label})`);
    return;
  }
  const data = readJson(file);
  if (data === null) return;
  const validate = ajv.compile(schema);
  if (validate(data)) {
    ok(file, label);
  } else {
    for (const err of validate.errors || []) {
      fail(file, `${label} — ${err.instancePath || '/'} ${err.message}`);
    }
  }
}

function listSkillFiles(rootDir) {
  const out = [];
  if (!fs.existsSync(rootDir)) return out;
  const stack = [rootDir];
  while (stack.length) {
    const cur = stack.pop();
    for (const ent of fs.readdirSync(cur, { withFileTypes: true })) {
      const full = path.join(cur, ent.name);
      if (ent.isDirectory()) stack.push(full);
      else if (ent.isFile() && ent.name === 'SKILL.md') out.push(full);
    }
  }
  return out;
}

function validateSkill(file) {
  const raw = fs.readFileSync(file, 'utf8');
  const parsed = matter(raw);
  const validate = ajv.compile(skillFrontmatterSchema);
  if (validate(parsed.data)) {
    ok(file, 'SKILL.md frontmatter');
  } else {
    for (const err of validate.errors || []) {
      fail(file, `SKILL.md frontmatter — ${err.instancePath || '/'} ${err.message}`);
    }
  }
  const skillDirName = path.basename(path.dirname(file));
  if (parsed.data.name && parsed.data.name !== skillDirName) {
    fail(file, `frontmatter name "${parsed.data.name}" must match parent dir "${skillDirName}"`);
  }
}

// ---------------- Main ----------------

console.log('Validating cross-tool plugin manifests...\n');

// Marketplace indices
validateJson(path.join(repoRoot, '.claude-plugin/marketplace.json'), claudeMarketplaceSchema, 'Claude marketplace');
validateJson(path.join(repoRoot, '.agents/plugins/marketplace.json'), codexMarketplaceSchema, 'Codex marketplace');

// Per-plugin manifests
const pluginsDir = path.join(repoRoot, 'plugins');
if (fs.existsSync(pluginsDir)) {
  for (const ent of fs.readdirSync(pluginsDir, { withFileTypes: true })) {
    if (!ent.isDirectory()) continue;
    const pluginRoot = path.join(pluginsDir, ent.name);
    validateJson(path.join(pluginRoot, '.claude-plugin/plugin.json'), claudePluginManifestSchema, 'Claude plugin manifest');
    validateJson(path.join(pluginRoot, '.codex-plugin/plugin.json'), codexPluginManifestSchema, 'Codex plugin manifest');
    for (const skillFile of listSkillFiles(path.join(pluginRoot, 'skills'))) {
      validateSkill(skillFile);
    }
  }
}

// Cross-check that each Claude marketplace plugin entry has matching plugin dir
const claudeMarket = readJson(path.join(repoRoot, '.claude-plugin/marketplace.json'));
if (claudeMarket && Array.isArray(claudeMarket.plugins)) {
  for (const entry of claudeMarket.plugins) {
    if (typeof entry.source === 'string' && entry.source.startsWith('./')) {
      const target = path.join(repoRoot, entry.source);
      if (!fs.existsSync(target)) {
        fail(path.join(repoRoot, '.claude-plugin/marketplace.json'), `plugin "${entry.name}" source path missing: ${entry.source}`);
      }
    }
  }
}

console.log('');
if (errors.length) {
  console.error(`Found ${errors.length} error(s):`);
  for (const e of errors) console.error('  ' + e);
  process.exit(1);
}
console.log('All manifests are valid.');
