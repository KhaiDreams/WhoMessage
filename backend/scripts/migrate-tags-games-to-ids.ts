import { TagsGames } from '../src/models/Tags/TagsGames';
import { PreTagsGames } from '../src/models/Tags/PreTagsGames';

async function migrateTagsGamesToIds() {
  const allTagsGames = await TagsGames.findAll();
  for (const tagGame of allTagsGames) {
    // Supondo que o campo antigo era 'name' (array de nomes)
    const names: string[] = (tagGame as any).name || [];
    if (!names.length) continue;
    // Busca os IDs correspondentes aos nomes
    const preTags = await PreTagsGames.findAll({ where: { name: names } });
    const ids = preTags.map(tag => tag.id);
    // Atualiza o registro para usar pre_tag_ids
    tagGame.set('pre_tag_ids', ids);
    // Opcional: remova o campo antigo 'name' se não for mais usado
    await tagGame.save();
  }
  console.log('Migração concluída!');
}

migrateTagsGamesToIds().then(() => process.exit());
