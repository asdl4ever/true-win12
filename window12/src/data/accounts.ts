import type { Account } from '../types/desktop'

/** 插画头像来源：小尺寸下线条清晰，色系也压得住奶黄壁纸 */
const avatarUrl = (seed: string) => `https://api.dicebear.com/9.x/micah/svg?seed=${seed}`

/** 机器上的账号：任务栏账号态展示当前账号 */
export const accounts: Account[] = [
  {
    id: 'nailong',
    name: '奶龙',
    initial: '奶',
    role: '管理员',
    accent: '#6d4ab8',
    avatar: avatarUrl('Nailong'),
  },
  {
    id: 'xiaoman',
    name: '林小满',
    initial: '林',
    role: '标准用户',
    accent: '#a83a68',
    avatar: avatarUrl('Xiaoman'),
  },
  {
    id: 'ayan',
    name: '阿岩',
    initial: '岩',
    role: '标准用户',
    accent: '#4f7a44',
    avatar: avatarUrl('Ayan'),
  },
]
