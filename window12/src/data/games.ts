import type { GameEntry } from '../types/desktop'

/** 商店里的游戏目录：都是经典玩法，源码在 components/arcade/games 下 */
export const games: GameEntry[] = [
  {
    id: 'snake',
    name: '贪吃蛇',
    icon: 'mdi-snake',
    category: '街机',
    size: '1.2 MB',
    rating: 4.7,
    developer: 'Window 12 实验室',
    desc: '方向键控制，吃到果实变长，别撞墙也别咬到自己。',
  },
  {
    id: 'whack',
    name: '打地鼠',
    icon: 'mdi-hammer',
    category: '休闲',
    size: '0.8 MB',
    rating: 4.5,
    developer: 'Window 12 实验室',
    desc: '30 秒内敲中尽可能多的地鼠，手越快它冒头越快。',
  },
  {
    id: '2048',
    name: '2048',
    icon: 'mdi-grid',
    category: '益智',
    size: '1.0 MB',
    rating: 4.8,
    developer: 'Window 12 实验室',
    desc: '方向键合并相同数字，一路凑到 2048。',
  },
]
