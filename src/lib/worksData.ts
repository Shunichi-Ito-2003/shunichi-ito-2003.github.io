export type Work = {
  id: string;
  featured: boolean;
  category: string;
  year: string;
  title: string;
  role: string;
  description: string;
  tags: string[];
  image: string;
  objectPosition?: string;
};

export const allWorks: Work[] = [
  {
    id: 'shimamori',
    featured: true,
    category: 'STAGE / ACTING',
    year: '2026',
    title: '島守のうた',
    role: '出演',
    description: '沖縄戦・最後の官選知事・島田叡の物語。沖縄、栃木、兵庫をつなぐ巡回公演。困難な時代に「命どぅ宝」を貫いた人物を演じる。',
    tags: ['舞台', '歴史劇', '沖縄'],
    image: '/写真、画像/島守のうた/語りの役の山城さんが出ている時の画像.jpg',
  },
  {
    id: 'santa',
    featured: true,
    category: 'CHARITY PROJECT',
    year: '2025',
    title: 'みんながサンタ！',
    role: '企画・運営・出演',
    description: 'クリスマスに120家庭へケーキを届けるチャリティー企画。4年目となる2025年は演劇公演のチケット収益をケーキ代に充て、サンタとして子どもたちに届けた。',
    tags: ['チャリティー', '企画', '演劇'],
    image: '/写真、画像/みんながサンタ/2025/劇中の一枚.jpeg',
  },
  {
    id: 'chiiki',
    featured: true,
    category: 'COMMUNITY / STAGE',
    year: '2026',
    title: '地域を応援する演劇',
    role: '企画・脚本・出演',
    description: '俳優が地域の誰かを応援する演劇を上演するプロジェクト。駿一はチーム恵比寿として参加。Season 1でまぁさん堂（南風原）を応援し完走。Season 4では子ども食堂「ニヌファブシ（北極星）」を応援予定。',
    tags: ['地域連携', '企画', '脚本'],
    image: '/写真、画像/地域を応援する演劇/season1　まぁさん堂/チーム恵比寿集合写真.JPG',
  },
  {
    id: 'hitorigei',
    featured: false,
    category: 'SOLO PERFORMANCE',
    year: '2025〜',
    title: '一人芝居',
    role: '作・演出・出演',
    description: '脚本・演出・出演すべてをひとりで担う一人芝居。2025年12月に北谷モッズにて88名満員で初演。2026年からは出張一人芝居として沖縄本島内どこへでも届ける活動を展開中。',
    tags: ['一人芝居', '脚本', '出張公演'],
    image: '/写真、画像/一人芝居/劇中の僕.JPG',
    objectPosition: '50% 18%',
  },
  {
    id: 'citizens',
    featured: true,
    category: 'SHORT FILM',
    year: '2024〜',
    title: 'CITIZENs〜戦わないという選択〜',
    role: 'エキストラ・スタッフ',
    description: '国際映画祭で海外4冠を達成した短編映画。撮影参加・沖縄ワールドプレミアのお手伝いを経て、キネカ大森上映でも満席の熱狂を共に作り上げた。',
    tags: ['映画', '国際映画祭', 'エキストラ'],
    image: '/写真、画像/CITIZENs/cast_group.jpeg',
  },
];
