

import sequelize from '../src/database/db';
import { QueryTypes } from 'sequelize';
import { PreTagsGames } from '../src/models/Tags/PreTagsGames';
import { PreTagsInterests } from '../src/models/Tags/PreTagsInterests';


// Função para parsear array do Postgres vindo como string
function parsePgArray(str: string): string[] {
  if (!str || typeof str !== 'string') return [];
  return str
    .replace(/^{|}$/g, '')
    .split(',')
    .map(s => s.replace(/^"|"$/g, '').trim())
    .filter(Boolean);
}



interface Row {
  id: number;
  user_id: number;
  pre_tag_ids: string[]; // agora é array de nomes (strings)
}

interface MigrateTableParams {
  table: string;
  preTagModel: any;
  label: string;
}

async function migrateTable({ table, preTagModel, label }: MigrateTableParams) {
  // Busca todos os registros, incluindo o campo antigo de nomes
  const rows = await sequelize.query<Row>(
    `SELECT id, user_id, pre_tag_ids FROM ${table}`,
    { type: QueryTypes.SELECT }
  ) as Row[];
  for (const row of rows) {
    // pre_tag_ids está como array de nomes (strings)
    const names = Array.isArray(row.pre_tag_ids) ? row.pre_tag_ids : parsePgArray(row.pre_tag_ids as any);
    console.log(`[${label}] id=${row.id} | nomes extraídos:`, names);
    if (!names.length) {
      console.log(`[${label}] id=${row.id} ignorado (sem nomes)`);
      continue;
    }
    const preTags = await preTagModel.findAll({ where: { name: names } });
    const ids = preTags.map((tag: { id: number }) => tag.id);
    if (!ids.length) {
      console.warn(`[${label}] Nenhum ID encontrado para nomes: ${names.join(', ')} (id=${row.id})`);
    }
    // Atualiza o registro com os novos IDs
    // Formata os IDs para o formato de array do Postgres
    const idsPgArray = `{${ids.join(',')}}`;
    await sequelize.query(
      `UPDATE ${table} SET pre_tag_ids = :ids WHERE id = :id`,
      { replacements: { ids: idsPgArray, id: row.id } }
    );
    console.log(`[${label}] id=${row.id} migrado:`, { names, ids });
  }
  console.log(`[${label}] Migração concluída!`);
}

async function migrateAll() {
  await migrateTable({ table: 'tags_games', preTagModel: PreTagsGames, label: 'tags_games' });
  await migrateTable({ table: 'tags_interests', preTagModel: PreTagsInterests, label: 'tags_interests' });
}

migrateAll().then(() => process.exit());
