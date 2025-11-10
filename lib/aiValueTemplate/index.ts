// 各カテゴリのテンプレートファイルをインポート
import { foodTemplates } from './01_food';
import { shoppingTemplates } from './02_shopping';
import { beautyHealthTemplates } from './03_beauty';
import { livingTemplates } from './04_living';
import { educationTemplates } from './05_education';
import { sportsTemplates } from './06_sports';
import { autoTemplates } from './07_auto';
import { leisureTemplates } from './08_leisure';
import { petsTemplates } from './09_pets';
import { servicesTemplates } from './10_services';
import { otherTemplates } from './99_other';

// すべてのテンプレートオブジェクトを1つに統合（マージ）
export const VALUE_QUESTIONS: Record<string, Record<string, string[]>> = {
  ...foodTemplates,
  ...shoppingTemplates,
  ...beautyHealthTemplates,
  ...livingTemplates,
  ...educationTemplates,
  ...sportsTemplates,
  ...autoTemplates,
  ...leisureTemplates,
  ...petsTemplates,
  ...servicesTemplates,
  ...otherTemplates,
};