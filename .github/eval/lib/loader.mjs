import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import yaml from 'js-yaml';

/**
 * Parse YAML frontmatter from a markdown file.
 * Returns an object with frontmatter keys (empty object if none found).
 */
export function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  try {
    return yaml.load(match[1]) || {};
  } catch {
    return {};
  }
}

/**
 * Load all skill files from `dir`, returning:
 *   { file, name, description, argumentHint, lines, searchText }
 *
 * Filters for files ending in -SKILL.md or _SKILL.md.
 */
export function loadSkills(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  return entries
    .filter(e => e.isFile() && (e.name.endsWith('-SKILL.md') || e.name.endsWith('_SKILL.md')))
    .map(e => {
      const content = readFileSync(join(dir, e.name), 'utf-8');
      const fm = parseFrontmatter(content);
      const lines = content.split('\n').length;
      const searchText = [fm.name, fm.description, fm['argument-hint']]
        .filter(Boolean)
        .join(' ');
      return {
        file: e.name,
        name: fm.name || e.name,
        description: fm.description || '',
        argumentHint: fm['argument-hint'] || '',
        lines,
        searchText,
      };
    });
}
